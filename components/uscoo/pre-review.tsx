'use client';
import { useEffect, useState } from 'react';
import { FounderHeader } from './journey-header';
import { useI18n } from './language';
import { CRITERIA, POLICY_URL, type CaseData } from '@/lib/case-domain';
import { EXPERIENCE } from '@/lib/founder-intake';
export default function PreReview({
  signedIn,
  initialProjectId,
}: {
  signedIn: boolean;
  initialProjectId?: string;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<CaseData | null>(null),
    [busy, setBusy] = useState(signedIn),
    [error, setError] = useState('');
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/uscoo/projects', { cache: 'no-store' });
        if (!r.ok)
          throw Error(
            t(
              '暂时无法读取项目，请重试。',
              'Unable to load your preparations. Please try again.',
            ),
          );
        const list: any = await r.json();
        const id =
          new URLSearchParams(window.location.search).get('project') ||
          list.projects[0]?.id;
        if (id) {
          const response = await fetch(
            `/api/uscoo/projects/${encodeURIComponent(id)}`,
            { cache: 'no-store' },
          );
          const body: any = await response.json();
          if (!response.ok) throw Error(body.error);
          if (!cancelled) setData(body);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);
  const id = data?.project.id,
    suffix = id ? `?project=${encodeURIComponent(id)}` : '';
  const intake = data?.records.find((r) => r.kind === 'intake')?.body,
    evidence = data?.records.filter((r) => r.kind === 'evidence') || [];
  const profile = data?.project.profile;
  return (
    <div className="founder-app">
      <FounderHeader active={3} projectId={id || initialProjectId} />
      <main id="founder-main" className="founder-main">
        <section className="founder-page-heading">
          <p className="founder-eyebrow">
            {t(
              '材料预审 · 对标 USCIS 标准',
              'Document pre-review · USCIS criteria',
            )}
          </p>
          <h1>
            {t(
              '先看已有材料能说明什么，还缺什么。',
              'See what your records support and what is missing.',
            )}
          </h1>
          <p className="founder-lead">
            {t(
              '这是一份材料预审清单。先检查现有线索、证据和工作安排，再选择自主申请或委托律所；正式文书、公司准备与递交跟踪在申请工作台继续。',
              'This checklist maps your leads, evidence and work arrangements before you choose self-filing or a law firm. Formal documents, company preparation and filing tracking continue in the application workspace.',
            )}
          </p>
          <div className="founder-actions">
            <a
              className="founder-button outline"
              href={`/beta?view=result${id ? `&case=${id}` : ''}`}
            >
              {t('返回评估结果与补充', 'Back to results & next actions')}
            </a>
            <a className="founder-button" href={`/lawyer${suffix}`}>
              {t('下一步：选择申请方式', 'Next: choose an application method')}
            </a>
          </div>
        </section>
        {busy && (
          <p role="status">
            {t('正在读取已保存的材料…', 'Loading your saved records…')}
          </p>
        )}
        {error && (
          <p role="alert" className="founder-error">
            {t(error)}{' '}
            <a href={`/pre-review${suffix}`}>{t('重新读取', 'Retry')}</a>
          </p>
        )}
        {!data && !busy && (
          <section className="founder-inline-empty pre-review-start">
            <h2>
              {t(
                '先浏览清单，再带入你的评估',
                'Explore the checklist, then add your assessment',
              )}
            </h2>
            <p>
              {t(
                '目前显示通用检查项，不代表已完成预审。保存初评后，这里会显示你提到的方向、关联材料和待核对事项。',
                'These are general checks, not a completed review. Save an initial assessment to see your selected directions, linked evidence and open questions.',
              )}
            </p>
            <a href="/beta?view=assessment">
              {t(
                '完成或保存初步评估',
                'Complete or save an initial assessment',
              )}
            </a>
          </section>
        )}
        <section className="founder-section">
          <h2>
            {t('申请公司与真实赴美工作', 'Petitioner and proposed U.S. work')}
          </h2>
          <div className="founder-dual pre-review-dual">
            {[
              [
                t('申请公司', 'Petitioning company'),
                profile?.company,
                t(
                  '核对公司名称、设立记录、申请与签字安排；尚无公司时先确认适用路径。',
                  'Check the entity name, formation records, petition arrangement and signing authority. If no company exists, first clarify the filing arrangement.',
                ),
              ],
              [
                t('赴美工作与时间', 'Proposed U.S. work & timing'),
                profile?.duties,
                t(
                  '对应职位、具体职责、工作地点、开始和结束日期、报酬及合同安排；把获批目标与开工日期分开核对。',
                  'Match the role, duties, workplace, work dates, compensation and contractual arrangements. Check target approval and work-start dates separately.',
                ),
              ],
            ].map(([label, value, note]) => (
              <article key={label}>
                <h3>{label}</h3>
                <strong>{value || t('待补充', 'To be added')}</strong>
                <p>{note}</p>
              </article>
            ))}
          </div>
          <a href={`/beta?view=assessment${id ? `&case=${id}` : ''}`}>
            {t(
              '下一步：补充基本信息与计划',
              'Next: clarify your basic information and plans',
            )}
          </a>
        </section>
        <section className="founder-section">
          <h2>
            {t('你的杰出能力证明', 'Your extraordinary-ability evidence')}
          </h2>
          <p>
            {t(
              '下面八类用于整理常见证据方向。重大国际公认奖项是另一种证明路径；通常按替代证据路径需满足至少三类要求，并接受整体证据审查。此处的线索或材料数量不能当作满足标准或获批的结论。',
              'These eight categories organize common evidence directions. A major internationally recognized award is another evidentiary route. The alternative route generally requires at least three categories plus an assessment of the total evidence. Counts below do not establish that any criterion is met or predict approval.',
            )}
          </p>
          <div className="pre-review-list">
            {CRITERIA.map((c) => {
              const linked = evidence.filter((r) =>
                r.body.criteria?.includes(c.id),
              );
              const selected = intake?.answers?.[c.id];
              const verified = linked.filter(
                (record) =>
                  record.body.status === 'reviewed' &&
                  record.body.confirmed &&
                  record.body.authenticity === 'checked',
              );
              const reviewState = verified.length
                ? t('材料已初步核对', 'Records initially reviewed')
                : linked.length
                  ? t('已有材料，下一步核对来源', 'Records added; verify sources next')
                  : selected === 'yes' || selected === 'unsure'
                    ? t('有希望的方向，下一步找材料', 'Promising direction; find records next')
                    : t('先判断是否适用', 'First decide whether it applies');
              return (
                <article key={c.id} className="review-criterion" data-state={verified.length ? 'reviewed' : linked.length ? 'started' : selected ? 'direction' : 'open'}>
                  <header>
                    <h3>{t(c.title)}</h3>
                    <span>{reviewState}</span>
                  </header>
                  <p>
                    <strong>{t('核对重点：', 'Check: ')}</strong>
                    {t(c.check)}
                  </p>
                  <p>
                    {linked.length
                      ? `${linked.length} ${t('份已关联材料，仍需逐项核验', 'linked records; each still needs review')}`
                      : selected === 'yes'
                        ? t(
                            '初评提到此类经历，尚无关联材料。',
                            'Mentioned in your assessment; no linked evidence yet.',
                          )
                        : t(
                            '尚无关联材料，可先确认是否适用。',
                            'No linked evidence yet. First decide whether this direction applies.',
                          )}
                  </p>
                  {linked.length > 0 && (
                    <ul>
                      {linked.map((r) => (
                        <li key={r.id}>
                          {r.body.title} ·{' '}
                          {r.body.confirmed &&
                          r.body.authenticity === 'checked' &&
                          r.body.status === 'reviewed'
                            ? t(
                                '已有人工核对记录，仍需专业判断',
                                'Human review recorded; professional judgment still needed',
                              )
                            : t('待核验', 'Not yet verified')}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="criterion-next-action">
                    <strong>{t('现在做什么', 'What to do now')}</strong>
                    <p>{t(EXPERIENCE.find((x) => x.id === c.id)?.next)}</p>
                  </div>
                  <details>
                    <summary>{t('核对时要注意什么', 'What to check')}</summary>
                    <p>{t(c.caution)}</p>
                  </details>
                </article>
              );
            })}
          </div>
          <a
            className="founder-source"
            href={POLICY_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t(
              '对照 USCIS 受益人标准原文',
              'Read the USCIS beneficiary criteria',
            )}
          </a>
        </section>
        <section className="founder-section">
          <h2>
            {t(
              '共同检查：来源、翻译与一致性',
              'Shared checks: sources, translations and consistency',
            )}
          </h2>
          <p>
            {t(
              '保留原件、出处、日期和页码；区分个人与团队成果；核对需要的英文翻译、咨询意见（Consultation）及适用例外。名称、职责和日期应在各份材料中一致。',
              'Keep originals, provenance, dates and page references. Distinguish personal and team contributions. Check required English translations, consultation evidence and any applicable exception. Names, duties and dates should be consistent across records.',
            )}
          </p>
        </section>
        <section className="journey-decision">
          <h2>
            {t(
              '预审之后，选择怎样继续',
              'Choose how to continue after pre-review',
            )}
          </h2>
          <p>
            {t(
              '下一页先选择申请方式。自主申请直接进入 USCOO 工作台；委托律所会生成沟通资料包和分享链接。两种方式都保留同一份公司与个人材料记录。',
              'Choose your application method next. Self-filing continues directly in the USCOO workspace; the law firm path creates a counsel brief and sharing link. Both retain the same petitioner and beneficiary records.',
            )}
          </p>
          <div className="founder-actions">
            <a className="founder-button" href={`/lawyer${suffix}`}>
              {t('选择自主申请或委托律所', 'Choose self-filing or a law firm')}
            </a>
            <a className="founder-button outline" href={`/prepare${suffix}`}>
              {t(
                '查看 O-1A 杰出人才申请工作台',
                'Explore the O-1A application workspace',
              )}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
