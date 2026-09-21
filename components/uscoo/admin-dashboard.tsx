'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  Mail,
  MessageSquareText,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LanguageSwitch, useI18n } from './language';

type DashboardData = {
  emailConfigured: boolean;
  mail: Array<{ id: string; kind: string; reference_id: string; recipient: string; status: string; attempts: number; error: string; created: string }>;

  totals: {
    accounts: number;
    activeAccounts: number;
    projects: number;
    openSupport: number;
    leads: number;
  };
  events: Record<string, number>;
  users: Array<{
    user_id: string;
    email: string;
    display_name: string;
    access_status: string;
    reward_credits: number;
    profile: string;
    project_count: number;
    last_assessment_at: string | null;
    created: string;
  }>;
  leads: Array<{
    id: string; name: string; email: string; wechat: string; location: string;
    timing: string; company: string; application_path: string; has_chatgpt: string;
    wants_interview: number; language: string; created: string;
  }>;
  support: Array<{
    id: string;
    user_id: string | null;
    name: string;
    email: string;
    category: string;
    message: string;
    status: 'open' | 'answered' | 'closed';
    reply: string;
    created: string;
  }>;
};

function profileOf(value: string) {
  try {
    return JSON.parse(value || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

function SupportTicket({ item }: { item: DashboardData['support'][number] }) {
  const { t } = useI18n();
  const [reply, setReply] = useState(item.reply || '');
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [delivery, setDelivery] = useState('');
  const [error, setError] = useState('');

  async function save(nextStatus: 'answered' | 'closed') {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/uscoo/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: nextStatus, reply }),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || '更新失败。');
      setStatus(nextStatus);
      setSaved(true);
      setDelivery(body.emailStatus || '');
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="admin-support-ticket" data-status={status}>
      <header>
        <div>
          <strong>
            {item.name || item.email || t('匿名访客', 'Anonymous visitor')}
          </strong>
          <a href={`mailto:${item.email}`}>{item.email}</a>
        </div>
        <span>{status}</span>
      </header>
      <small>
        {item.category} · {item.created.slice(0, 16).replace('T', ' ')}
      </small>
      <p>{item.message}</p>
      <label>
        {t('回复内容（保存并尝试发送邮件）', 'Reply (save and attempt email delivery)')}
        <Textarea
          rows={3}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
        />
      </label>
      {error && (
        <p className="founder-error" role="alert">
          {error}
        </p>
      )}
      <div>
        <Button
          disabled={busy || !reply.trim()}
          onClick={() => save('answered')}
        >
          <CheckCircle2 />
          {t('保存回复并发邮件', 'Save reply and email')}
        </Button>
        <a
          className="admin-email-reply"
          href={`mailto:${item.email}?subject=${encodeURIComponent(`USCOO support ${item.id.slice(0, 8)}`)}&body=${encodeURIComponent(reply)}`}
        >
          <Mail />
          {t('用客服邮箱发送', 'Send by email')}
        </a>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => save('closed')}
        >
          {t('结束', 'Close')}
        </Button>
        {saved && <span role="status">{delivery === 'accepted' ? t('回复已保存，邮件服务已接收；尚未确认送达。', 'Reply saved and accepted by the email service; delivery is not confirmed.') : delivery ? t('回复已保存，但邮件未确认发送。请检查下方邮件记录或手动发送。', 'Reply saved, but email is not confirmed. Check email records below or send manually.') : t('已保存', 'Saved')}</span>}
      </div>
    </article>
  );
}

