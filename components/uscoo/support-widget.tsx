'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import {
  CheckCircle2,
  HelpCircle,
  Mail,
  MessageCircleQuestion,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createBrowserId, getVisitorId } from '@/lib/browser-engagement';
import { useI18n } from './language';

const FAQ = [
  {
    id: 'start',
    zhQuestion: '我适合从哪里开始？',
    enQuestion: 'Where should I start?',
    zhAnswer:
      '先说明申请目标，再讲工作与经历。无需登录即可查看结果；之后可下载报告，或使用 ChatGPT 登录继续工作台。',
    enAnswer:
      'Start with your goals, work and experience. See results without signing in, then download your report or use ChatGPT to continue to the workspace.',
  },
  {
    id: 'petitioner',
    zhQuestion: '我能直接为自己提交 O-1A 吗？',
    enQuestion: 'Can I file O-1A for myself?',
    zhAnswer:
      '受益人不能直接自我申请。I-129 通常由符合要求的美国雇主或美国代理人提交；创始人控制的独立美国公司在适当安排下可能作为申请人。',
    enAnswer:
      'The beneficiary cannot self-petition. Form I-129 is generally filed by a qualifying U.S. employer or agent; a separate U.S. company owned by a founder may be able to petition with an appropriate arrangement.',
  },
  {
    id: 'account',
    zhQuestion: '怎么注册和保存？',
    enQuestion: 'How do registration and saving work?',
    zhAnswer:
      '点击“注册 / 登录”，使用安全登录后系统会自动建立账号，不需要另设密码。邀请码只在你看完结果、决定保存并进入核心工作台时验证一次。',
    enAnswer:
      'Choose “Register / sign in.” A secure sign-in automatically creates your account, with no separate password. An invitation is checked once only when you choose to save and enter the core workspace.',
  },
  {
    id: 'human',
    zhQuestion: '我想联系人工客服',
    enQuestion: 'I need human support',
    zhAnswer:
      '可以在下方提交问题，或直接发邮件至 coo@uscoo.ai。平台问题由 USCOO 回复；紧急或个案法律判断请联系持牌律师。',
    enAnswer:
      'Submit a question below or email coo@uscoo.ai. USCOO can answer product questions; urgent or case-specific legal advice should go to licensed counsel.',
  },
] as const;

