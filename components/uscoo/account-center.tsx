'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  FolderLock,
  Gift,
  Leaf,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LanguageSwitch, useI18n } from './language';

type Account = {
  displayName: string;
  email: string;
  accessStatus: 'pending' | 'active';
  accessGrantedAt: string | null;
  accessSource: string | null;
  referralCode: string;
  rewardCredits: number;
  projectCount: number;
  invitedCount: number;
  profile: AccountProfile;
};

type AccountProfile = {
  countryRegion: string;
  companyName: string;
  founderStage: 'exploring' | 'building' | 'operating' | '';
  contactChannel: 'email' | 'wechat' | 'whatsapp' | 'other' | '';
  contactValue: string;
  updatesOptIn: boolean;
};

type SupportRequest = {
  id: string;
  category: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  reply: string;
  created: string;
};

const EMPTY_PROFILE: AccountProfile = {
  countryRegion: '',
  companyName: '',
  founderStage: '',
  contactChannel: '',
  contactValue: '',
  updatesOptIn: false,
};

export default function AccountCenter({
  signedIn,
  userName,
  userEmail,
  signInPath,
  signOutPath,
  initialAccount,
  isAdmin,
}: {
  signedIn: boolean;
  userName: string;
  userEmail: string;
  signInPath: string;
  signOutPath: string;
  initialAccount?: Account | null;
  isAdmin: boolean;
}) {
  const { t } = useI18n();
  const [account, setAccount] = useState<Account | null>(
    initialAccount || null,
  );
  const [referralUrl, setReferralUrl] = useState(
    initialAccount ? `/join?ref=${initialAccount.referralCode}` : '',
  );
  const [profile, setProfile] = useState<AccountProfile>(
    initialAccount?.profile || EMPTY_PROFILE,
  );
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(signedIn);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/uscoo/account', { cache: 'no-store' });
      const body: any = await response.json();
      if (!response.ok) throw Error(body.error || '账号读取失败。');
      setAccount(body.account);
      setProfile(body.account.profile || EMPTY_PROFILE);
      setReferralUrl(body.referralUrl);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadSupport() {
    try {
      const response = await fetch('/api/uscoo/support', { cache: 'no-store' });
      if (!response.ok) return;
      const body: any = await response.json();
      setSupportRequests(body.requests || []);
    } catch {
      // Account access remains usable when support history is unavailable.
    }
  }

  useEffect(() => {
    if (initialAccount)
      setReferralUrl(
        `${window.location.origin}/join?ref=${encodeURIComponent(initialAccount.referralCode)}`,
      );
    if (signedIn) {
      load();
      loadSupport();
    }
  }, [signedIn]);

  async function saveProfile() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/uscoo/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || '资料未能保存。');
      setAccount(body.account);
      setProfile(body.account.profile || EMPTY_PROFILE);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/uscoo/account/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body: any = await response.json();
      if (!response.ok) throw Error(body.error || '邀请码未能使用。');
      await load();
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError(
        t(
          '浏览器未允许自动复制，请选中内容后手动复制。',
          'The browser did not allow copying. Select the text and copy it manually.',
        ),
      );
    }
  }

  return (
    <div className="founder-app account-page">
      <header className="account-header">
        <a href="/" className="marketing-brand">
          <Leaf size={24} /> <strong>USCOO</strong>
          <span>{t('账号中心', 'Account center')}</span>
        </a>
        <div>
          <LanguageSwitch />
          <a href="/beta">{t('进入系统', 'Enter system')}</a>
        </div>
      </header>
      <main id="founder-main" className="account-main">
        {!signedIn ? (
          <section className="account-signin">
            <UserRound />
            <p className="founder-eyebrow">
              {t(
                '一个账号，一份持续更新的申请记录',
                'One account, one continuously updated application record',
              )}
            </p>
            <h1>
              {t(
                '使用 ChatGPT 登录，继续准备。',
                'Sign in with ChatGPT to continue preparing.',
              )}
            </h1>
            <p>
              {t(
                '第一次安全登录会自动建立 USCOO 账号，不需要另设密码。你的申请资料按账号隔离保存；只有你主动保存时，才会建立私有项目。',
                'Your first secure sign-in automatically creates a USCOO account, with no separate password. Application records are isolated by account; a private project is created only when you choose to save.',
              )}
            </p>
            <ol className="account-signin-steps">
              <li>
                <span>1</span>
                {t(
                  '先免费完成初步评估',
                  'Complete the free initial assessment',
                )}
              </li>
              <li>
                <span>2</span>
                {t(
                  '第一次安全登录，自动创建账号',
                  'Your first secure sign-in creates the account',
                )}
              </li>
              <li>
                <span>3</span>
                {t(
                  '决定保存时验证邀请码，进入核心工作台',
                  'Verify an invite only when saving and entering the workspace',
                )}
              </li>
            </ol>
            <a className="founder-button" href={signInPath} target="_top">
              {t('使用 ChatGPT 注册 / 登录', 'Register / sign in with ChatGPT')}{' '}
              <ArrowRight size={17} />
            </a>
            <p>{t('没有可用的 ChatGPT 账号？仍可免费评估、查看结果并通过邮箱获取报告，无需注册。当前邮箱不用于登录工作台。', 'No available ChatGPT account? You can still assess for free, see results and request your report by email. Email does not currently sign you in to the workspace.')}</p>
            <a href="/beta?view=assessment">{t('不登录，继续免费评估', 'Continue the free assessment without signing in')}</a>
          </section>
        ) : (
          <>
            <section className="account-title">
              <div>
                <p className="founder-eyebrow">
                  {t('我的 USCOO 账号', 'My USCOO account')}
                </p>
                <h1>
                  {t('你好，', 'Hello, ')}
                  {account?.displayName || userName}
                </h1>
                <p>{account?.email || userEmail}</p>
              </div>
              <a className="founder-button" href="/prepare">
                {t('进入 O-1A 工作台', 'Open O-1A workspace')}{' '}
                <ArrowRight size={16} />
              </a>
            </section>

            {busy && !account && (
              <p role="status">{t('正在读取账号…', 'Loading account…')}</p>
            )}
            {error && (
              <p className="founder-error" role="alert">
                {t(error)}
              </p>
            )}
            {account && (
              <>
                <section className="account-status-grid">
                  <article>
                    <ShieldCheck />
                    <span>{t('核心工作台权限', 'Core workspace access')}</span>
                    <strong>
                      {account.accessStatus === 'active'
                        ? t('已开通', 'Active')
                        : t('待使用邀请码', 'Invite required')}
                    </strong>
                  </article>
                  <article>
                    <FolderLock />
                    <span>
                      {t('私有申请项目', 'Private application projects')}
                    </span>
                    <strong>{account.projectCount}</strong>
                  </article>
                  <article>
                    <Gift />
                    <span>{t('内测申请积分', 'Beta application credits')}</span>
                    <strong>{account.rewardCredits}</strong>
                  </article>
                  <article>
                    <UserRound />
                    <span>{t('已成功邀请', 'Successful invitations')}</span>
                    <strong>{account.invitedCount}</strong>
                  </article>
                </section>

                {account.accessStatus === 'pending' ? (
                  <section className="account-panel invite-activate">
                    <div>
                      <p className="founder-eyebrow">
                        {t('开通核心工作台', 'Unlock the core workspace')}
                      </p>
                      <h2>
                        {t(
                          '输入朋友发给你的邀请码。',
                          'Enter the invitation code you received.',
                        )}
                      </h2>
                      <p>
                        {t(
                          '邀请码只需使用一次。开通后，你可以进入完整工作台，并获得自己的邀请链接。',
                          'An invite is used once. After activation, you can enter the complete workspace and receive your own referral link.',
                        )}
                      </p>
                    </div>
                    <div className="invite-code-form">
                      <Input
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.toUpperCase())
                        }
                        placeholder={t('输入邀请码', 'Invitation code')}
                        aria-label={t('邀请码', 'Invitation code')}
                      />
                      <Button disabled={busy || !code.trim()} onClick={redeem}>
                        {busy
                          ? t('正在验证…', 'Checking…')
                          : t('验证并开通', 'Verify & activate')}
                      </Button>
                    </div>
                  </section>
                ) : (
                  <section className="account-panel referral-panel">
                    <div>
                      <p className="founder-eyebrow">
                        {t('邀请同行者', 'Invite someone')}
                      </p>
                      <h2>
                        {t(
                          '分享链接，双方获得内测积分。',
                          'Share your link; both receive beta credits.',
                        )}
                      </h2>
                      <p>
                        {t(
                          '对方登录并成功开通后，你获得 20 积分，对方获得 10 积分。积分不会自动购买服务、产生费用或调用模型。',
                          'After the other person signs in and activates access, you receive 20 credits and they receive 10. Credits never purchase services, create charges or invoke a model automatically.',
                        )}
                      </p>
                    </div>
                    <div className="referral-fields">
                      <label>
                        <span>{t('我的邀请码', 'My invitation code')}</span>
                        <div>
                          <Input
                            readOnly
                            value={account.referralCode}
                            onFocus={(event) => event.target.select()}
                          />
                          <Button
                            variant="outline"
                            onClick={() => copy(account.referralCode, 'code')}
                          >
                            {copied === 'code' ? <Check /> : <Copy />}
                            {copied === 'code'
                              ? t('已复制', 'Copied')
                              : t('复制', 'Copy')}
                          </Button>
                        </div>
                      </label>
                      <label>
                        <span>{t('我的邀请链接', 'My referral link')}</span>
                        <div>
                          <Input
                            readOnly
                            value={referralUrl}
                            onFocus={(event) => event.target.select()}
                          />
                          <Button
                            variant="outline"
                            onClick={() => copy(referralUrl, 'link')}
                          >
                            {copied === 'link' ? <Check /> : <Copy />}
                            {copied === 'link'
                              ? t('已复制', 'Copied')
                              : t('复制链接', 'Copy link')}
                          </Button>
                        </div>
                      </label>
                    </div>
                  </section>
                )}

                <section className="account-panel account-profile-panel">
                  <div>
                    <p className="founder-eyebrow">
                      {t('你的基本资料', 'Your basic profile')}
                    </p>
                    <h2>
                      {t(
                        '让后续指引更贴近你的创业阶段。',
                        'Make later guidance more relevant to your founder journey.',
                      )}
                    </h2>
                    <p>
                      {t(
                        '登录邮箱会由账号自动带入。以下信息均由你主动填写，可随时修改；不会改变初步评估结果。',
                        'Your account email is added automatically. The fields below are voluntary, editable, and do not change your initial assessment result.',
                      )}
                    </p>
                  </div>
                  <div className="account-profile-fields">
                    <label>
                      {t('目前所在国家或地区', 'Current country or region')}
                      <Input
                        value={profile.countryRegion}
                        maxLength={120}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            countryRegion: event.target.value,
                          })
                        }
                        placeholder={t(
                          '例如：中国上海',
                          'For example: Shanghai, China',
                        )}
                      />
                    </label>
                    <label>
                      {t(
                        '公司或项目名称（选填）',
                        'Company or project (optional)',
                      )}
                      <Input
                        value={profile.companyName}
                        maxLength={200}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            companyName: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t('目前阶段', 'Current stage')}
                      <select
                        value={profile.founderStage}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            founderStage: event.target
                              .value as AccountProfile['founderStage'],
                          })
                        }
                      >
                        <option value="">{t('请选择', 'Choose')}</option>
                        <option value="exploring">
                          {t(
                            '正在了解赴美创业与 O-1A',
                            'Exploring U.S. entrepreneurship and O-1A',
                          )}
                        </option>
                        <option value="building">
                          {t(
                            '正在筹备或设立公司',
                            'Preparing or forming a company',
                          )}
                        </option>
                        <option value="operating">
                          {t('公司已在运营', 'Company is operating')}
                        </option>
                      </select>
                    </label>
                    <label>
                      {t('偏好联系渠道', 'Preferred contact channel')}
                      <select
                        value={profile.contactChannel}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            contactChannel: event.target
                              .value as AccountProfile['contactChannel'],
                          })
                        }
                      >
                        <option value="">
                          {t('仅使用登录邮箱', 'Account email only')}
                        </option>
                        <option value="email">Email</option>
                        <option value="wechat">WeChat</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="other">{t('其他', 'Other')}</option>
                      </select>
                    </label>
                    {profile.contactChannel && (
                      <label className="account-contact-value">
                        {t('联系账号或地址', 'Contact handle or address')}
                        <Input
                          value={profile.contactValue}
                          maxLength={200}
                          onChange={(event) =>
                            setProfile({
                              ...profile,
                              contactValue: event.target.value,
                            })
                          }
                        />
                      </label>
                    )}
                  </div>
                  <label className="account-opt-in">
                    <Checkbox
                      checked={profile.updatesOptIn}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          updatesOptIn: checked === true,
                        })
                      }
                    />
                    <span>
                      {t(
                        '愿意接收重要产品更新和 O-1A 流程提醒；可随时取消。',
                        'Receive important product updates and O-1A process reminders; unsubscribe at any time.',
                      )}
                    </span>
                  </label>
                  <div className="account-profile-actions">
                    <Button disabled={busy} onClick={saveProfile}>
                      {busy
                        ? t('正在保存…', 'Saving…')
                        : t('保存资料', 'Save profile')}
                    </Button>
                    <a href="/privacy">
                      {t('查看隐私说明', 'View privacy notice')}
                    </a>
                  </div>
                </section>

                <section
                  className="account-panel account-support-history"
                  id="support"
                >
                  <div>
                    <h2>{t('我的提问与反馈', 'My questions and feedback')}</h2>
                    <p>
                      {t(
                        '使用右下角“帮助与留言”提交的问题会保存在这里。客服也可通过邮箱回复。',
                        'Questions submitted through “Ask USCOO” appear here. Support may also reply by email.',
                      )}
                    </p>
                  </div>
                  {supportRequests.length ? (
                    <div className="account-support-list">
                      {supportRequests.map((request) => (
                        <article key={request.id}>
                          <div>
                            <span>{request.created.slice(0, 10)}</span>
                            <strong>
                              {request.status === 'answered'
                                ? t('已回复', 'Answered')
                                : request.status === 'closed'
                                  ? t('已结束', 'Closed')
                                  : t('待回复', 'Open')}
                            </strong>
                          </div>
                          <p>{request.message}</p>
                          {request.reply && (
                            <blockquote>
                              <b>USCOO</b>
                              {request.reply}
                            </blockquote>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="account-empty-note">
                      {t(
                        '还没有提交问题。需要帮助时，点击右下角“帮助与留言”。',
                        'No questions yet. Use “Ask USCOO” in the lower-right corner whenever you need help.',
                      )}
                    </p>
                  )}
                </section>

                <section className="account-panel account-controls">
                  <div>
                    <h2>{t('账号、数据与控制', 'Account, data & controls')}</h2>
                    <p>
                      {t(
                        '项目按账号隔离保存。导出、分享和删除仍需在每个项目的“设置”中分别确认。',
                        'Projects are isolated by account. Exporting, sharing and deletion still require separate confirmation in each project’s Settings.',
                      )}
                    </p>
                  </div>
                  <div className="account-control-links">
                    {isAdmin && (
                      <a href="/admin">{t('运营后台', 'Operations')}</a>
                    )}
                    <a href={signOutPath} target="_top">
                      <LogOut size={16} />
                      {t('退出登录', 'Sign out')}
                    </a>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