function SendAssessment({ id }: { id: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  async function send() {
    setBusy(true);
    try {
      const r = await fetch('/api/uscoo/admin/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({id, source:'assessment'}) });
      const b: any = await r.json();
      if (!r.ok) throw new Error();
      setNote(b.emailStatus === 'accepted' ? t('邮件服务已接收，未确认送达', 'Accepted; delivery unconfirmed') : t('邮件未确认发送，请查看发送记录', 'Email unconfirmed; check delivery records'));
    } catch { setNote(t('操作未完成，请重试', 'Could not complete; try again')); }
    finally { setBusy(false); }
  }
  return <><Button variant="outline" disabled={busy} onClick={send}>{t('发送评估报告', 'Send assessment report')}</Button>{note && <small role="status">{note}</small>}</>;
}

function MailRow({ item }: { item: DashboardData['mail'][number] }) {
  const { t } = useI18n();
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const labels: Record<string, string> = {
    pending: t('待发送', 'Pending'), blocked: t('发信未配置', 'Not configured'),
    failed: t('发送被拒绝', 'Rejected'), accepted: t('服务已接收，未确认送达', 'Accepted; delivery unconfirmed'),
    unknown: t('结果不明，请查邮件服务记录', 'Unknown; check provider logs'), sending: t('发送中或待核对', 'Sending or needs verification'),
  };
  async function retry() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/uscoo/admin/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
      const body: any = await r.json();
      if (!r.ok) throw new Error(body.error || 'Request failed');
      setStatus(body.emailStatus);
    } catch { setError(t('未完成，请稍后重试。', 'Could not complete. Try again later.')); }
    finally { setBusy(false); }
  }
  return <article className="admin-support-ticket"><strong>{item.recipient}</strong><p>{item.kind} · {item.reference_id.slice(0,8)} · {labels[status] || status}</p>
    {['pending', 'blocked', 'failed'].includes(status) && <Button disabled={busy} variant="outline" onClick={retry}>{busy ? t('正在发送…', 'Sending…') : t('重试发送', 'Retry email')}</Button>}
    {error && <p role="alert">{error}</p>}
  </article>;
}

