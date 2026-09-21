'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Gift, KeyRound, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitch, useI18n } from './language';

export default function JoinInvite({
  signedIn,
  initialCode,
  signInPath,
}: {
  signedIn: boolean;
  initialCode: string;
  signInPath: string;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'done'>(
    'idle',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!signedIn) return;
    setStatus('loading');
    fetch('/api/uscoo/account', { cache: 'no-store' })
      .then(async (response) => {
        const body: any = await response.json();
        if (!response.ok) throw Error(body.error);
        setStatus(body.account.accessStatus === 'active' ? 'active' : 'idle');
      })
      .catch((caught) => {
        setError(caught.message);
        setStatus('idle');
      });
  }, [signedIn]);

  async function accept() {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch('/api/uscoo/account/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body: any = await response.json();
      if (!response.ok) throw Error(body.error || '邀请码未能使用。');
      setStatus('done');
    } catch (caught) {
      setError((caught as Error).message);
      setStatus('idle');
    }
  }

  return (
    <div className="founder-app join-page">
      <header className="account-header">
        <a href="/" className="marketing-brand">
          <Leaf size={24} />
          <strong>USCOO</strong>
          <span>{t('邀请加入', 'Invitation')}</span>
        </a>
        <LanguageSwitch />
      </header>
      <main className="join-main">
        <section className="join-card">
          {status === 'done' ? <Gift /> : <KeyRound />}
          <p className="founder-eyebrow">
            {t('USCOO 定向免费邀请', 'USCOO invitation-based free access')}
          </p>
          <h1>
            {status === 'done'
              ? t('核心工作台已经开通。', 'Your core workspace is now active.')
              : status === 'active'
                ? t(
                    '你的账号已经有访问权限。',
                    'Your account already has access.',
                  )
                : t(
                    '有人邀请你把 O-1A 准备做得更清楚。',
                    'You have been invited to make O-1A preparation clearer.',
                  )}
          </h1>
          <p>
            {t(
              '先看懂项目、完成初步评估，再用申请公司与个人证明双线工作台持续整理、核对和跟进。',
              'Understand the path and complete an initial assessment, then organize, verify and track petitioner and beneficiary work in one dual-track workspace.',
            )}
          </p>
          {!signedIn ? (
            <a className="founder-button" href={signInPath} target="_top">
              {t('登录并接受邀请', 'Sign in & accept invite')}
              <ArrowRight size={17} />
            </a>
          ) : status === 'active' || status === 'done' ? (
            <div className="founder-actions">
              <a className="founder-button" href="/beta">
                {t('从了解项目开始', 'Start with About O-1A')}
                <ArrowRight size={17} />
              </a>
              <a href="/account">{t('查看我的账号', 'View my account')}</a>
            </div>
          ) : (
            <div className="invite-code-form">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t('输入邀请码', 'Invitation code')}
                aria-label={t('邀请码', 'Invitation code')}
              />
              <Button
                disabled={status === 'loading' || !code.trim()}
                onClick={accept}
              >
                {status === 'loading'
                  ? t('正在验证…', 'Checking…')
                  : t('接受邀请并开通', 'Accept & activate')}
              </Button>
            </div>
          )}
          {error && (
            <p className="founder-error" role="alert">
              {t(error)}
            </p>
          )}
          <small>
            {t(
              '成功开通后，你获得 10 个内测申请积分；邀请人获得 20 个。不会自动产生任何费用。',
              'After activation, you receive 10 beta application credits and the inviter receives 20. No charge is created automatically.',
            )}
          </small>
        </section>
      </main>
    </div>
  );
}
