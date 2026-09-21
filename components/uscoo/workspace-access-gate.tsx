'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Workspace from './workspace';
import { FounderHeader } from './journey-header';
import { useI18n } from './language';

export default function WorkspaceAccessGate({
  signedIn,
  userName,
  initialProjectId,
  initialInviteCode = '',
  initialAccessStatus,
}: {
  signedIn: boolean;
  userName: string;
  initialProjectId?: string;
  initialInviteCode?: string;
  initialAccessStatus?: 'pending' | 'active';
}) {
  const { t } = useI18n();
  const [state, setState] = useState<
    'loading' | 'pending' | 'active' | 'error'
  >(signedIn ? initialAccessStatus || 'loading' : 'pending');
  const [code, setCode] = useState(initialInviteCode.toUpperCase());
  const [error, setError] = useState('');

  async function load() {
    try {
      const response = await fetch('/api/uscoo/account', { cache: 'no-store' });
      const body: any = await response.json();
      if (!response.ok) throw Error(body.error || '账号读取失败。');
      setState(body.account.accessStatus === 'active' ? 'active' : 'pending');
    } catch (caught) {
      setError((caught as Error).message);
      setState('error');
    }
  }

  useEffect(() => {
    if (signedIn && !initialAccessStatus) load();
  }, [signedIn]);

  async function redeem() {
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/uscoo/account/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body: any = await response.json();
      if (!response.ok) throw Error(body.error || '邀请码未能使用。');
      setState('active');
    } catch (caught) {
      setError((caught as Error).message);
      setState('pending');
    }
  }

  if (state === 'active') {
    return (
      <Workspace
        signedIn
        userName={userName}
        initialProjectId={initialProjectId}
      />
    );
  }

  const returnTo = `/prepare${initialProjectId ? `?project=${encodeURIComponent(initialProjectId)}` : ''}`;
  return (
    <div className="founder-app unified-workspace access-gate-page">
      <FounderHeader workspace projectId={initialProjectId} />
      <main id="founder-main" className="access-gate-main">
        {!signedIn ? (
          <section className="access-gate-card">
            <UserRound />
            <p className="founder-eyebrow">
              {t('先确认你的账号', 'Confirm your account first')}
            </p>
            <h1>
              {t(
                '登录后进入你的私有申请空间。',
                'Sign in to enter your private application space.',
              )}
            </h1>
            <p>
              {t(
                '登录后，你的申请材料、版本和进度会按账号隔离保存。',
                'After sign-in, your application records, versions and progress are kept in an account-isolated workspace.',
              )}
            </p>
            <a
              className="founder-button"
              href={`/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`}
              target="_top"
            >
              {t('安全登录', 'Sign in securely')}{' '}
              <ArrowRight size={17} />
            </a>
            <a href="/beta">{t('返回了解项目', 'Back to About O-1A')}</a>
          </section>
        ) : (
          <section className="access-gate-layout">
            <div className="access-gate-card">
              <KeyRound />
              <p className="founder-eyebrow">
                {t('核心工作台准入', 'Core workspace access')}
              </p>
              <h1>
                {t(
                  '输入邀请码，打开你的申请工作台。',
                  'Enter an invitation code to open your application workspace.',
                )}
              </h1>
              <p>
                {t(
                  '账号已登录。邀请码只验证一次；通过后，你保存的项目、前期评估和申请方式会原样进入工作台。',
                  'Your account is signed in. The invite is verified once; saved projects, prior assessment and your application method carry into the workspace unchanged.',
                )}
              </p>
              <div className="invite-code-form">
                <Input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder={t('输入邀请码', 'Invitation code')}
                  aria-label={t('邀请码', 'Invitation code')}
                />
                <Button
                  disabled={state === 'loading' || !code.trim()}
                  onClick={redeem}
                >
                  {state === 'loading'
                    ? t('正在验证…', 'Checking…')
                    : t('验证并进入工作台', 'Verify & enter workspace')}
                </Button>
              </div>
              {error && (
                <p className="founder-error" role="alert">
                  {t(error)}
                </p>
              )}
              <div className="access-gate-links">
                <a href="/beta">{t('回看前期路径', 'Review guided steps')}</a>
                <a href="/account">
                  {t('打开账号中心', 'Open account center')}
                </a>
              </div>
            </div>
            <aside className="access-explainer">
              <LockKeyhole />
              <h2>
                {t(
                  '你可以先完成初步评估。保存材料与进度时，再开通工作台。',
                  'You may complete the initial assessment first. Activate the workspace when you are ready to save materials and progress.',
                )}
              </h2>
              <ul>
                <li>
                  <CheckCircle2 />
                  {t(
                    '公开了解 O-1A 与完整流程',
                    'Public O-1A guide and full-path overview',
                  )}
                </li>
                <li>
                  <CheckCircle2 />
                  {t(
                    '公开完成初步评估并查看还能补什么',
                    'Public initial assessment with concrete next actions',
                  )}
                </li>
                <li>
                  <CheckCircle2 />
                  {t('登录后保存个人项目', 'Sign in to save personal projects')}
                </li>
                <li>
                  <CheckCircle2 />
                  {t(
                    '邀请码开通双线工作台与协作工具',
                    'Invite unlocks the dual-track workspace and collaboration tools',
                  )}
                </li>
              </ul>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
