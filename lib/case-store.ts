import { env } from 'cloudflare:workers';
import type { CaseProject, RecordItem, CaseData } from './case-domain';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const bindings = () =>
  env as unknown as {
    DB: D1Database;
    BUCKET: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    MODEL_DAILY_LIMIT?: string;
    USCOO_ADMIN_USER_IDS?: string;
    USCOO_SITES_AUTH_TRUSTED?: string;
    RESEND_API_KEY?: string;
    USCOO_EMAIL_FROM?: string;
  };
export const now = () => new Date().toISOString();

/**
 * The oai-authenticated-user-* headers are only trustworthy when ChatGPT
 * Sites injected them. A fork must explicitly opt in from its Sites runtime;
 * the default is fail-closed so a normal public deployment cannot be fooled
 * by a client-supplied header.
 */
export function sitesAuthConfigured() {
  return bindings().USCOO_SITES_AUTH_TRUSTED === 'true';
}

export function trustedUserId(req: Request) {
  if (!sitesAuthConfigured()) return null;
  const user = req.headers.get('oai-authenticated-user-id');
  const email = req.headers.get('oai-authenticated-user-email');
  if (!user || !email) return null;
  return user;
}

export const uid = () => crypto.randomUUID();
export const hash = async (value: string | ArrayBuffer) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        typeof value === 'string' ? new TextEncoder().encode(value) : value,
      ),
    ),
  )
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
export const db = () => {
  const d = bindings().DB;
  if (!d)
    throw new HttpError(503, '资料服务暂时不可用。请保留输入，稍后重试。');
  return d;
};
export function identity(req: Request) {
  if (!sitesAuthConfigured())
    throw new HttpError(
      503,
      '此工作台必须运行在已配置的 ChatGPT Sites 环境中。请先完成可信身份适配。',
    );
  const user = trustedUserId(req);
  if (!user) throw new HttpError(401, '请先登录，再打开申请项目。');
  return user;
}
export function sameOrigin(req: Request) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (!origin || origin !== new URL(req.url).origin)
      throw new HttpError(403, '请从本站页面执行此操作。');
  }
}
export async function jsonBody(req: Request) {
  const s = await req.text();
  if (s.length > 150000) throw new HttpError(413, '内容太长，请分为几份材料。');
  try {
    return JSON.parse(s);
  } catch {
    throw new HttpError(400, '内容格式无法读取。');
  }
}
export function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
export function failure(e: unknown) {
  if (e instanceof HttpError) return reply({ error: e.message }, e.status);
  if (e && typeof e === 'object' && 'issues' in e)
    return reply({ error: '请检查必填项、日期或文本长度。' }, 400);
  console.error(
    'USCOO request failed',
    e instanceof Error ? e.name : 'unknown',
  );
  return reply({ error: '这次操作没有完成。输入仍保留，请稍后重试。' }, 503);
}
export function projectRow(r: any): CaseProject {
  return {
    id: r.id,
    title: r.title,
    profile: JSON.parse(r.profile),
    revision: r.revision,
    created: r.created,
    updated: r.updated,
  };
}
export function recordRow(r: any): RecordItem {
  return {
    id: r.id,
    projectId: r.project_id,
    kind: r.kind,
    body: JSON.parse(r.body),
    version: r.version,
    created: r.created,
    updated: r.updated,
  };
}
export async function owned(id: string, user: string) {
  const p = await db()
    .prepare('SELECT * FROM projects WHERE id=? AND owner=?')
    .bind(id, user)
    .first();
  if (!p) throw new HttpError(404, '项目不存在或不可访问。');
  return projectRow(p);
}
export async function readCase(id: string, user: string): Promise<CaseData> {
  const project = await owned(id, user);
  const [r, j, a, s] = await Promise.all([
    db()
      .prepare('SELECT * FROM records WHERE project_id=? ORDER BY created')
      .bind(id)
      .all(),
    db()
      .prepare(
        'SELECT * FROM jobs WHERE project_id=? ORDER BY created DESC LIMIT 30',
      )
      .bind(id)
      .all(),
    db()
      .prepare(
        'SELECT action,record_id,revision,created FROM audit WHERE project_id=? ORDER BY created DESC LIMIT 100',
      )
      .bind(id)
      .all(),
    db()
      .prepare(
        "SELECT id,expires,revoked,created,json_extract(snapshot,'$.kind') AS kind FROM shares WHERE project_id=? ORDER BY created DESC",
      )
      .bind(id)
      .all(),
  ]);
  return {
    project,
    records: r.results.map(recordRow),
    jobs: j.results.map((x: any) => ({
      ...x,
      result: x.result ? JSON.parse(x.result) : null,
    })),
    audit: a.results,
    shares: s.results,
  };
}
export async function record(id: string, project: string) {
  const r = await db()
    .prepare('SELECT * FROM records WHERE id=? AND project_id=?')
    .bind(id, project)
    .first();
  if (!r) throw new HttpError(404, '材料不存在或不可访问。');
  return recordRow(r);
}
// Revision and dependent writes are one atomic D1 batch. Stale requests write nothing.
export async function mutate(
  p: CaseProject,
  user: string,
  revision: number,
  action: string,
  recordId: string | null,
  statements: (token: string) => D1PreparedStatement[],
  profile?: unknown,
) {
  if (revision !== p.revision)
    throw new HttpError(
      409,
      '项目在另一处已更新。请刷新后核对；本次输入仍保留。',
    );
  const token = uid(),
    time = now();
  const update =
    profile === undefined
      ? db()
          .prepare(
            'UPDATE projects SET revision=revision+1,mutation=?,updated=? WHERE id=? AND owner=? AND revision=?',
          )
          .bind(token, time, p.id, user, revision)
      : db()
          .prepare(
            'UPDATE projects SET profile=?,revision=revision+1,mutation=?,updated=? WHERE id=? AND owner=? AND revision=?',
          )
          .bind(JSON.stringify(profile), token, time, p.id, user, revision);
  const out = await db().batch([
    update,
    ...statements(token),
    db()
      .prepare(
        'INSERT INTO audit (id,project_id,actor,action,record_id,revision,created) SELECT ?,?,?,?, ?,revision,? FROM projects WHERE id=? AND mutation=?',
      )
      .bind(uid(), p.id, user, action, recordId, time, p.id, token),
  ]);
  if (!out[0].meta.changes)
    throw new HttpError(409, '项目已有新的修改。请刷新后重试。');
}
export function writeRecord(
  p: string,
  id: string,
  kind: string,
  body: unknown,
  token: string,
) {
  const time = now();
  return db()
    .prepare(
      'INSERT INTO records (id,project_id,kind,body,version,created,updated) SELECT ?,?,?,?,1,?,? FROM projects WHERE id=? AND mutation=? ON CONFLICT(id) DO UPDATE SET body=excluded.body,version=records.version+1,updated=excluded.updated WHERE records.project_id=excluded.project_id AND records.kind=excluded.kind',
    )
    .bind(id, p, kind, JSON.stringify(body), time, time, p, token);
}
export function archiveRecord(p: string, id: string, token: string) {
  return db()
    .prepare(
      'INSERT INTO record_versions (id,project_id,record_id,version,body,created) SELECT ?,project_id,id,version,body,? FROM records WHERE id=? AND project_id=? AND EXISTS(SELECT 1 FROM projects WHERE id=? AND mutation=?)',
    )
    .bind(uid(), now(), id, p, p, token);
}
export function invalidate(
  p: string,
  token: string,
  docs = true,
): D1PreparedStatement[] {
  const out = [
    db()
      .prepare(
        "UPDATE records SET body=json_set(body,'$.confirmed',json('false')),updated=? WHERE project_id=? AND kind='gate' AND EXISTS(SELECT 1 FROM projects WHERE id=? AND mutation=?)",
      )
      .bind(now(), p, p, token),
  ];
  if (docs)
    out.push(
      db()
        .prepare(
          "UPDATE records SET body=json_set(body,'$.stale',json('true'),'$.state','working'),updated=? WHERE project_id=? AND kind='document' AND EXISTS(SELECT 1 FROM projects WHERE id=? AND mutation=?)",
        )
        .bind(now(), p, p, token),
    );
  return out;
}
