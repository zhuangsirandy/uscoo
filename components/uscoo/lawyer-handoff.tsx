'use client';
import { useI18n } from './language';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  FolderOpen,
  LockKeyhole,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PreparationChoice from './preparation-choice';
import LawyerShare from './lawyer-share';
import { FounderHeader } from './journey-header';
import { Choice } from './case-editor';
import { BRIEF_OUTLINE, buildLawyerBrief } from '@/lib/lawyer-brief';
import { type CaseData, type CaseProject } from '@/lib/case-domain';
export default function LawyerHandoff({
  signedIn = true,
  initialProjectId,
}: {
  signedIn?: boolean;
  initialProjectId?: string;
}) {
  const { t, f, language } = useI18n();
  const [data, setData] = useState<CaseData | null>(null),
    [projects, setProjects] = useState<CaseProject[]>([]);
  const [busy, setBusy] = useState(signedIn),
    [error, setError] = useState('');
  async function load(id: string) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/uscoo/projects/${id}`, { cache: 'no-store' });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error || '资料读取失败。');
      setData(b);
      window.history.replaceState(
        null,
        '',
        `/lawyer?project=${id}${window.location.hash}`,
      );
    } catch (e) {
      setData(null);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!signedIn) return;
    fetch('/api/uscoo/projects', { cache: 'no-store' })
      .then(async (r) => {
        const b: any = await r.json();
        if (!r.ok) throw new Error(b.error || '项目读取失败。');
        setProjects(b.projects);
        const id =
          new URLSearchParams(window.location.search).get('project') ||
          b.projects[0]?.id;
        if (id) await load(id);
        else setBusy(false);
      })
      .catch((e) => {
        setError(e.message);
        setBusy(false);
      });
  }, []);
  const sections = data ? buildLawyerBrief(data, language) : [];
  const base = data ? `/api/uscoo/projects/${data.project.id}` : '';
  const edit = data
    ? `/prepare?project=${data.project.id}`
    : '/beta#assessment';
  const counselSelected = data?.project.profile.preparationMode === 'counsel';
  useEffect(() => {
    if (!counselSelected || window.location.hash !== '#counsel-package') return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById('counsel-package')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [counselSelected]);
  return (
    <div className="founder-app lawyer-app">
      <FounderHeader
        active={4}
        projectId={data?.project.id || initialProjectId}
      />
      <main id="founder-main" className="founder-main">
        <section className="founder-page-heading">
          <p className="founder-eyebrow">
            {t(
              '第 5 步 · 选择申请方式',
              'Step 5 · Choose an application method',
            )}
          </p>
          <h1>{t('自主申请，还是委托律所？', 'Self-filing or a law firm?')}</h1>
          <p className="founder-lead">
            {t(
              '委托律所是可选的申请方式，不是必须经过的步骤。先选择准备方式；如果选择委托律所，USCOO 再生成沟通资料包和只读分享链接。',
              'Working with a law firm is an optional application method, not a required step. If you choose it, USCOO then creates the counsel brief and read-only sharing tools.',
            )}
          </p>
        </section>
        {t(
          error && (
            <p className="founder-error" role="alert">
              {t(error)} <a href="/lawyer">{t('重新读取')}</a>
            </p>
          ),
        )}
        {t(
          busy ? (
            <p className="founder-loading" role="status">
              {t('正在读取你的私有项目\u2026')}
            </p>
          ) : data ? (
            <>
              <div className="lawyer-toolbar">
                <Choice
                  label={t('选择交接项目')}
                  value={data.project.id}
                  options={projects.map((p) => [p.id, p.title] as const)}
                  onChange={load}
                />
                <span>
                  {t('资料版本')}
                  {t(data.project.revision)}
                  {t('\u00B7 更新于')}
                  {t(' ')}
                  {t(data.project.updated.slice(0, 10))}
                </span>
                <a href={`/pre-review?project=${data.project.id}`}>
                  {t('返回材料预审清单', 'Back to pre-review checklist')}
                  <ArrowRight size={15} />
                </a>
              </div>
              <PreparationChoice data={data} onData={setData} />
              {!counselSelected && (
                <section className="counsel-package-preview">
                  <div>
                    <p className="founder-eyebrow">
                      {t('委托律所分支', 'Law firm collaboration branch')}
                    </p>
                    <h2>
                      {t(
                        '选择委托律所后，这里会生成沟通资料包。',
                        'Choose a law firm to create the counsel brief here.',
                      )}
                    </h2>
                    <p>
                      {t(
                        '资料包会整理受益人、申请公司、杰出经历、证据来源、材料缺口和待讨论问题；选择自主申请时不需要经过这个环节。',
                        'The brief organizes beneficiary and petitioner facts, achievements, evidence sources, gaps and discussion questions. Self-filing does not require this step.',
                      )}
                    </p>
                  </div>
                  <div className="counsel-package-list">
                    {BRIEF_OUTLINE.slice(0, 4).map(([title], i) => (
                      <span key={title}>
                        0{i + 1} · {t(title)}
                      </span>
                    ))}
                    <span>
                      {t(
                        '共 8 个章节，选择后可预览、下载或分享',
                        '8 sections total · preview, download or share after selection',
                      )}
                    </span>
                  </div>
                </section>
              )}
              <section
                className="brief-readiness"
                id="counsel-package"
                hidden={!counselSelected}
              >
                <h2>
                  {t(
                    '这份沟通包准备到哪一步？',
                    'What is ready in this brief?',
                  )}
                </h2>
                <p>
                  {t(
                    '这是初谈与协作的基础材料，保留未核实和待补充标记，尚不是正式递交申请包。章节随已保存记录生成，不会自动替你判断资格或确定法律策略。',
                    'This brief supports an initial discussion and collaboration. Unverified facts and gaps remain marked. It is not a filing-ready petition or a legal strategy determination.',
                  )}
                </p>
                <p>
                  {data.records.filter((r) => r.kind === 'evidence').length}{' '}
                  {t('条材料记录', 'evidence records')} ·{' '}
                  {data.records.filter((r) => r.kind === 'event').length}{' '}
                  {t('条经历记录', 'experience records')}
                </p>
              </section>
              <div className="lawyer-share-launch" hidden={!counselSelected}>
                <LawyerShare
                  key={data.project.id}
                  data={data}
                  onRefresh={async () => {
                    const r = await fetch(base, { cache: 'no-store' });
                    if (!r.ok) throw new Error('资料更新未完成，请刷新。');
                    setData((await r.json()) as CaseData);
                  }}
                />
              </div>
              <div className="lawyer-downloads" hidden={!counselSelected}>
                <div>
                  <LockKeyhole size={20} />
                  <div>
                    <strong>{t('先预览，再决定交给谁。')}</strong>
                    <p>
                      {t(
                        '这里仍是你的私有资料。页面不会自动分享；下载包含个人资料和原件。',
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <a
                    className="founder-button outline"
                    href={`${base}/lawyer-brief?lang=${language}`}
                  >
                    <FileText size={17} />
                    {t('下载八节摘要 DOCX')}
                  </a>
                  <a
                    className="founder-button"
                    href={`${base}/export?lang=${language}`}
                  >
                    <Download size={17} />
                    {t('下载摘要与原件 ZIP')}
                  </a>
                  <Button variant="ghost" onClick={() => window.print()}>
                    <Printer size={16} />
                    {t('打印预览')}
                  </Button>
                </div>
              </div>
              <div className="lawyer-layout" hidden={!counselSelected}>
                <aside className="lawyer-index">
                  <span className="founder-overline">{t('本次交接包含')}</span>
                  <nav aria-label={t('交接资料目录')}>
                    {t(
                      sections.map((s, i) => (
                        <a href={`#brief-${i + 1}`} key={s.title}>
                          <span>0{t(i + 1)}</span>
                          {t(s.title)}
                        </a>
                      )),
                    )}
                  </nav>
                  <p>
                    {t(
                      '\u201C已核对\u201D是用户记录的状态，仍需专业判断。未确认的线索始终保留标记。',
                    )}
                  </p>
                  <a href={`${edit}&step=profile`} className="founder-source">
                    {t('补充个人与公司信息')}
                    <ArrowUpRight size={14} />
                  </a>
                </aside>
                <article className="lawyer-paper">
                  <div className="lawyer-paper-head">
                    <span>USCOO / O-1A PREPARATION BRIEF</span>
                    <h2>{t(data.project.title)}</h2>
                    <p>{t('用于初谈与材料复核 \u00B7 尚未作为正式申请提交')}</p>
                  </div>
                  {t(
                    sections.map((s, i) => (
                      <section
                        id={`brief-${i + 1}`}
                        className="lawyer-section"
                        key={s.title}
                      >
                        <header>
                          <span>0{t(i + 1)}</span>
                          <div>
                            <h2>{t(s.title)}</h2>
                            <p>{t(s.description)}</p>
                          </div>
                        </header>
                        {t(
                          s.items.length ? (
                            <dl>
                              {t(
                                s.items.map((x, n) => (
                                  <div key={n} className="lawyer-item">
                                    <dt>
                                      {t(x.label)}
                                      {t(
                                        x.status && <span>{t(x.status)}</span>,
                                      )}
                                    </dt>
                                    <dd>{t(x.detail)}</dd>
                                    {t(
                                      x.hasFile && (
                                        <a
                                          href={`${base}/files/${x.sourceId}`}
                                          className="founder-source"
                                        >
                                          <Download size={13} />
                                          {t('查看原始文件')}
                                        </a>
                                      ),
                                    )}
                                  </div>
                                )),
                              )}
                            </dl>
                          ) : (
                            <div className="lawyer-unfilled">
                              <FileText size={19} />
                              <p>
                                {t(
                                  '这部分还没有记录。可以带着问题去初谈，或先补充再导出。',
                                )}
                              </p>
                              <a
                                href={`${edit}&step=${i === 2 || i === 6 ? 'story' : 'evidence'}`}
                              >
                                {t('补充这部分')}
                                <ArrowRight size={13} />
                              </a>
                            </div>
                          ),
                        )}
                      </section>
                    )),
                  )}
                </article>
              </div>
            </>
          ) : (
            !error && (
              <>
                <div className="lawyer-empty-intro">
                  <FolderOpen size={30} />
                  <div>
                    <h2>
                      {t(
                        '先完成初评并保存项目，再选择申请方式。',
                        'Complete the assessment and save a project before choosing a method.',
                      )}
                    </h2>
                    <p>
                      {t(
                        '自主申请与律所协作都从同一份项目继续；只有选择律所后，才生成律所沟通包。',
                        'Self-filing and law firm collaboration continue from the same project. The counsel brief is created only after you choose a law firm.',
                      )}
                    </p>
                  </div>
                  <a className="founder-button" href="/beta?view=assessment">
                    {t('先梳理我的经历')}
                    <ArrowRight size={17} />
                  </a>
                </div>
                <section className="journey-decision">
                  <h2>{t('两种申请准备方式', 'Two ways to prepare')}</h2>
                  <div className="founder-dual">
                    <article>
                      <h3>{t('自主申请', 'Self-filing')}</h3>
                      <p>
                        {t(
                          '用 O-1A 工作台完成材料收集、标准对标、文书编排、核验、组卷和跟踪；处理到需要深入核对的材料时，再选择 Agent 协助。',
                          'Use the O-1A workspace for collection, standards mapping, drafting, verification, packaging, and tracking. Select optional assistance later at the relevant work step if needed.',
                        )}
                      </p>
                    </article>
                    <article>
                      <h3>{t('委托律所', 'Work with a law firm')}</h3>
                      <p>
                        {t(
                          '选择后生成律所沟通包和分享链接，再由你联系并确认委托关系。',
                          'Generate the counsel brief and sharing link after selection, then contact and retain the firm yourself.',
                        )}
                      </p>
                    </article>
                  </div>
                  <a href="/prepare">
                    {t(
                      '了解 O-1A 杰出人才申请工作台',
                      'Explore the O-1A application workspace',
                    )}
                  </a>
                </section>
                <section className="lawyer-outline-preview">
                  <p className="founder-eyebrow">
                    {t(
                      '律所沟通包内容预览 · 尚未生成',
                      'Counsel brief preview · not yet created',
                    )}
                  </p>
                  <p>
                    {t(
                      '下面只展示未来资料包的章节结构。保存项目并选择“委托律所”后，系统才会用你的记录生成内容并开放下载与分享。',
                      'This shows only the future brief structure. USCOO generates content and enables download and sharing only after you save a project and choose law firm collaboration.',
                    )}
                  </p>
                  <div className="lawyer-outline">
                    {t(
                      BRIEF_OUTLINE.map(([title, note], i) => (
                        <article key={title}>
                          <span>0{t(i + 1)}</span>
                          <div>
                            <h3>{t(title)}</h3>
                            <p>{t(note)}</p>
                          </div>
                        </article>
                      )),
                    )}
                  </div>
                </section>
              </>
            )
          ),
        )}
        <footer className="founder-footer">
          <a href="/beta">
            <ArrowLeft size={15} />
            {t('回到申请全貌')}
          </a>
          <p>
            {t(
              '正式申请策略、身份路径及法律判断，由具备资质的专业人士结合完整材料复核。',
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}
