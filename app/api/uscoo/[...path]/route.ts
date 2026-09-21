import { z } from 'zod';
import {
  intakeSchema,
  COMPANY_LABEL,
  TIMING_LABEL,
} from '@/lib/founder-intake';
import { bodySchemas, profileSchema } from '@/lib/case-validation';
import {
  INITIAL_TASKS,
  COMPANY_PLAN_TASKS,
  OFFICIAL,
  CRITERIA,
  getGateState,
  type CaseData,
  type Kind,
} from '@/lib/case-domain';
import {
  bindings,
  db,
  now,
  uid,
  hash,
  HttpError,
  identity,
  sameOrigin,
  jsonBody,
  reply,
  failure,
  owned,
  readCase,
  record,
  projectRow,
  mutate,
  writeRecord,
  archiveRecord,
  invalidate,
} from '@/lib/case-store';
import {
  buildDraft,
  validateCanonical,
  docxBytes,
  printHtml,
  exportCase,
  DOC_TYPES,
} from '@/lib/case-documents';
import { agentReview } from '@/lib/case-agent';
import { buildLawyerBrief } from '@/lib/lawyer-brief';
import {
  requireWorkspaceAccess,
} from '@/lib/account-store';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
const CORE_OPERATIONS = new Set([
  'agent',
  'company-plan',
  'documents',
  'draft',
  'export',
  'files',
  'freeze',
  'history',
  'lawyer-brief',
  'lawyer-shares',
  'packets',
  'records',
  'rules',
  'shares',
  'upload',
]);
const download = (data: Uint8Array | string, type: string, name: string) =>
  new Response(data as BodyInit, {
    headers: {
      'Content-Type': type,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
async function handle(req: Request, ctx: Context) {
  try {
    const path = (await ctx.params).path,
      user = identity(req),
      method = req.method;
    sameOrigin(req);
    if (path[0] !== 'projects') throw new HttpError(404, '页面不存在。');
    if (path.length === 1) {
      if (method === 'GET') {
        const p = await db()
          .prepare(
            'SELECT * FROM projects WHERE owner=? ORDER BY updated DESC LIMIT 30',
          )
          .bind(user)
          .all();
        return reply({
          projects: p.results.map(projectRow),
          capabilities: {
            storage: !!bindings().BUCKET,
            model: !!bindings().OPENAI_API_KEY && !!bindings().OPENAI_MODEL,
            ocr: false,
            access: 'private-beta',
          },
        });
      }
      if (method === 'POST') {
        await requireWorkspaceAccess(req);
        const b = z
          .object({
            title: z.string().trim().min(1).max(120),
            requestId: z.string().uuid(),
            intake: intakeSchema.optional(),
          })
          .parse(await jsonBody(req));
        const existing = await db()
          .prepare('SELECT * FROM projects WHERE id=? AND owner=?')
          .bind(b.requestId, user)
          .first();
        if (existing) return reply({ project: projectRow(existing) });
        const id = b.requestId,
          t = now();
        const count = await db()
          .prepare('SELECT COUNT(*) AS n FROM projects WHERE owner=?')
          .bind(user)
          .first<any>();
        if (count.n >= 10)
          throw new HttpError(422, '当前最多保存 10 个申请项目。');
        await db().batch([
          db()
            .prepare(
              'INSERT INTO projects (id,owner,title,profile,revision,mutation,created,updated) VALUES (?,?,?,?,0,?,?,?)',
            )
            .bind(
              id,
              user,
              b.title,
              JSON.stringify(
                b.intake
                  ? {
                      field: b.intake.field,
                      name: b.intake.beneficiaryName,
                      company: b.intake.petitionerName,
                      desiredApproval: b.intake.desiredApproval,
                      arrivalDate: b.intake.arrivalDate,
                      start: b.intake.workStartDate,
                      duties: b.intake.workPlan,
                      location: b.intake.location,
                      companyState: COMPANY_LABEL[b.intake.company],
                      companyGoal:
                        b.intake.company === 'planning'
                          ? 'new-o1a'
                          : b.intake.company === 'existing'
                            ? 'existing-o1a'
                            : 'undecided',
                      target: TIMING_LABEL[b.intake.timing],
                    }
                  : {},
              ),
              '',
              t,
              t,
            ),
          ...(b.intake
            ? [
                db()
                  .prepare(
                    'INSERT INTO records (id,project_id,kind,body,version,created,updated) VALUES (?,?,?, ?,1,?,?)',
                  )
                  .bind(
                    uid(),
                    id,
                    'intake',
                    JSON.stringify({
                      ...b.intake,
                      title: '开始准备前的经历梳理',
                      confirmed: false,
                      savedAt: t,
                    }),
                    t,
                    t,
                  ),
              ]
            : []),
          ...(b.intake?.standoutStory.trim()
            ? [
                db()
                  .prepare(
                    'INSERT INTO records (id,project_id,kind,body,version,created,updated) VALUES (?,?,?, ?,1,?,?)',
                  )
                  .bind(
                    uid(),
                    id,
                    'event',
                    JSON.stringify({
                      title: '初步评估中的代表经历',
                      date: '',
                      role: '',
                      action: b.intake.standoutStory,
                      result: '',
                      team: '',
                      hypothesis: false,
                      confirmed: false,
                      criteria: Object.entries(b.intake.answers)
                        .filter(([, value]) => value === 'yes')
                        .map(([key]) => key),
                      sourceIds: [],
                      notes: '由初步评估带入；请继续补充日期、结果、个人作用与可核对来源。',
                    }),
                    t,
                    t,
                  ),
              ]
            : []),
          ...(b.intake?.sourceText.trim()
            ? [
                db()
                  .prepare(
                    'INSERT INTO records (id,project_id,kind,body,version,created,updated) VALUES (?,?,?, ?,1,?,?)',
                  )
                  .bind(
                    uid(),
                    id,
                    'evidence',
                    JSON.stringify({
                      title: b.intake.sourceName || '本人提供的经历文字',
                      excerpt: b.intake.sourceText,
                      url: b.intake.linkedin,
                      status: 'lead',
                      confirmed: false,
                      independence: 'self',
                      authenticity: 'unverified',
                      extraction: 'needs-review',
                      modelAllowed: false,
                      criteria: [],
                      sourceIds: [],
                      notes:
                        '初步梳理时由本人选择保存的文字；未核验，未上传原件，不自动计入任何标准。',
                    }),
                    t,
                    t,
                  ),
              ]
            : []),
          ...INITIAL_TASKS.filter(([track]) => track === 'evidence').map(([track, title, notes, basis, url]) =>
            db()
              .prepare(
                'INSERT INTO records (id,project_id,kind,body,version,created,updated) VALUES (?,?,?, ?,1,?,?)',
              )
              .bind(
                uid(),
                id,
                'task',
                JSON.stringify({
                  title,
                  notes,
                  track,
                  basis,
                  url,
                  state: 'todo',
                  owner: '本人',
                  dependsOn: [],
                  sourceIds: [],
                }),
                t,
                t,
              ),
          ),
        ]);
        return reply({ project: await owned(id, user) }, 201);
      }
    }
    const id = path[1],
      p = await owned(id, user),
      op = path[2];
    if (op && CORE_OPERATIONS.has(op)) await requireWorkspaceAccess(req);
    if (!op && method === 'GET') return reply(await readCase(id, user));
    if (op === 'intake' && method === 'POST') {
      const b = await jsonBody(req),
        intake = intakeSchema.parse(b.intake),
        c = await readCase(id, user);
      const prior = c.records.find((r) => r.kind === 'intake'),
        rid = prior?.id || uid();
      await mutate(
        p,
        user,
        b.revision,
        '更新初步评估与赴美计划',
        rid,
        (token) => [
          ...(prior ? [archiveRecord(id, rid, token)] : []),
          writeRecord(
            id,
            rid,
            'intake',
            {
              ...intake,
              title: '初步评估记录',
              confirmed: false,
              savedAt: now(),
            },
            token,
          ),
          ...(intake.standoutStory.trim() &&
          !c.records.some(
            (record) =>
              record.kind === 'event' &&
              record.body.action === intake.standoutStory,
          )
            ? [
                writeRecord(
                  id,
                  uid(),
                  'event',
                  {
                    title: '初步评估中的代表经历',
                    date: '',
                    role: '',
                    action: intake.standoutStory,
                    result: '',
                    team: '',
                    hypothesis: false,
                    confirmed: false,
                    criteria: Object.entries(intake.answers)
                      .filter(([, value]) => value === 'yes')
                      .map(([key]) => key),
                    sourceIds: [],
                    notes:
                      '由初步评估带入；请继续补充日期、结果、个人作用与可核对来源。',
                  },
                  token,
                ),
              ]
            : []),
          ...(intake.sourceText.trim() &&
          !c.records.some(
            (r) =>
              r.kind === 'evidence' &&
              r.body.excerpt === intake.sourceText &&
              r.body.url === intake.linkedin,
          )
            ? [
                writeRecord(
                  id,
                  uid(),
                  'evidence',
                  {
                    title: intake.sourceName || '本人提供的经历文字',
                    excerpt: intake.sourceText,
                    url: intake.linkedin,
                    status: 'lead',
                    confirmed: false,
                    independence: 'self',
                    authenticity: 'unverified',
                    extraction: 'needs-review',
                    modelAllowed: false,
                    criteria: [],
                    sourceIds: [],
                    notes:
                      '更新初步评估时保存的文字，尚未核验。早期版本保留，供核对差异。',
                  },
                  token,
                ),
              ]
            : []),
          ...invalidate(id, token),
        ],
        {
          ...p.profile,
          field: intake.field,
          name: intake.beneficiaryName,
          company: intake.petitionerName,
          companyState: COMPANY_LABEL[intake.company],
          companyGoal:
            p.profile.companyGoal ||
            (intake.company === 'planning'
              ? 'new-o1a'
              : intake.company === 'existing'
                ? 'existing-o1a'
                : 'undecided'),
          target: TIMING_LABEL[intake.timing],
          desiredApproval: intake.desiredApproval,
          arrivalDate: intake.arrivalDate,
          start: intake.workStartDate,
          duties: intake.workPlan,
          location: intake.location,
        },
      );
      return reply({ project: await owned(id, user) });
    }
    if (op === 'lawyer-shares' && method === 'POST') {
      const b = z
        .object({
          revision: z.number().int().nonnegative(),
          confirmed: z.literal(true),
          sections: z.array(z.number().int().min(0).max(7)).min(1).max(8),
          days: z.union([z.literal(1), z.literal(7), z.literal(30)]),
        })
        .strict()
        .parse(await jsonBody(req));
      const c = await readCase(id, user),
        all = buildLawyerBrief(c),
        allEn = buildLawyerBrief(c, 'en');
      const snapshot = {
        kind: 'lawyer',
        title: p.title,
        created: now(),
        revision: p.revision,
        sections: [...new Set(b.sections)].sort().map((i) => ({
          ...all[i],
          number: i + 1,
          items: all[i].items.map(({ sourceId, hasFile, ...item }) => item),
        })),
      };
      Object.assign(snapshot, {
        sectionsEn: [...new Set(b.sections)].sort().map((i) => ({
          ...allEn[i],
          number: i + 1,
          items: allEn[i].items.map(({ sourceId, hasFile, ...item }) => item),
        })),
      });
      if (JSON.stringify(snapshot).length > 350000)
        throw new HttpError(
          422,
          '本次分享内容较多，请减少分享章节，或下载资料包交接。',
        );
      const token = uid() + uid(),
        rid = uid(),
        tokenHash = await hash(token),
        expires = new Date(Date.now() + b.days * 86400000).toISOString();
      await mutate(
        p,
        user,
        b.revision,
        '创建律师资料分享快照',
        rid,
        (mutation) => [
          db()
            .prepare(
              'INSERT INTO shares (id,project_id,token_hash,snapshot,expires,revoked,created) SELECT ?,?,?,?,?,0,? FROM projects WHERE id=? AND mutation=?',
            )
            .bind(
              rid,
              id,
              tokenHash,
              JSON.stringify(snapshot),
              expires,
              now(),
              id,
              mutation,
            ),
        ],
      );
      return reply({
        id: rid,
        url: `/share/${token}`,
        expires,
        kind: 'lawyer',
      });
    }
    if (op === 'lawyer-brief' && method === 'GET') {
      const c = await readCase(id, user),
        draft = buildDraft(
          c,
          'lawyer',
          new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'zh',
        );
      return download(
        await docxBytes(draft.title, draft.content),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'USCOO-lawyer-brief.docx',
      );
    }
    if (!op && method === 'DELETE') {
      const b = await jsonBody(req);
      if (b.confirm !== p.title)
        throw new HttpError(422, '请输入完整项目名称确认删除。');
      const c = await readCase(id, user);
      const files = c.records
        .filter((x) => x.kind === 'evidence' && x.body.file)
        .map((x) => x.body.file.key);
      const history = await db()
        .prepare('SELECT body FROM record_versions WHERE project_id=?')
        .bind(id)
        .all<any>();
      for (const r of history.results) {
        const f = JSON.parse(r.body)?.file;
        if (f) files.push(f.key);
      }
      for (let i = 0; i < files.length; i += 100)
        await bindings().BUCKET.delete([...new Set(files.slice(i, i + 100))]);
      await db()
        .prepare('DELETE FROM projects WHERE id=? AND owner=?')
        .bind(id, user)
        .run();
      return reply({ deleted: true });
    }
    if (op === 'profile' && method === 'POST') {
      const b = await jsonBody(req),
        profile = profileSchema.parse(b.profile);
      const {
        modelConsent: oldConsent,
        preparationMode: oldMode,
        ...oldFacts
      } = p.profile;
      const {
        modelConsent: newConsent,
        preparationMode: newMode,
        ...newFacts
      } = profile;
      const factsChanged =
        JSON.stringify(
          Object.entries(oldFacts).sort(([a], [b]) => a.localeCompare(b)),
        ) !==
        JSON.stringify(
          Object.entries(newFacts).sort(([a], [b]) => a.localeCompare(b)),
        );
      await mutate(
        p,
        user,
        b.revision,
        factsChanged
          ? '更新申请档案'
          : oldMode !== newMode
            ? '更新申请准备方式'
            : '更新模型处理授权',
        null,
        (t) => (factsChanged ? invalidate(id, t) : []),
        profile,
      );
      return reply({ saved: true });
    }
    if (op === 'company-plan' && method === 'POST') {
      const b = z
          .object({
            revision: z.number().int().nonnegative(),
            goal: z.enum([
              'undecided',
              'new-o1a',
              'existing-o1a',
              'company-only',
              'external-petitioner',
            ]),
            entityType: z.string().trim().max(2000).optional(),
            formationState: z.string().trim().max(2000).optional(),
            formationStatus: z
              .enum(['not-started', 'choosing', 'filed', 'active'])
              .optional(),
          })
          .strict()
          .parse(await jsonBody(req)),
        c = await readCase(id, user),
        scopes =
          b.goal === 'company-only'
            ? ['company']
            : b.goal === 'external-petitioner'
              ? ['o1a', 'external']
              : b.goal === 'undecided'
                ? []
                : ['company', 'o1a'],
        wanted = COMPANY_PLAN_TASKS.filter(
          (task) =>
            task.key === 'company-scope' ||
            task.scopes.some((scope) => scopes.includes(scope)),
        ),
        existing = new Set(
          c.records
            .filter((record) => record.kind === 'task')
            .flatMap((record) =>
              record.body.planKey
                ? [record.body.planKey]
                : wanted
                    .filter((task) => task.title === record.body.title)
                    .map((task) => task.key),
            ),
        ),
        missing = wanted.filter((task) => !existing.has(task.key)),
        profile = profileSchema.parse({
          ...p.profile,
          companyGoal: b.goal,
          entityType: b.entityType,
          formationState: b.formationState,
          formationStatus: b.formationStatus,
        }),
        companyFactsChanged =
          p.profile.companyGoal !== profile.companyGoal ||
          p.profile.entityType !== profile.entityType ||
          p.profile.formationState !== profile.formationState ||
          p.profile.formationStatus !== profile.formationStatus;
      await mutate(
        p,
        user,
        b.revision,
        missing.length ? '生成或补齐申请公司准备计划' : '更新申请公司准备目标',
        null,
        (token) => [
          ...missing.map((task) =>
            writeRecord(
              id,
              uid(),
              'task',
              {
                title: task.title,
                notes: task.notes,
                track: 'company',
                state: 'todo',
                owner: '本人',
                dependsOn: [],
                basis: task.basis,
                url: task.url,
                receipt: '',
                planKey: task.key,
                phase: task.phase,
                sourceIds: [],
              },
              token,
            ),
          ),
          ...(companyFactsChanged ? invalidate(id, token) : []),
        ],
        profile,
      );
      return reply({ saved: true, added: missing.length });
    }
    if (
      op === 'records' &&
      path[3] &&
      path[4] === 'history' &&
      method === 'GET'
    ) {
      await record(path[3], id);
      const r = await db()
        .prepare(
          'SELECT version,body,created FROM record_versions WHERE project_id=? AND record_id=? ORDER BY version DESC LIMIT 30',
        )
        .bind(id, path[3])
        .all<any>();
      return reply({
        versions: r.results.map((x) => ({ ...x, body: JSON.parse(x.body) })),
      });
    }
    if (op === 'records' && method === 'POST') {
      const input = await jsonBody(req),
        kind = input.kind as keyof typeof bodySchemas;
      if (!bodySchemas[kind]) throw new HttpError(400, '不支持的记录类型。');
      const body = bodySchemas[kind].parse(input.body) as any;
      const c = await readCase(id, user);
      let previous = input.id ? await record(input.id, id) : null;
      if (previous && previous.kind !== kind)
        throw new HttpError(422, '记录类型不可更改。');
      if (kind === 'gate' && !previous)
        previous =
          c.records.find(
            (x) => x.kind === 'gate' && x.body.gate === body.gate,
          ) || null;
      const rid = previous?.id || uid();
      for (const sid of body.sourceIds || [])
        if (!c.records.some((r) => r.id === sid && r.kind === 'evidence'))
          throw new HttpError(422, '引用的来源不在本项目内。');
      if (body.criteria?.some((k: string) => !CRITERIA.some((x) => x.id === k)))
        throw new HttpError(422, '标准分类无法识别。');
      if (kind === 'event' && body.hypothesis) body.confirmed = false;
      if (kind === 'evidence') {
        if (previous?.body.file) body.file = previous.body.file;
        if (previous?.body.replaces) body.replaces = previous.body.replaces;
        if (
          body.status === 'reviewed' &&
          (!body.excerpt || !body.page || !body.confirmed)
        )
          throw new HttpError(
            422,
            '请先核对原文、填写页段并确认摘录，才能标为已核对。',
          );
        if (body.status === 'reviewed' && body.authenticity === 'concern')
          throw new HttpError(422, '材料真实性仍有疑问，请保留冲突状态。');
      }
      if (kind === 'task') {
        if (
          body.dependsOn.some(
            (x: string) =>
              x === rid ||
              !c.records.some((r) => r.id === x && r.kind === 'task'),
          )
        )
          throw new HttpError(422, '依赖任务不在本项目内。');
        if (body.state === 'done' && !body.receipt && !body.sourceIds.length)
          throw new HttpError(422, '请记录完成凭证或关联材料后再完成任务。');
        if (
          body.state === 'done' &&
          body.dependsOn.some(
            (x: string) =>
              c.records.find((r) => r.id === x)?.body.state !== 'done',
          )
        )
          throw new HttpError(422, '依赖任务尚未完成。');
      }
      if (kind === 'document') {
        validateCanonical(body, c.records, c.project.profile);
        body.stale = false;
      }
      if (kind === 'gate' && body.confirmed) {
        if (body.reviewedOn !== now().slice(0, 10))
          throw new HttpError(422, '请使用今天的实际核验记录。');
        if (!body.sourceIds.length)
          throw new HttpError(422, '请关联核验凭证或官方页面记录。');
      }
      if (kind === 'filing') {
        if (
          body.packetId &&
          !c.records.some((r) => r.id === body.packetId && r.kind === 'packet')
        )
          throw new HttpError(422, '对应的申请包不存在。');
        if (
          ['dispatched', 'received'].includes(body.event) &&
          (!body.packetId || !body.sourceIds.length || !body.confirmed)
        )
          throw new HttpError(
            422,
            '寄出或受理记录需要实际包版本、凭证和本人确认。',
          );
        if (
          ['rfe', 'noid', '221g'].includes(body.event) &&
          body.deadline &&
          !body.deadlineConfirmed
        )
          throw new HttpError(
            422,
            '请核对通知原文中的截止日。无法确定时先不填期限。',
          );
        if (
          previous &&
          ['dispatched', 'received'].includes(previous.body.event)
        )
          throw new HttpError(
            422,
            '实际寄出与受理记录不可覆盖。请新增更正事件。',
          );
      }
      await mutate(
        p,
        user,
        input.revision,
        previous ? '修订记录' : '新增记录',
        rid,
        (t) => [
          ...(previous ? [archiveRecord(id, rid, t)] : []),
          writeRecord(id, rid, kind, body, t),
          ...(['evidence', 'event', 'document'].includes(kind)
            ? invalidate(id, t, kind !== 'document')
            : []),
        ],
      );
      return reply({ saved: true, id: rid });
    }
    if (op === 'upload' && method === 'POST') {
      if (Number(req.headers.get('content-length') || 0) > 52 * 1024 * 1024)
        throw new HttpError(413, '每份文件最多 50 MB。');
      const form = await req.formData(),
        file = form.get('file');
      if (!(file instanceof File)) throw new HttpError(400, '请选择一个文件。');
      if (file.size > 50 * 1024 * 1024 || !file.size)
        throw new HttpError(413, '请选择 50 MB 以内的非空文件。');
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['pdf', 'docx', 'png', 'jpg', 'jpeg', 'txt'].includes(ext || ''))
        throw new HttpError(422, '支持 PDF、DOCX、PNG、JPG 和 TXT。');
      const c = await readCase(id, user),
        existingFiles = c.records.filter(
          (r) => r.kind === 'evidence' && r.body.file,
        );
      if (
        existingFiles.length >= 400 ||
        existingFiles.reduce((a, r) => a + r.body.file.size, 0) + file.size >
          2 * 1024 * 1024 * 1024
      )
        throw new HttpError(413, '本项目最多 400 份文件、合计 2 GB。');
      const bytes = await file.arrayBuffer(),
        sig = new Uint8Array(bytes);
      if (
        (ext === 'pdf' &&
          new TextDecoder().decode(sig.slice(0, 5)) !== '%PDF-') ||
        (ext === 'docx' && (sig[0] !== 80 || sig[1] !== 75)) ||
        (ext === 'png' && !(sig[0] === 137 && sig[1] === 80)) ||
        (['jpg', 'jpeg'].includes(ext!) && !(sig[0] === 255 && sig[1] === 216))
      )
        throw new HttpError(422, '文件内容与扩展名不一致。');
      const digest = await hash(bytes);
      if (existingFiles.some((r) => r.body.file.hash === digest))
        throw new HttpError(
          409,
          '项目中已有相同原件，请打开已有材料补充说明。',
        );
      const replaces = String(form.get('replaces') || '');
      if (replaces) await record(replaces, id);
      const rid = uid(),
        key = `cases/${id}/${rid}`,
        name = file.name.replace(/[\r\n/\\]/g, '_').slice(0, 180),
        mime =
          ext === 'pdf'
            ? 'application/pdf'
            : ext === 'png'
              ? 'image/png'
              : ['jpg', 'jpeg'].includes(ext!)
                ? 'image/jpeg'
                : ext === 'txt'
                  ? 'text/plain'
                  : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const body = {
        title: name,
        excerpt: '',
        page: '',
        status: 'lead',
        confirmed: false,
        authenticity: 'unverified',
        extraction: 'needs-review',
        modelAllowed: false,
        criteria: [],
        translation: 'needed',
        language: '待确认',
        independence: 'unknown',
        replaces: replaces || undefined,
        file: { key, name, size: file.size, mime, hash: digest },
        sourceIds: [],
      };
      await bindings().BUCKET.put(key, bytes, {
        httpMetadata: { contentType: mime },
      });
      try {
        await mutate(
          p,
          user,
          Number(form.get('revision')),
          '上传原件',
          rid,
          (t) => [
            writeRecord(id, rid, 'evidence', body, t),
            ...invalidate(id, t),
          ],
        );
      } catch (e) {
        await bindings().BUCKET.delete(key);
        throw e;
      }
      return reply({ recordId: rid }, 201);
    }
    if (op === 'files' && method === 'GET') {
      const r = await record(path[3], id);
      if (r.kind !== 'evidence' || !r.body.file)
        throw new HttpError(404, '没有关联原件。');
      const f = r.body.file,
        o = await bindings().BUCKET.get(f.key);
      if (!o) throw new HttpError(404, '原件暂时无法读取。');
      const inline =
        ['application/pdf', 'image/png', 'image/jpeg'].includes(f.mime) &&
        new URL(req.url).searchParams.get('inline') === '1';
      return new Response(o.body, {
        headers: {
          'Content-Type': f.mime,
          'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy':
            "sandbox; default-src 'none'; style-src 'unsafe-inline'",
          'Referrer-Policy': 'no-referrer',
        },
      });
    }
    if (op === 'draft' && method === 'POST') {
      const b = await jsonBody(req);
      if (!DOC_TYPES.some((x) => x[0] === b.type))
        throw new HttpError(422, '请选择一种材料。');
      const c = await readCase(id, user),
        body = buildDraft(c, b.type),
        rid = uid();
      await mutate(p, user, b.revision, '组装准备稿', rid, (t) => [
        writeRecord(id, rid, 'document', body, t),
        ...invalidate(id, t, false),
      ]);
      return reply({ id: rid });
    }
    if (op === 'documents' && method === 'GET') {
      const r = await record(path[3], id);
      if (r.kind !== 'document') throw new HttpError(404, '文档不存在。');
      const print = new URL(req.url).searchParams.get('print') === '1';
      if (print)
        return new Response(printHtml(r.body.title, r.body.content), {
          headers: {
            'Content-Type': 'text/html;charset=utf-8',
            'Cache-Control': 'private, no-store',
            'Content-Security-Policy':
              "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'",
            'X-Content-Type-Options': 'nosniff',
          },
        });
      return download(
        await docxBytes(r.body.title, r.body.content),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        `USCOO-${r.id}.docx`,
      );
    }
    if (op === 'export' && method === 'GET') {
      const c = await readCase(id, user);
      const format = new URL(req.url).searchParams.get('format');
      if (format === 'json')
        return download(
          JSON.stringify(c, null, 2),
          'application/json',
          'USCOO-case.json',
        );
      return download(
        await exportCase(
          c,
          true,
          new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'zh',
        ),
        'application/zip',
        'USCOO-private-preparation.zip',
      );
    }
    if (op === 'freeze' && method === 'POST') {
      const b = await jsonBody(req),
        c = await readCase(id, user);
      if (!b.confirmed)
        throw new HttpError(422, '请确认冻结包用于核对实际递交材料。');
      const missing = getGateState(c.records).filter((x) => !x.ok);
      if (missing.length)
        throw new HttpError(
          422,
          `暂不能冻结：${missing.map((x) => x.title).join('、')}尚未完成当日核验。`,
        );
      const docs = c.records.filter((r) => r.kind === 'document');
      if (
        !docs.length ||
        docs.some((r) => r.body.state !== 'canonical' || r.body.stale)
      )
        throw new HttpError(422, '还有未定稿或已失效文档，请先核对。');
      for (const d of docs)
        validateCanonical(d.body, c.records, c.project.profile);
      if (
        c.records.some(
          (r) => r.kind === 'evidence' && r.body.status === 'conflict',
        )
      )
        throw new HttpError(422, '材料仍有未解决冲突。');
      for (const field of [
        'name',
        'company',
        'field',
        'role',
        'duties',
        'start',
        'end',
        'workplace',
        'pay',
      ] as const)
        if (!c.project.profile[field])
          throw new HttpError(422, '申请档案与工作安排尚未完整。');
      const snapshot = {
        project: c.project,
        records: c.records.filter((r) => r.kind !== 'packet'),
        jobs: [],
        audit: [],
        shares: [],
      } as CaseData;
      const manifest = await Promise.all(
        snapshot.records
          .filter((r) =>
            ['evidence', 'document', 'gate', 'rule'].includes(r.kind),
          )
          .map(async (r) => ({
            id: r.id,
            kind: r.kind,
            version: r.version,
            title: r.body.title || r.body.gate,
            contentHash: await hash(JSON.stringify(r.body)),
            fileHash: r.body.file?.hash || null,
          })),
      );
      const rid = uid(),
        body = {
          title: `申请包 ${c.records.filter((x) => x.kind === 'packet').length + 1}`,
          state: 'frozen',
          snapshot,
          manifest,
          snapshotHash: await hash(JSON.stringify(snapshot)),
          frozenAt: now(),
          confirmedBy: user,
        };
      await mutate(p, user, b.revision, '冻结申请包', rid, (t) => [
        writeRecord(id, rid, 'packet', body, t),
      ]);
      return reply({ id: rid });
    }
    if (op === 'packets' && path[3] && method === 'GET') {
      const r = await record(path[3], id);
      if (r.kind !== 'packet') throw new HttpError(404, '申请包不存在。');
      const snap = r.body.snapshot as CaseData;
      if ((await hash(JSON.stringify(snap))) !== r.body.snapshotHash)
        throw new HttpError(503, '申请包快照校验未通过。');
      return download(
        await exportCase(snap),
        'application/zip',
        `USCOO-frozen-${r.id}.zip`,
      );
    }
    if (op === 'rules' && method === 'POST') {
      const b = await jsonBody(req),
        source = OFFICIAL.find((x) => x[1] === b.url);
      if (!source) throw new HttpError(422, '请选择支持的官方来源。');
      let state = 'unavailable',
        digest = '',
        excerpt = '';
      try {
        const res = await fetch(source[1], {
          redirect: 'error',
          signal: AbortSignal.timeout(12000),
          headers: { Accept: 'text/html' },
        });
        if (res.ok) {
          const raw = (await res.text()).slice(0, 700000);
          digest = await hash(raw);
          excerpt = raw
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 12000);
          state = 'retrieved-unreviewed';
        }
      } catch {}
      const rid = uid();
      await mutate(p, user, b.revision, '记录官方来源核验', rid, (t) => [
        writeRecord(
          id,
          rid,
          'rule',
          {
            title: source[0],
            url: source[1],
            state,
            hash: digest,
            excerpt,
            fetchedAt: now(),
            confirmed: false,
          },
          t,
        ),
        ...invalidate(id, t, false),
      ]);
      return reply({ state });
    }
    if (op === 'agent' && method === 'POST') {
      const b = z
        .object({
          requestKey: z.string().uuid(),
          message: z.string().max(1200),
        })
        .parse(await jsonBody(req));
      return reply(
        await agentReview(await readCase(id, user), b.requestKey, b.message),
      );
    }
    if (op === 'shares' && method === 'POST') {
      const b = await jsonBody(req);
      if (!b.confirmed) throw new HttpError(422, '请确认仅分享匿名任务数量。');
      const c = await readCase(id, user),
        tasks = c.records.filter((r) => r.kind === 'task');
      const snapshot = {
        company: {
          total: tasks.filter((r) => r.body.track === 'company').length,
          done: tasks.filter(
            (r) => r.body.track === 'company' && r.body.state === 'done',
          ).length,
        },
        evidence: {
          total: tasks.filter((r) => r.body.track === 'evidence').length,
          done: tasks.filter(
            (r) => r.body.track === 'evidence' && r.body.state === 'done',
          ).length,
        },
        created: now(),
      };
      const token = uid() + uid(),
        tokenHash = await hash(token),
        rid = uid(),
        expires = new Date(Date.now() + 7 * 86400000).toISOString();
      await mutate(p, user, b.revision, '创建匿名进度分享', rid, (t) => [
        db()
          .prepare(
            'INSERT INTO shares (id,project_id,token_hash,snapshot,expires,revoked,created) SELECT ?,?,?,?,?,0,? FROM projects WHERE id=? AND mutation=?',
          )
          .bind(
            rid,
            id,
            tokenHash,
            JSON.stringify(snapshot),
            expires,
            now(),
            id,
            t,
          ),
      ]);
      return reply({ id: rid, url: `/share/${token}` });
    }
    if (op === 'shares' && path[3] && method === 'DELETE') {
      await db()
        .prepare('UPDATE shares SET revoked=1 WHERE id=? AND project_id=?')
        .bind(path[3], id)
        .run();
      return reply({ revoked: true });
    }
    throw new HttpError(404, '操作不存在。');
  } catch (e) {
    return failure(e);
  }
}
// Export one handler for each HTTP method so authorization applies uniformly.
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