export default function SupportWidget({
  initialEmail,
  initialName,
}: {
  initialEmail?: string;
  initialName?: string;
}) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const submission = useRef({ value: '', id: '' });
  const [answer, setAnswer] = useState<(typeof FAQ)[number] | null>(null);
  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [category, setCategory] = useState<
    'o1a' | 'account' | 'technical' | 'feedback'
  >('o1a');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const emailValid = z.email().max(320).safeParse(email.trim()).success;

  async function submit() {
    setEmailTouched(true);
    if (!emailValid || message.trim().length < 5 || busy) return;
    setBusy(true);
    setError('');
    try {
      const value = JSON.stringify({
        name,
        email,
        category,
        message,
        language,
      });
      if (submission.current.value !== value)
        submission.current = { value, id: createBrowserId() };
      const response = await fetch('/api/uscoo/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: submission.current.id,
          visitorId: getVisitorId(),
          name,
          email: email.trim(),
          category,
          message,
          language,
          website: '',
        }),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || '提交未完成。');
      setTicket(body.request.id);
      setEmailStatus(body.request.emailStatus);
      setMessage('');
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="support-launcher"
        onClick={() => setOpen(true)}
        aria-label={t('帮助与留言', 'Help and messages')}
      >
        <MessageCircleQuestion />
        <span>{t('帮助与留言', 'Help & contact')}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="support-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('有什么可以帮你？', 'How can we help?')}
            </DialogTitle>
            <DialogDescription>
              {t(
                '这里提供常见问题和人工留言，不是实时聊天。提交后需要人工处理，暂不承诺固定回复时限。',
                'Browse common questions or leave a message for a person. This is not live chat; response times are not yet guaranteed.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="support-faq-grid">
            {FAQ.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setAnswer(item)}
                aria-pressed={answer?.id === item.id}
              >
                <HelpCircle />
                {t(item.zhQuestion, item.enQuestion)}
              </button>
            ))}
          </div>
          {answer && (
            <div className="support-answer">
              <div>
                <strong>{t(answer.zhQuestion, answer.enQuestion)}</strong>
                <button
                  type="button"
                  onClick={() => setAnswer(null)}
                  aria-label={t('关闭回答', 'Close answer')}
                >
                  <X />
                </button>
              </div>
              <p>{t(answer.zhAnswer, answer.enAnswer)}</p>
            </div>
          )}

          {ticket ? (
            <div className="support-success" role="status">
              <CheckCircle2 />
              <div>
                <strong>{t('问题已提交', 'Question submitted')}</strong>
                <p>
                  {t(
                    '留言已保存，等待人工处理。登录用户可在账号中心查看回复；匿名用户请保留编号。',
                    'Your message is saved for human review. Signed-in users can check replies in Account Center. Guests should keep this reference.',
                  )}
                </p>
                <p>
                  {emailStatus === 'accepted'
                    ? t(
                        '客服通知已交给邮件服务发送，这不代表人工已经阅读或回复。',
                        'The staff notification was accepted by the email service. This does not mean a person has read or answered it.',
                      )
                    : t(
                        '客服邮箱通知尚未确认发送。需要邮件跟进时，请点击下方链接，并在你的邮箱中发送。',
                        'The staff email notification is not confirmed. For email follow-up, use the link below and send from your mail app.',
                      )}
                </p>
                <a
                  className="support-email-link"
                  href={`mailto:coo@uscoo.ai?subject=${encodeURIComponent('USCOO ' + ticket.slice(0, 8))}`}
                >
                  {t('打开邮箱联系 USCOO', 'Open mail to contact USCOO')}
                </a>
                <div className="support-reference">
                  <span>
                    {t(
                      '咨询编号（不是验证码）',
                      'Support reference (not a verification code)',
                    )}
                  </span>
                  <code>{ticket.slice(0, 8).toUpperCase()}</code>
                  <small>
                    {t(
                      '联系客服或邮件跟进时请提供此编号，便于查找这条留言。',
                      'Include this reference when following up so support can find your message.',
                    )}
                  </small>
                </div>
              </div>
            </div>
          ) : (
            <div className="support-form">
              <div className="support-form-heading">
                <Mail />
                <div>
                  <strong>{t('留言给 USCOO', 'Message USCOO')}</strong>
                  <span>coo@uscoo.ai</span>
                </div>
              </div>
              <div className="support-form-row">
                <label>
                  {t('称呼（选填）', 'Name (optional)')}
                  <Input
                    value={name}
                    maxLength={200}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  {t('回复邮箱（必填）', 'Reply email (required)')}
                  <Input
                    type="email"
                    autoComplete="email"
                    aria-invalid={emailTouched && !emailValid}
                    aria-describedby="support-email-error"
                    onBlur={() => setEmailTouched(true)}
                    required
                    value={email}
                    maxLength={320}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                  {emailTouched && !emailValid && (
                    <small id="support-email-error" role="alert">
                      {t(
                        '请输入有效邮箱，例如 name@example.com。',
                        'Enter a valid email, such as name@example.com.',
                      )}
                    </small>
                  )}
                </label>
              </div>
              <label>
                {t('问题类型', 'Topic')}
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as typeof category)
                  }
                >
                  <option value="o1a">
                    {t('O-1A 与申请流程', 'O-1A and process')}
                  </option>
                  <option value="account">
                    {t('账号与邀请码', 'Account and invitation')}
                  </option>
                  <option value="technical">
                    {t('网站使用问题', 'Technical issue')}
                  </option>
                  <option value="feedback">
                    {t('产品建议与反馈', 'Product feedback')}
                  </option>
                </select>
              </label>
              <label>
                {t('你的问题', 'Your question')}
                <Textarea
                  rows={4}
                  value={message}
                  maxLength={5000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t(
                    '请说明你在哪一步、想完成什么，以及遇到了什么问题。',
                    'Tell us where you are, what you are trying to do, and what happened.',
                  )}
                />
              </label>
              <small>
                {message.length}/5000 ·{' '}
                {t(
                  '至少 5 个字符；请保留问题所需的信息即可。',
                  'At least 5 characters. Include only what is needed to explain the issue.',
                )}
              </small>
              {error && (
                <p className="founder-error" role="alert">
                  {t(error)}
                </p>
              )}
              <Button
                disabled={busy || message.trim().length < 5 || !emailValid}
                onClick={submit}
              >
                {busy
                  ? t('正在提交…', 'Submitting…')
                  : t('提交问题', 'Submit question')}
                <Send />
              </Button>
              <small>
                {t(
                  '提交即表示你同意 USCOO 使用这些信息回复本次问题。请勿在留言中发送护照号或完整身份证件。',
                  'By submitting, you allow USCOO to use this information to answer this request. Do not include passport numbers or full identity documents.',
                )}
              </small>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
