import { z } from 'zod';
import { assessmentReport } from './assessment-report';
import { dispatchMail, emailReady, mailStatement, replyMailKey } from './email-store';
import { ensureAccountForRequest } from './account-store';
import { bindings, db, HttpError, now, uid } from './case-store';

export const ASSESSMENT_EVENT_TYPES = [
  'assessment_started',
  'assessment_completed',
  'result_viewed',
  'save_opened',
] as const;

export type AccountSupportRequest = {
  id: string;
  category: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  reply: string;
  created: string;
  updated: string;
};

type AssessmentInput = {
  visitorId: string;
  eventType: (typeof ASSESSMENT_EVENT_TYPES)[number];
  language: 'zh' | 'en';
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

type SupportInput = {
  requestId?: string;
  visitorId: string;
  name: string;
  email: string;
  category: 'o1a' | 'account' | 'technical' | 'feedback';
  message: string;
  language: 'zh' | 'en';
};

type LeadInput = z.infer<typeof assessmentLeadInputSchema>;

export async function createAssessmentLead(req: Request, input: LeadInput) {
  const userId = req.headers.get('oai-authenticated-user-id');
  if (input.requestId) {
    const existing = await db().prepare('SELECT id FROM assessment_leads WHERE id=? AND visitor_id=?').bind(input.requestId, input.visitorId).first<{id:string}>();
    if (existing) return { id: existing.id, emailStatus: await dispatchMail(`assessment:${existing.id}`).catch(() => 'unknown' as const) };
  }
  const time = now();
  const recent = await db()
    .prepare("SELECT COUNT(*) AS n FROM assessment_leads WHERE (visitor_id=? OR email=?) AND created>=?")
    .bind(input.visitorId, input.email, new Date(Date.now() - 86400000).toISOString())
    .first<{ n: number }>();
  if (Number(recent?.n || 0) >= 5) throw new HttpError(429, '今天已经保存过多次，请稍后再试。');
  const id = input.requestId || uid();
  const insert = db().prepare(
    'INSERT INTO assessment_leads (id,visitor_id,user_id,name,email,wechat,location,timing,company,application_path,has_chatgpt,wants_interview,language,assessment,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  ).bind(
    id, input.visitorId, userId, input.name, input.email, input.wechat,
    input.location, input.timing, input.company, input.applicationPath,
    input.hasChatgpt, input.wantsInterview ? 1 : 0, input.language,
    JSON.stringify(input.assessment), time, time,
  );
  const key = `assessment:${id}`;
  await db().batch([insert, mailStatement({ key, kind: 'assessment', referenceId: id, to: input.email,
    subject: input.language === 'en' ? 'Your USCOO assessment and next steps' : '你的 USCOO 初步评估与下一步准备清单', text: assessmentReport(input) })]);
  const emailStatus = await dispatchMail(key).catch(() => 'unknown' as const);
  return { id, emailStatus };
}

export async function recordAssessmentEvent(
  req: Request,
  input: AssessmentInput,
) {
  const userId = req.headers.get('oai-authenticated-user-id');
  if (userId) await ensureAccountForRequest(req);
  const time = now();
  const day = time.slice(0, 10);
  const eventKey = `${input.visitorId}:${input.eventType}:${day}`;
  const insert = db()
    .prepare(
      'INSERT OR IGNORE INTO assessment_events (id,visitor_id,user_id,event_type,event_key,language,referrer,utm_source,utm_medium,utm_campaign,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    )
    .bind(
      uid(),
      input.visitorId,
      userId,
      input.eventType,
      eventKey,
      input.language,
      input.referrer,
      input.utmSource,
      input.utmMedium,
      input.utmCampaign,
      time,
    );
  if (!userId) {
    await insert.run();
    return;
  }
  await db().batch([
    insert,
    db()
      .prepare(
        'UPDATE assessment_events SET user_id=? WHERE visitor_id=? AND user_id IS NULL',
      )
      .bind(userId, input.visitorId),
  ]);
}

export async function createSupportRequest(req: Request, input: SupportInput) {
  const userId = req.headers.get('oai-authenticated-user-id');
  const account = userId ? await ensureAccountForRequest(req) : null;
  const email = (account?.email || input.email).trim().slice(0, 320);
  const name = (account?.display_name || input.name).trim().slice(0, 200);
  if (!email) throw new HttpError(422, '请留下邮箱，方便客服回复。');
  if (input.requestId) {
    const existing = await db().prepare('SELECT id FROM support_requests WHERE id=? AND visitor_id=?').bind(input.requestId, input.visitorId).first<{id:string}>();
    if (existing) return { id: existing.id, status: 'open' as const, email, emailStatus: await dispatchMail(`support-notify:${existing.id}`).catch(() => 'unknown' as const) };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await db()
    .prepare(
      'SELECT COUNT(*) AS n FROM support_requests WHERE visitor_id=? AND created>=?',
    )
    .bind(input.visitorId, since)
    .first<{ n: number }>();
  if (Number(recent?.n || 0) >= 5)
    throw new HttpError(
      429,
      '今天提交的问题较多，请直接发送邮件至 coo@uscoo.ai。',
    );

  const id = input.requestId || uid();
  const time = now();
  const insert = db()
    .prepare(
      "INSERT INTO support_requests (id,visitor_id,user_id,name,email,category,message,language,status,reply,created,updated) VALUES (?,?,?,?,?,?,?,?,?,'',?,?)",
    )
    .bind(
      id,
      input.visitorId,
      userId,
      name,
      email,
      input.category,
      input.message,
      input.language,
      'open',
      time,
      time,
    );
  const key = `support-notify:${id}`;
  await db().batch([insert, mailStatement({ key, kind: 'support-notify', referenceId: id,
    to: 'coo@uscoo.ai', replyTo: email, subject: `USCOO · New request ${id.slice(0, 8)}`,
    text: `${name} <${email}>\n${input.category}\n\n${input.message}\n\nhttps://www.uscoo.ai/admin` })]);
  const emailStatus = await dispatchMail(key).catch(() => 'unknown' as const);
  return { id, status: 'open' as const, email, emailStatus };
}

export async function getSupportRequestsForUser(
  req: Request,
): Promise<AccountSupportRequest[]> {
  const account = await ensureAccountForRequest(req);
  const result = await db()
    .prepare(
      'SELECT id,category,message,status,reply,created,updated FROM support_requests WHERE user_id=? ORDER BY created DESC LIMIT 30',
    )
    .bind(account.user_id)
    .all<AccountSupportRequest>();
  return result.results;
}

export function isAdminUser(userId: string) {
  const allowed = (bindings().USCOO_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(userId);
}

export async function requireAdmin(req: Request) {
  const userId = req.headers.get('oai-authenticated-user-id');
  if (!userId) throw new HttpError(401, '请先登录。');
  if (!isAdminUser(userId)) throw new HttpError(403, '无权访问运营数据。');
  return userId;
}

export async function getAdminDashboard() {
  const [
    accountTotals,
    projectTotals,
    openSupport,
    leadTotals,
    eventTotals,
    users,
    leads,
    support,
    mail,
  ] = await Promise.all([
    db()
      .prepare(
        "SELECT COUNT(*) AS total,SUM(CASE WHEN access_status='active' THEN 1 ELSE 0 END) AS active FROM accounts",
      )
      .first<{ total: number; active: number }>(),
    db()
      .prepare('SELECT COUNT(*) AS total FROM projects')
      .first<{ total: number }>(),
    db()
      .prepare(
        "SELECT COUNT(*) AS total FROM support_requests WHERE status='open'",
      )
      .first<{ total: number }>(),
    db().prepare('SELECT COUNT(*) AS total FROM assessment_leads').first<{ total: number }>(),
    db()
      .prepare(
        "SELECT event_type,COUNT(DISTINCT visitor_id) AS total FROM assessment_events WHERE created>=datetime('now','-30 days') GROUP BY event_type",
      )
      .all<{ event_type: string; total: number }>(),
    db()
      .prepare(
        `SELECT a.user_id,a.email,a.display_name,a.access_status,a.reward_credits,a.profile,a.created,a.updated,
            COUNT(DISTINCT p.id) AS project_count,MAX(e.created) AS last_assessment_at
           FROM accounts a
           LEFT JOIN projects p ON p.owner=a.user_id
           LEFT JOIN assessment_events e ON e.user_id=a.user_id
           GROUP BY a.user_id
           ORDER BY COALESCE(MAX(e.created),a.updated) DESC
           LIMIT 100`,
      )
      .all(),
    db().prepare('SELECT id,name,email,wechat,location,timing,company,application_path,has_chatgpt,wants_interview,language,created FROM assessment_leads ORDER BY created DESC LIMIT 100').all(),
    db()
      .prepare(
        'SELECT id,user_id,name,email,category,message,language,status,reply,created,updated FROM support_requests ORDER BY created DESC LIMIT 100',
      )
      .all(),
    db().prepare('SELECT id,kind,reference_id,recipient,status,attempts,error,created FROM email_outbox ORDER BY created DESC LIMIT 100').all(),
  ]);
  return {
    mail: mail.results,
    emailConfigured: emailReady(),
    totals: {
      accounts: Number(accountTotals?.total || 0),
      activeAccounts: Number(accountTotals?.active || 0),
      projects: Number(projectTotals?.total || 0),
      openSupport: Number(openSupport?.total || 0),
      leads: Number(leadTotals?.total || 0),
    },
    events: Object.fromEntries(
      eventTotals.results.map((row) => [row.event_type, Number(row.total)]),
    ),
    users: users.results,
    leads: leads.results,
    support: support.results,
  };
}

export async function updateSupportRequest(
  req: Request,
  input: { id: string; status: 'open' | 'answered' | 'closed'; reply: string },
) {
  await requireAdmin(req);
  const item = await db().prepare('SELECT email,language FROM support_requests WHERE id=?').bind(input.id).first<{email:string; language:string}>();
  if (!item) throw new HttpError(404, '未找到这条问题。');
  if (input.status === 'answered' && !input.reply.trim()) throw new HttpError(422, '请先填写回复。');
  const update = db().prepare('UPDATE support_requests SET status=?,reply=?,updated=? WHERE id=?').bind(input.status, input.reply, now(), input.id);
  if (input.status !== 'answered') { await update.run(); return { emailStatus: null }; }
  const key = await replyMailKey(input.id, input.reply);
  await db().batch([update, mailStatement({ key, kind: 'support-reply', referenceId: input.id, to: item.email,
    subject: `USCOO · ${item.language === 'en' ? 'Reply to your request' : '你的咨询回复'} ${input.id.slice(0,8)}`, text: input.reply })]);
  return { emailStatus: await dispatchMail(key).catch(() => 'unknown' as const) };
}

export const analyticsInputSchema = z
  .object({
    visitorId: z.string().uuid(),
    eventType: z.enum(ASSESSMENT_EVENT_TYPES),
    language: z.enum(['zh', 'en']),
    referrer: z.string().max(500).default(''),
    utmSource: z.string().max(120).default(''),
    utmMedium: z.string().max(120).default(''),
    utmCampaign: z.string().max(160).default(''),
  })
  .strict();

export const supportInputSchema = z
  .object({
    requestId: z.string().uuid().optional(),
    visitorId: z.string().uuid(),
    name: z.string().trim().max(200).default(''),
    email: z.union([z.literal(''), z.email().max(320)]).default(''),
    category: z.enum(['o1a', 'account', 'technical', 'feedback']),
    message: z.string().trim().min(5).max(5000),
    language: z.enum(['zh', 'en']),
    website: z.literal('').default(''),
  })
  .strict();

export const assessmentLeadInputSchema = z.object({
  requestId: z.string().uuid().optional(),
  visitorId: z.string().uuid(),
  name: z.string().trim().max(200).default(''),
  email: z.email().max(320),
  wechat: z.string().trim().max(120).default(''),
  location: z.enum(['CN', 'US', 'other']),
  timing: z.enum(['soon', 'six-months', 'twelve-months', 'exploring']),
  company: z.enum(['unknown', 'none', 'planning', 'existing']),
  applicationPath: z.enum(['undecided', 'self', 'lawyer']),
  hasChatgpt: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  wantsInterview: z.boolean().default(false),
  language: z.enum(['zh', 'en']),
  assessment: z.object({
    currentWork: z.string().max(2000),
    standoutStory: z.string().max(5000),
    sourceText: z.string().max(40000).default(''),
    answers: z.record(z.string(), z.enum(['yes', 'unsure', 'no'])),
  }).strict(),
  website: z.literal('').default(''),
}).strict();

// Admin-only recovery for submissions made before email delivery existed.
export async function sendStoredAssessment(id: string) {
  const item = await db().prepare('SELECT * FROM assessment_leads WHERE id=?').bind(id).first<any>();
  if (!item) throw new HttpError(404, '未找到评估记录。');
  const input = { language: item.language === 'zh' ? 'zh' as const : 'en' as const,
    location: item.location, timing: item.timing, company: item.company, applicationPath: item.application_path,
    assessment: JSON.parse(item.assessment) };
  const key = `assessment:${id}`;
  await mailStatement({ key, kind: 'assessment', referenceId: id, to: item.email,
    subject: input.language === 'en' ? 'Your USCOO assessment and next steps' : '你的 USCOO 初步评估与下一步准备清单',
    text: assessmentReport(input) }).run();
  return dispatchMail(key);
}