export default function AdminDashboard({ data }: { data: DashboardData }) {
  const { t } = useI18n();
  const eventRows = [
    ['assessment_started', t('开始评估', 'Assessment started')],
    ['assessment_completed', t('完成三问', 'Assessment completed')],
    ['result_viewed', t('查看结果', 'Result viewed')],
    ['save_opened', t('点击保存', 'Save opened')],
  ];

  return (
    <div className="founder-app admin-page">
      <header className="account-header">
        <a href="/account" className="marketing-brand">
          <ArrowLeft /> <strong>USCOO</strong>
          <span>{t('运营后台', 'Operations')}</span>
        </a>
        <LanguageSwitch />
      </header>
      <main className="admin-main">
        <section className="admin-title">
          <div>
            <p className="founder-eyebrow">
              {t('仅站点所有者可见', 'Site owner only')}
            </p>
            <h1>
              {t('评估、账号与用户反馈', 'Assessments, accounts and feedback')}
            </h1>
            <p>
              {t(
                '评估数字为最近 30 天的去重访客；评估回答内容只有用户主动保存后才进入私有项目。',
                'Assessment figures are unique visitors over the last 30 days. Answer content enters a private project only when the user explicitly saves it.',
              )}
            </p>
          </div>
          <a href="/admin" className="founder-button">
            <RefreshCw />
            {t('刷新', 'Refresh')}
          </a>
        </section>

        <section className="admin-metrics">
          <article>
            <UserRound />
            <span>{t('已注册账号', 'Registered accounts')}</span>
            <strong>{data.totals.accounts}</strong>
          </article>
          <article>
            <CheckCircle2 />
            <span>{t('已开通工作台', 'Workspace active')}</span>
            <strong>{data.totals.activeAccounts}</strong>
          </article>
          <article>
            <FolderKanban />
            <span>{t('已保存项目', 'Saved projects')}</span>
            <strong>{data.totals.projects}</strong>
          </article>
          <article>
            <MessageSquareText />
            <span>{t('邮箱评估用户', 'Assessment leads')}</span>
            <strong>{data.totals.leads}</strong>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><p className="founder-eyebrow">{t('邮箱留存与候补', 'Email leads & waitlist')}</p><h2>{t('谁完成评估并希望继续', 'Who completed an assessment and wants to continue')}</h2></div>
            <span>{data.leads.length} / 100</span>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>{t('用户', 'User')}</th><th>{t('地区与时间', 'Region & timing')}</th><th>{t('公司与方式', 'Company & route')}</th><th>{t('后续联系', 'Follow-up')}</th></tr></thead>
              <tbody>{data.leads.map((lead) => <tr key={lead.id}>
                <td><strong>{lead.name || t('未留姓名', 'No name')}</strong><a href={`mailto:${lead.email}`}>{lead.email}</a><small>{lead.created.slice(0, 10)}</small><SendAssessment id={lead.id} /></td>
                <td>{lead.location}<small>{lead.timing}</small></td>
                <td>{lead.company}<small>{lead.application_path}</small></td>
                <td>{lead.wechat || '—'}<small>ChatGPT: {lead.has_chatgpt} · {lead.wants_interview ? t('愿意访谈', 'Interview') : t('未选择访谈', 'No interview')}</small></td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel admin-funnel">
          <div>
            <p className="founder-eyebrow">
              {t('评估漏斗 · 最近 30 天', 'Assessment funnel · 30 days')}
            </p>
            <h2>{t('用户走到了哪一步', 'How far visitors progressed')}</h2>
          </div>
          <div className="admin-funnel-grid">
            {eventRows.map(([key, label], index) => (
              <article key={key}>
                <b>0{index + 1}</b>
                <span>{label}</span>
                <strong>{data.events[key] || 0}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="founder-eyebrow">
                {t('注册用户', 'Registered users')}
              </p>
              <h2>{t('谁注册、谁保存了项目', 'Who registered and saved')}</h2>
            </div>
            <span>{data.users.length} / 100</span>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('用户', 'User')}</th>
                  <th>{t('阶段与地区', 'Stage & region')}</th>
                  <th>{t('项目', 'Projects')}</th>
                  <th>{t('评估活动', 'Assessment activity')}</th>
                  <th>{t('联系', 'Contact')}</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const profile = profileOf(user.profile);
                  return (
                    <tr key={user.user_id}>
                      <td>
                        <strong>{user.display_name || user.email}</strong>
                        <a href={`mailto:${user.email}`}>{user.email}</a>
                        <small>{user.access_status}</small>
                      </td>
                      <td>
                        {String(profile.founderStage || '—')}
                        <small>
                          {String(profile.countryRegion || '—')} ·{' '}
                          {String(profile.companyName || '—')}
                        </small>
                      </td>
                      <td>{Number(user.project_count || 0)}</td>
                      <td>
                        {user.last_assessment_at
                          ? user.last_assessment_at.slice(0, 10)
                          : '—'}
                      </td>
                      <td>
                        {String(profile.contactChannel || 'email')}
                        <small>
                          {String(profile.contactValue || user.email)}
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="founder-eyebrow">
                {t('在线问答与反馈', 'Questions and feedback')}
              </p>
              <h2>
                {t(
                  '回复用户，保留处理状态',
                  'Reply and keep a response record',
                )}
              </h2>
            </div>
            <a href="mailto:coo@uscoo.ai">
              <Mail />
              coo@uscoo.ai
            </a>
          </div>
          <div className="admin-support-list">
            {data.support.length ? (
              data.support.map((item) => (
                <SupportTicket key={item.id} item={item} />
              ))
            ) : (
              <p>{t('暂时没有用户问题。', 'No questions yet.')}</p>
            )}
          </div>
        </section>
        <section className="admin-panel">
          <h2>{t('邮件发送记录', 'Email delivery records')}</h2>
          <p>{data.emailConfigured ? t('已配置发信服务。服务接收不等于邮件已到达收件箱。', 'Email service configured. Provider acceptance does not confirm inbox delivery.') : t('自动发信尚未启用：需要发信密钥和已验证的发件地址。留言和评估仍保存在后台。', 'Automatic email is not enabled: a sending key and verified sender address are needed. Messages and assessments remain saved here.')}</p>
          <p>{t('配置完成后，可逐条重试待发送邮件；结果不明的邮件先在发信服务中核对，避免重复发送。', 'After setup, retry pending messages individually. Check uncertain messages with the provider before resending to avoid duplicates.')}</p>
          {data.mail.map(item => <MailRow key={item.id} item={item} />)}
        </section>
      </main>
    </div>
  );
}
