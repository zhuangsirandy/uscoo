'use client';
import type { MouseEvent } from 'react';
import { ArrowRight, FolderOpen, Leaf, UserRound } from 'lucide-react';
import { LanguageSwitch, useI18n } from './language';
export function openJourneyPage(e: MouseEvent<HTMLAnchorElement>) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  e.preventDefault();
  e.stopPropagation();
  window.location.assign(e.currentTarget.href);
}
export type Stage = 'overview' | 'assessment' | 'result';
export function FounderHeader({
  active = 0,
  projectId,
  onNavigate,
  workspace = false,
}: {
  active?: number;
  projectId?: string;
  onNavigate?: (stage: Stage) => void;
  workspace?: boolean;
}) {
  const { t } = useI18n();
  const suffix = projectId ? `?project=${encodeURIComponent(projectId)}` : '';
  const workspaceHome = `/prepare${suffix}${suffix ? '&' : '?'}step=path`;
  const assessment = (view: string) =>
    `/beta?view=${view}${projectId ? `&case=${encodeURIComponent(projectId)}` : ''}`;
  const items = [
    [t('先看懂', 'Understand'), '/beta', 'overview'],
    [
      t('说说你的经历', 'Tell your story'),
      assessment('assessment'),
      'assessment',
    ],
    [
      t('看看你手上有什么', 'See what you have'),
      assessment('result'),
      'result',
    ],
    [t('还差什么', 'What is missing'), `/pre-review${suffix}`, ''],
    [t('怎么继续', 'How to continue'), `/lawyer${suffix}`, ''],
  ];
  return (
    <>
      <a href="#founder-main" className="founder-skip">
        {t('跳到正文', 'Skip to content')}
      </a>
      <header className="founder-top">
        <a
          href={workspace ? workspaceHome : '/'}
          onClick={openJourneyPage}
          className="founder-brand"
          aria-label={
            workspace
              ? t('USCOO 工作台总览', 'USCOO workspace overview')
              : t('USCOO 网站首页', 'USCOO website home')
          }
        >
          <Leaf size={22} /> USCOO{' '}
          <span>
            {workspace
              ? t(
                  'O-1A 杰出人才申请工作台',
                  'O-1A Extraordinary Ability Workspace',
                )
              : t('创业者的 O-1A 准备助手', 'O-1A preparation for founders')}
          </span>
        </a>
        <div className="founder-header-actions">
          <LanguageSwitch />
          <a href="/account" className="founder-private account-entry">
            <UserRound size={16} />
            {t('账号', 'Account')}
          </a>
          {!workspace && (
            <a
              href={`/prepare${suffix}`}
              onClick={openJourneyPage}
              className="founder-private workspace-entry"
              aria-current={active === 5 ? 'page' : undefined}
            >
              <FolderOpen size={16} />
              {t(
                'O-1A 杰出人才申请工作台',
                'O-1A Extraordinary Ability Workspace',
              )}
            </a>
          )}
        </div>
      </header>
      {!workspace && (
        <nav
          className="founder-progress"
          aria-label={t('了解与准备路径', 'Explore and prepare')}
        >
          {items.map(([label, href, stage], i) => (
            <a
              key={i}
              href={href}
              aria-current={active === i ? 'step' : undefined}
              onClick={
                onNavigate && stage
                  ? (e) => {
                      e.preventDefault();
                      onNavigate(stage as Stage);
                    }
                  : openJourneyPage
              }
            >
              <span>{i + 1}</span>
              {label}
              {i < 4 && <ArrowRight size={13} className="progress-arrow" />}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
