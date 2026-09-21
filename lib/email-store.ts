import { bindings, db, hash, HttpError, now, uid } from './case-store';

export type MailState = 'pending' | 'blocked' | 'sending' | 'accepted' | 'failed' | 'unknown';
export type MailInput = { key: string; kind: string; referenceId: string; to: string; subject: string; text: string; replyTo?: string };
export const emailReady = () => Boolean(bindings().RESEND_API_KEY && bindings().USCOO_EMAIL_FROM);

export function mailStatement(input: MailInput) {
  return db().prepare('INSERT OR IGNORE INTO email_outbox (id,message_key,kind,reference_id,recipient,subject,body,reply_to,status,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(uid(), input.key, input.kind, input.referenceId, input.to, input.subject, input.text, input.replyTo || 'coo@uscoo.ai', 'pending', now(), now());
}

export async function dispatchMail(key: string): Promise<MailState> {
  const row = await db().prepare('SELECT * FROM email_outbox WHERE message_key=?').bind(key).first<any>();
  if (!row) throw new HttpError(404, '未找到邮件记录。');
  if (['accepted', 'sending', 'unknown'].includes(row.status)) return row.status;
  if (!emailReady()) {
    await db().prepare("UPDATE email_outbox SET status='blocked',error='email_not_configured',updated=? WHERE id=? AND status IN ('pending','blocked','failed')").bind(now(), row.id).run();
    return 'blocked';
  }
  const claim = await db().prepare("UPDATE email_outbox SET status='sending',attempts=attempts+1,updated=? WHERE id=? AND status IN ('pending','blocked','failed')").bind(now(), row.id).run();
  if (!claim.meta.changes) return 'sending';
  let state: MailState = 'unknown', providerId = '', error = '';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bindings().RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': row.id },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ from: bindings().USCOO_EMAIL_FROM, to: [row.recipient], subject: row.subject, text: row.body, reply_to: row.reply_to }),
    });
    const body: any = await response.json().catch(() => null);
    if (response.ok && typeof body?.id === 'string') { state = 'accepted'; providerId = body.id; }
    else { state = response.status >= 500 || response.ok ? 'unknown' : 'failed'; error = `provider_http_${response.status}`; }
  } catch { error = 'provider_result_unknown'; }
  await db().prepare('UPDATE email_outbox SET status=?,provider_id=?,error=?,updated=? WHERE id=?').bind(state, providerId, error, now(), row.id).run();
  return state;
}

export async function retryMail(id: string) {
  const row = await db().prepare('SELECT message_key,status FROM email_outbox WHERE id=?').bind(id).first<any>();
  if (!row) throw new HttpError(404, '未找到邮件记录。');
  return dispatchMail(row.message_key);
}

export async function replyMailKey(id: string, reply: string) {
  return `support-reply:${id}:${await hash(reply)}`;
}
