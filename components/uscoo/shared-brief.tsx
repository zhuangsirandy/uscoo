'use client';
import { LanguageSwitch, useI18n } from './language';
export default function SharedBrief({
  snapshot,
  expires,
}: {
  snapshot?: any;
  expires?: string;
}) {
  const { t, language } = useI18n();
  const progress = snapshot && snapshot.kind !== 'lawyer';
  return (
    <div className="founder-app shared-brief">
      <header className="founder-top">
        <a href="/beta" className="founder-brand">
          USCOO
        </a>
        <LanguageSwitch />
      </header>
      <main className="founder-main">
        <section className="founder-page-heading">
          <p className="founder-eyebrow">
            {progress
              ? t(
                  '准备进度 · 只读分享',
                  'Preparation progress · Read-only share',
                )
              : t(
                  '律所沟通包 · 只读分享',
                  'Counsel brief · Read-only share',
                )}
          </p>
          <h1>
            {snapshot
              ? progress
                ? t(
                    '一份申请项目的准备进度',
                    'Application preparation progress',
                  )
                : snapshot.title
              : t('这个分享已不可用。', 'This share is no longer available.')}
          </h1>
          <p>
            {snapshot
              ? progress
                ? t(
                    '这里只显示分享时的任务数量，不能据此判断申请资格或材料质量。',
                    'This snapshot shows task counts only. It does not determine eligibility or evidence quality.',
                  )
                : t(
                    '以下仅包含分享人选择的章节。不含原件或后续修改，不能据此判断已满足申请条件。',
                    'Only the sections selected by the owner are included. Original files and later edits are excluded. This is not a determination of eligibility.',
                  )
              : t(
                  '链接可能已过期或被撤回，请联系分享人。',
                  'The link may have expired or been revoked. Please contact the owner.',
                )}
          </p>
          {snapshot && (
            <small>
              {t('快照日期', 'Snapshot date')}: {snapshot.created.slice(0, 10)}{' '}
              · {t('到期', 'Expires')}: {expires?.slice(0, 10)}
            </small>
          )}
        </section>
        {progress && (
          <div className="founder-dual">
            {(['company', 'evidence'] as const).map((k) => (
              <article key={k}>
                <h2>
                  {k === 'company'
                    ? t('公司准备', 'Company preparation')
                    : t('个人材料', 'Personal evidence')}
                </h2>
                <strong>
                  {snapshot[k].done} / {snapshot[k].total}
                </strong>
                <p>{t('任务已完成', 'Tasks completed')}</p>
              </article>
            ))}
          </div>
        )}
        {snapshot && !progress && (
          <article className="lawyer-paper">
            {(language === 'en' && snapshot.sectionsEn
              ? snapshot.sectionsEn
              : snapshot.sections
            ).map((s: any) => (
              <section className="lawyer-section" key={s.number}>
                <header>
                  <span>{s.number}</span>
                  <div>
                    <h2>{t(s.title)}</h2>
                    <p>{t(s.description)}</p>
                  </div>
                </header>
                <dl>
                  {s.items.map((x: any, i: number) => (
                    <div className="lawyer-item" key={i}>
                      <dt>
                        {t(x.label)}
                        <span>{t(x.status)}</span>
                      </dt>
                      <dd>{t(x.detail)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </article>
        )}
      </main>
    </div>
  );
}
