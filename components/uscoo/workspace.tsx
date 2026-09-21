'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check as CheckIcon,
  CheckCheck,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  History,
  Link2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  STEPS,
  CRITERIA,
  OFFICIAL,
  getGateState,
  type CaseData,
  type CaseProject,
  type Profile,
  type RecordItem,
} from '@/lib/case-domain';
import { FounderHeader } from './journey-header';
import AgentAssistEntry from './agent-assist-entry';
import CompanyPlan from './company-plan';
import ProjectProgressOverview from './project-progress-overview';
import JourneyReviewDialog from './journey-review-dialog';
import { IntentForm } from './intent-form';
import FeeCalculator from './fee-calculator';
import { useI18n } from './language';
import { Choice, Check, RecordEditor, STATE_LABEL } from './case-editor';
import { createBrowserId } from '@/lib/browser-engagement';
const DOCUMENT_TRACKS = [
  {
    id: 'beneficiary',
    title: ['你的杰出能力证明文书', 'Your extraordinary-ability documents'],
    note: [
      '把杰出经历、个人贡献、八项标准和原始证据组织成可核对的论证材料。',
      'Turn achievements, personal contribution, the eight criteria and source evidence into reviewable support materials.',
    ],
    documents: [
      ['support', '申请支持信', 'Petition support draft'],
      [
        'recommendation',
        '给推荐人的写作要点',
        'Writing points for recommenders',
      ],
      ['translation', '翻译认证工作单', 'Translation worksheet'],
      ['consultation', 'Consultation 判断记录', 'Consultation review'],
    ],
  },
  {
    id: 'petitioner',
    title: ['申请公司与赴美工作文书', 'Company and U.S. work documents'],
    note: [
      '把公司身份、授权、职位、职责、报酬、地点和工作期限整理成一致记录。',
      'Keep entity, authority, role, duties, pay, locations and work period consistent.',
    ],
    documents: [
      ['work', '赴美工作安排', 'Proposed U.S. work'],
      ['i129', 'I-129 字段工作表', 'Form I-129 worksheet'],
      ['ss4', 'SS-4 字段工作表', 'Form SS-4 / EIN worksheet'],
      ['business', '商业计划事实清单', 'Business plan fact checklist'],
    ],
  },
] as const;
const API = '/api/uscoo/projects';
async function request(url: string, options?: RequestInit) {
  const r = await fetch(url, { cache: 'no-store', ...options });
  const b: any = await r.json();
  if (!r.ok) throw new Error(b.error || '操作未完成，请重试。');
  return b;
}
const fmt = (date: string) =>
  date
    ? new Date(date).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
const kindTitle: Record<string, string> = {
  event: '经历',
  evidence: '材料',
  document: '文档',
  gate: '检查',
  task: '任务',
  rule: '规则记录',
  packet: '申请包',
  filing: '案件事件',
};
function Status({ value, stale }: { value: string; stale?: boolean }) {
  const { t, f } = useI18n();
  return (
    <Badge variant="outline" className={`status ${stale ? 'conflict' : value}`}>
      {t(stale ? '事实已变化，待复核' : STATE_LABEL[value] || value)}
    </Badge>
  );
}
function Empty({
  title,
  note,
  action,
  onClick,
}: {
  title: string;
  note: string;
  action?: string;
  onClick?: () => void;
}) {
  const { t, f } = useI18n();
  return (
    <div className="case-empty">
      <FolderOpen size={30} />
      <h3>{t(title)}</h3>
      <p>{t(note)}</p>
      {t(
        action && (
          <Button variant="outline" onClick={onClick}>
            <Plus size={16} />
            {t(action)}
          </Button>
        ),
      )}
    </div>
  );
}
export default function Workspace({
  userName,
  signedIn = true,
  initialProjectId,
}: {
  userName: string;
  signedIn?: boolean;
  initialProjectId?: string;
}) {
  const { t, f } = useI18n();
  const [projects, setProjects] = useState<CaseProject[]>([]),
    [data, setData] = useState<CaseData | null>(null),
    [caps, setCaps] = useState({ storage: false, model: false, ocr: false }),
    [loading, setLoading] = useState(signedIn),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [step, setStep] = useState('path'),
    [title, setTitle] = useState('我的 O-1A 杰出人才申请'),
    [createOpen, setCreateOpen] = useState(false),
    [editor, setEditor] = useState<{
      kind: string;
      id?: string;
      body: any;
    } | null>(null),
    [journeyReview, setJourneyReview] = useState(false),
    [settings, setSettings] = useState(false),
    [history, setHistory] = useState<any[] | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [deleteText, setDeleteText] = useState('');
  const [profile, setProfile] = useState<Profile>({}),
    [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [shareUrl, setShareUrl] = useState(''),
    [replaceId, setReplaceId] = useState(''),
    [track, setTrack] = useState('company');
  const fileRef = useRef<HTMLInputElement>(null),
    createKey = useRef('');
  const project = data?.project,
    records = data?.records || [],
    evidence = records.filter((x) => x.kind === 'evidence'),
    events = records.filter((x) => x.kind === 'event'),
    rawTasks = records.filter((x) => x.kind === 'task'),
    hasCompanyPlanTasks = rawTasks.some(
      (record) => record.body.track === 'company' && record.body.planKey,
    ),
    tasks = rawTasks.filter(
      (record) =>
        record.body.track !== 'company' ||
        !hasCompanyPlanTasks ||
        Boolean(record.body.planKey),
    ),
    documents = records.filter((x) => x.kind === 'document'),
    packets = records.filter((x) => x.kind === 'packet'),
    gates = getGateState(records);
  async function refresh(id?: string) {
    const result = await request(API);
    setProjects(result.projects);
    setCaps(result.capabilities);
    const target =
      id ||
      project?.id ||
      new URLSearchParams(window.location.search).get('project') ||
      result.projects[0]?.id;
    if (target && result.projects.some((p: CaseProject) => p.id === target)) {
      const c = await request(`${API}/${target}`);
      setData(c);
      setProfile(c.project.profile);
      return c as CaseData;
    }
    setData(null);
    return null;
  }
  useEffect(() => {
    if (!signedIn) return;
    const q = new URLSearchParams(window.location.search),
      s = q.get('step');
    if (STEPS.some((x) => x[0] === s)) setStep(s!);
    const syncStep = () => {
      const next = new URLSearchParams(window.location.search).get('step');
      setStep(STEPS.some((x) => x[0] === next) ? next! : 'path');
    };
    window.addEventListener('popstate', syncStep);
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => window.removeEventListener('popstate', syncStep);
  }, []);
  function navigate(s: string) {
    setStep(s);
    setFilter('all');
    const q = new URLSearchParams();
    q.set('step', s);
    if (project) q.set('project', project.id);
    window.history.pushState(null, '', `/prepare?${q}`);
    setNotice('');
  }
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作未完成。');
    } finally {
      setBusy(false);
    }
  }
  const post = async (op: string, body: any) =>
    request(`${API}/${project!.id}/${op}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: project!.revision, ...body }),
    });
  const openEditor = (r: RecordItem) => {
    setError('');
    setEditor({ kind: r.kind, id: r.id, body: r.body });
  };
  const add = (kind: string, body: any = {}) => {
    setError('');
    setEditor({ kind, body });
  };
  async function create() {
    await run(async () => {
      createKey.current ||= createBrowserId();
      const r = await request(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, requestId: createKey.current }),
      });
      await refresh(r.project.id);
      setCreateOpen(false);
      createKey.current = '';
      navigate('profile');
      setNotice('项目已建立。公司和个人材料可以并行准备。');
    });
  }
  function createDraft(type: string) {
    run(async () => {
      const result = await post('draft', { type });
      const current = await refresh();
      const document = current!.records.find(
        (record) => record.id === result.id,
      );
      if (!document) throw new Error('准备稿已生成，请刷新后打开。');
      openEditor(document);
    });
  }
  async function saveRecord(body: any) {
    await run(async () => {
      await post('records', { kind: editor!.kind, id: editor!.id, body });
      await refresh();
      setEditor(null);
      setNotice('已保存。相关材料和检查状态已更新。');
    });
  }
  async function loadHistory(id: string) {
    try {
      const r = await request(`${API}/${project!.id}/records/${id}/history`);
      setHistory(r.versions);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function extract(file: File) {
    if (file.name.toLowerCase().endsWith('.txt'))
      return (await file.text()).slice(0, 58000);
    if (file.name.toLowerCase().endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      return result.value.slice(0, 58000);
    }
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      }).promise;
      let text = '';
      try {
        for (let n = 1; n <= Math.min(doc.numPages, 60); n++) {
          const page = await doc.getPage(n),
            content = await page.getTextContent();
          text +=
            `\n[第 ${n} 页]\n` +
            content.items.map((x: any) => x.str || '').join(' ') +
            '\n';
          if (text.length > 58000) break;
        }
      } finally {
        await doc.cleanup();
      }
      return text.slice(0, 58000);
    }
    return '';
  }
  async function upload(file: File) {
    await run(async () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('revision', String(project!.revision));
      if (replaceId) fd.append('replaces', replaceId);
      const r = await request(`${API}/${project!.id}/upload`, {
        method: 'POST',
        body: fd,
      });
      const c = await refresh();
      const item = c!.records.find((x) => x.id === r.recordId)!;
      let text = '';
      try {
        text = await extract(file);
      } catch {
        setNotice('原件已保存，自动提取未完成。请对照原件填写摘录。');
      }
      setEditor({
        kind: 'evidence',
        id: item.id,
        body: {
          ...item.body,
          excerpt: text,
          extraction:
            text.replace(/\[第 \d+ 页\]/g, '').trim().length > 30
              ? 'text'
              : 'scan',
        },
      });
      setReplaceId('');
    });
    if (fileRef.current) fileRef.current.value = '';
  }
  const selectProject = (id: string) => {
    if (id === 'new') {
      setCreateOpen(true);
      return;
    }
    run(async () => {
      await refresh(id);
      window.history.replaceState(
        null,
        '',
        `/prepare?project=${id}&step=${step}`,
      );
    });
  };
  const nextAction = !profile.name
    ? ['profile', '先补上申请档案']
    : !events.length
      ? ['story', '记录一件杰出经历']
      : !evidence.length
        ? ['prepare', '上传第一份原始材料']
        : evidence.some((x) => x.body.status === 'lead')
          ? ['evidence', '核对材料摘录与个人贡献']
          : !documents.length
            ? ['draft', '组装一份准备稿']
            : ['filing', '查看递交前还有哪些待办'];
  const active = STEPS.find((x) => x[0] === step) || STEPS[0];
  return (
    <div className="founder-app unified-workspace">
      <FounderHeader workspace projectId={project?.id || initialProjectId} />
      <div className="uscoo-workspace">
        <nav
          className="review-sections"
          aria-label={t('申请工作台分区', 'Application workspace sections')}
        >
          {t(
            STEPS.map(([id, name]) => (
              <button
                key={id}
                aria-current={step === id ? 'page' : undefined}
                onClick={() => navigate(id)}
              >
                {t(name)}
              </button>
            )),
          )}
          <button
            className="review-journey-button"
            aria-haspopup="dialog"
            onClick={() => setJourneyReview(true)}
          >
            <BookOpen size={15} />
            {t('回看前期路径', 'Review guided steps')}
          </button>
          <button onClick={() => setSettings(true)}>
            <Settings2 size={15} />
            {t('设置', 'Settings')}
          </button>
        </nav>
        <main className="workspace-main founder-main" id="founder-main">
          {step === 'path' ? (
            <section className="pre-review-intro">
              <p className="founder-eyebrow">
                {t('我的 O-1A 申请', 'My O-1A application')}
              </p>
              <h1>
                {t('O-1A 杰出人才申请工作台', 'O-1A application workspace')}
              </h1>
              <p>
                {t(
                  '你的两条准备线都在这里：公司这边要确认谁为你申请、你去做什么；你这边要讲清做过什么、有什么能证明。',
                  'Both sides are here: the company side establishes who files and what work you will do; your side establishes what you accomplished and what can prove it.',
                )}
              </p>
            </section>
          ) : (
            <div className="workspace-context-row">
              <strong>
                {project?.title || t('我的 O-1A 申请', 'My O-1A application')}
              </strong>
              <span>·</span>
              <span>{t(active[1])}</span>
              {profile.desiredApproval && (
                <span>
                  · {t('希望获批', 'Target approval')} {profile.desiredApproval}
                </span>
              )}
              {project && (
                <small>
                  {t('保存于', 'Saved')} {fmt(project.updated)}
                </small>
              )}
            </div>
          )}
          <div className="workspace-wayfinding">
            <button type="button" onClick={() => setJourneyReview(true)}>
              <BookOpen size={15} />
              {t('回看“先看懂”到“还差什么”', 'Review the guided steps')}
            </button>
            <span>
              {t('工作台：正式准备与跟踪', 'Workspace: preparation & tracking')}
            </span>
            {t(
              project && (
                <a href={`/lawyer?project=${project.id}`}>
                  <FileText size={15} />
                  {t(
                    '申请方式与律师沟通包',
                    'Application method & counsel brief',
                  )}
                  <ArrowUpRight size={13} />
                </a>
              ),
            )}
          </div>
          <div className="project-strip">
            <div className="project-select">
              <FolderOpen size={18} />
              {t(
                projects.length ? (
                  <Choice
                    label={t('切换申请项目')}
                    value={project?.id || projects[0].id}
                    options={[
                      ...projects.map((p) => [p.id, p.title] as const),
                      ['new', '＋ 新建申请项目'],
                    ]}
                    onChange={selectProject}
                  />
                ) : (
                  <span>{t('尚未建立项目')}</span>
                ),
              )}
            </div>
            <div className="save-state">
              {t(
                busy
                  ? '正在处理…'
                  : project
                    ? f('保存于 {0}', fmt(project.updated))
                    : '资料仅保存在你的私有项目中',
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('刷新项目')}
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await refresh();
                  })
                }
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          {t(
            project &&
              records.some((r) => r.kind === 'intake') &&
              ['profile', 'story'].includes(step) && (
                <section className="workspace-intake">
                  <h3>{t('刚才的经历梳理已经保存，不用重新开始。')}</h3>
                  <p>
                    {t('你提到的方向：')}
                    {t(
                      CRITERIA.filter(
                        (k) =>
                          records.find((r) => r.kind === 'intake')?.body
                            .answers?.[k.id] === 'yes',
                      )
                        .map((k) => k.title)
                        .join('、') || '还在了解中',
                    )}
                    {t('。这些是待核实线索。')}
                  </p>
                  <p>
                    {t(
                      step === 'profile'
                        ? '现在再补充与你的申请有关的信息。暂时不知道的内容可以留空；先说明领域、赴美工作和公司现状即可。'
                        : '选一件可能体现杰出能力的经历，说清你做了什么、结果怎样。原件可以在材料页继续补。',
                    )}
                  </p>
                  {t(
                    records.some((r) => r.kind === 'evidence') && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('evidence')}
                      >
                        {t('查看已保存的经历文字')}
                        <ArrowRight size={14} />
                      </Button>
                    ),
                  )}
                </section>
              ),
          )}
          {t(
            error && !editor && (
              <div role="alert" className="notice error">
                <strong>{t('这次操作未完成')}</strong>
                <span>{t(error)}</span>
                {t(
                  error.includes('登录') && (
                    <a
                      href="/signin-with-chatgpt?return_to=%2Fbeta"
                      target="_top"
                    >
                      {t('重新登录')}
                    </a>
                  ),
                )}
              </div>
            ),
          )}
          {t(
            notice && (
              <div role="status" className="notice success">
                <CheckIcon size={17} />
                {t(notice)}
              </div>
            ),
          )}
          {t(
            loading ? (
              <div className="case-empty" role="status">
                {t('正在读取你的申请项目\u2026')}
              </div>
            ) : !project ? (
              <div className="onboarding">
                <div className="eyebrow">{t('开始一份真实的申请项目')}</div>
                <h1>
                  {t('先把你已经做过的事，')}
                  <br />
                  {t('放到一起。')}
                </h1>
                <p>
                  {t(
                    '从经历开始，找到支持它的材料。公司准备、个人证据、文档和后续事项，放在同一份工作记录里。',
                  )}
                </p>
                {!signedIn && (
                  <p>
                    <a
                      className="founder-button"
                      href="/signin-with-chatgpt?return_to=%2Fprepare"
                      target="_top"
                    >
                      {t(
                        '登录后打开我的申请工作台',
                        'Sign in to open my application workspace',
                      )}
                    </a>
                  </p>
                )}
                {signedIn && (
                  <div className="create-inline">
                    <label className="field">
                      <span>{t('项目名称')}</span>
                      <Input
                        value={title}
                        maxLength={120}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </label>
                    <Button disabled={busy || !title.trim()} onClick={create}>
                      {t('建立申请项目')}
                      <ArrowRight size={17} />
                    </Button>
                  </div>
                )}
                <div className="onboarding-rails">
                  <span>
                    <Building2 />
                    {t('准备美国申请主体')}
                  </span>
                  <span>
                    <FileText />
                    {t('整理个人成就证据')}
                  </span>
                </div>
                <p className="fine-print">
                  {t(
                    '你可以自己准备，也可以随时导出给律师复核。先不用填写护照号、SSN 或银行信息。',
                  )}
                </p>
              </div>
            ) : (
              <>
                <div className="page-heading">
                  <div>
                    <h1>{t(active[1])}</h1>
                    <p>{t(active[2])}。</p>
                  </div>
                  {t(
                    [
                      'story',
                      'evidence',
                      'prepare',
                      'draft',
                      'filing',
                    ].includes(step) && (
                      <a
                        className="outline-link"
                        href={`${API}/${project.id}/export`}
                      >
                        <Download size={16} />
                        {t('导出准备包')}
                      </a>
                    ),
                  )}
                </div>
                {t(
                  step === 'path' && (
                    <>
                      <section className="workspace-mode">
                        <h2>
                          {profile.preparationMode === 'counsel'
                            ? t('律师协作模式', 'Counsel collaboration')
                            : profile.preparationMode === 'diy'
                              ? t('自主申请模式', 'Self-filing')
                              : t(
                                  '选择你的正式准备方式',
                                  'Choose your preparation approach',
                                )}
                        </h2>
                        <p>
                          {profile.preparationMode === 'counsel'
                            ? t(
                                '用这里保留材料备份、版本、律师反馈与进度。分享沟通包并与律师确认分工；律师不会自动收到你的修改。',
                                'Keep document copies, versions, counsel feedback and progress here. Share the brief and agree responsibilities with counsel; your edits are not sent automatically.',
                              )
                            : t(
                                '把材料、证据来源、公司待办、文书版本和递交节点放在同一份项目里；事实、内容确认和签署始终由你完成。',
                                'Keep evidence, sources, company tasks, document versions, and filing milestones in one project. You remain responsible for the facts, approvals, and signatures.',
                              )}
                        </p>
                        <a
                          href={`/lawyer?project=${project!.id}#preparation-options`}
                        >
                          {t(
                            '选择或切换申请方式',
                            'Choose or change the application method',
                          )}
                        </a>
                      </section>
                      <button
                        className="next-action"
                        onClick={() => navigate(nextAction[0])}
                      >
                        <span className="next-icon">
                          <ArrowRight size={22} />
                        </span>
                        <span>
                          <small>
                            {t('现在最值得做的一步', 'Best next step')}
                          </small>
                          <strong>{t(nextAction[1])}</strong>
                        </span>
                        <ArrowUpRight size={21} />
                      </button>
                      <ProjectProgressOverview
                        data={data}
                        onNavigate={navigate}
                      />
                      <div className="duo">
                        <section className="surface rail-card">
                          <div className="section-kicker">
                            <Building2 size={20} />
                            {t('公司准备线', 'Company preparation track')}
                          </div>
                          <h2>{t('谁提出申请，你将做什么工作。')}</h2>
                          <p>
                            {t(
                              '已有公司就核对实体与授权；尚无公司就准备成立事项。工作职责、日期和报酬在后续材料中共用。',
                            )}
                          </p>
                          <button
                            className="text-link"
                            onClick={() => navigate('profile')}
                          >
                            {t('填写公司与工作安排')}
                            <ArrowRight size={15} />
                          </button>
                        </section>
                        <section className="surface rail-card">
                          <div className="section-kicker">
                            <FileText size={20} />
                            {t('个人杰出证明线', 'Personal evidence track')}
                          </div>
                          <h2>{t('发生过什么，有什么能够证明。')}</h2>
                          <p>
                            {t(
                              '先讲经历，再分清个人与团队的贡献。材料按八项标准逐一核查，最后还需审查全部记录。',
                            )}
                          </p>
                          <button
                            className="text-link"
                            onClick={() => navigate('story')}
                          >
                            {t('从一件事开始')}
                            <ArrowRight size={15} />
                          </button>
                        </section>
                      </div>
                      <section className="surface pathway">
                        <h2>{t('走完一轮，也允许回头修改。')}</h2>
                        <div className="journey-list">
                          {t(
                            STEPS.slice(1).map(([id, name, note], i) => (
                              <button key={id} onClick={() => navigate(id)}>
                                <b>{t(String(i + 2).padStart(2, '0'))}</b>
                                <span>
                                  <strong>{t(name)}</strong>
                                  <small>{t(note)}</small>
                                </span>
                                <ChevronRight size={16} />
                              </button>
                            )),
                          )}
                        </div>
                      </section>
                      <div className="source-note">
                        <BookOpen size={18} />
                        <p>
                          {t(
                            'O-1A 由合适的申请主体提出；受益人拥有的独立法人可以作为申请人。证据门槛与整体审查分别处理，不能用\u201C满足三项\u201D推导批准。',
                          )}
                          <a
                            href={OFFICIAL[0][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('申请主体')}
                          </a>
                          {t(' ')}·{t(' ')}
                          <a
                            href={OFFICIAL[1][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('官方标准')}
                          </a>
                        </p>
                      </div>
                    </>
                  ),
                )}
                {t(
                  step === 'profile' && (
                    <>
                      <IntentForm
                        value={{
                          desiredApproval: profile.desiredApproval || '',
                          arrivalDate: profile.arrivalDate || '',
                          workStartDate: profile.start || '',
                          location: ['US', 'CN', 'other'].includes(
                            profile.location || '',
                          )
                            ? profile.location!
                            : 'unknown',
                          workPlan: profile.duties || '',
                        }}
                        onChange={(v) =>
                          setProfile((p) => ({
                            ...p,
                            desiredApproval: v.desiredApproval,
                            arrivalDate: v.arrivalDate,
                            start: v.workStartDate,
                            location: v.location,
                            duties: v.workPlan,
                          }))
                        }
                      />
                      <CompanyPlan
                        profile={profile}
                        tasks={tasks}
                        busy={busy}
                        onChange={setProfile}
                        onGenerate={() =>
                          run(async () => {
                            const result = await post('company-plan', {
                              goal: profile.companyGoal || 'undecided',
                              entityType: profile.entityType,
                              formationState: profile.formationState,
                              formationStatus: profile.formationStatus,
                            });
                            await refresh();
                            setNotice(
                              result.added
                                ? `已补齐 ${result.added} 项公司准备任务。`
                                : '公司准备目标与计划已保存。',
                            );
                          })
                        }
                        onOpenTask={openEditor}
                        onOpenTasks={() => {
                          setTrack('company');
                          navigate('prepare');
                        }}
                      />
                      <section className="surface">
                        <div className="section-heading">
                          <h2>{t('这次申请的基本安排')}</h2>
                          <span>{t('未知信息可先留空')}</span>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            run(async () => {
                              await post('profile', { profile });
                              await refresh();
                              setNotice(
                                '档案已保存。已生成文档将按新事实重新核对。',
                              );
                            });
                          }}
                        >
                          <div className="form-grid">
                            {t(
                              (
                                [
                                  ['name', '你的姓名'],
                                  ['company', '申请公司或代理人名称'],
                                  ['companyState', '公司现状 / 实体类型 / 州'],
                                  ['field', '专业领域'],
                                  ['location', '目前所在国家或地区'],
                                  ['target', '计划递交日期'],
                                ] as const
                              ).map(([key, label]) => (
                                <label className="field" key={key}>
                                  <span>{t(label)}</span>
                                  <Input
                                    value={profile[key] || ''}
                                    type="text"
                                    onChange={(e) =>
                                      setProfile({
                                        ...profile,
                                        [key]: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                              )),
                            )}
                            <label className="field">
                              <span>{t('准备采用的身份路径')}</span>
                              <Choice
                                value={profile.route || 'unknown'}
                                options={[
                                  ['unknown', '尚待判断'],
                                  ['consular', '境外领馆签证'],
                                  ['change', '境内变更身份（需核查）'],
                                  ['extension', '境内延期（需核查）'],
                                ]}
                                onChange={(v) =>
                                  setProfile({ ...profile, route: v })
                                }
                              />
                            </label>
                            <label className="field">
                              <span>{t('当前身份类别（如适用）')}</span>
                              <Input
                                value={profile.status || ''}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    status: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="field">
                              <span>{t('身份截止日（核对原件后填写）')}</span>
                              <Input
                                type="date"
                                value={profile.statusUntil || ''}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    statusUntil: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <div className="form-divider">
                            <h3>{t('同一份工作安排，贯穿全部材料')}</h3>
                            <p>
                              {t(
                                '这些内容会带到后面的公司材料、文书和递交检查。修改时，系统会提醒你重新查看受影响的材料。',
                                'These details carry into company records, drafts, and filing checks. If you change one, the system will flag affected materials for another look.',
                              )}
                            </p>
                          </div>
                          <div className="form-grid">
                            {t(
                              (
                                [
                                  ['role', '拟任职位'],
                                  ['workplace', '工作地点'],
                                  ['start', '工作开始日期'],
                                  ['end', '工作结束日期'],
                                  ['pay', '报酬与计算口径'],
                                ] as const
                              ).map(([key, label]) => (
                                <label className="field" key={key}>
                                  <span>{t(label)}</span>
                                  <Input
                                    type={
                                      ['start', 'end'].includes(key)
                                        ? 'date'
                                        : 'text'
                                    }
                                    value={profile[key] || ''}
                                    onChange={(e) =>
                                      setProfile({
                                        ...profile,
                                        [key]: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                              )),
                            )}
                          </div>
                          <label className="field">
                            <span>{t('你计划实际做哪些工作？')}</span>
                            <Textarea
                              value={profile.duties || ''}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  duties: e.target.value,
                                })
                              }
                              rows={4}
                            />
                          </label>
                          <Check
                            checked={!!profile.premium}
                            onChange={(v) =>
                              setProfile({ ...profile, premium: v })
                            }
                          >
                            {t('计划选择加急处理（费用另列，不保证批准）')}
                          </Check>
                          <Button type="submit" disabled={busy}>
                            {t('保存档案')}
                            <CheckIcon size={16} />
                          </Button>
                        </form>
                      </section>
                    </>
                  ),
                )}
                {t(
                  step === 'story' && (
                    <>
                      <section className="story-prompt">
                        <div>
                          <p className="eyebrow">{t('先回忆，不急着找文件')}</p>
                          <h2>{t('哪件事，最能代表你的专业能力？')}</h2>
                          <p>
                            {t(
                              '可以是做成的一款产品、一次业务改变，或一项评审工作。先记下你亲自做的部分。',
                            )}
                          </p>
                        </div>
                        <Button onClick={() => add('event')}>
                          {t('记录这件事')}
                          <Plus size={16} />
                        </Button>
                      </section>
                      {t(
                        events.length ? (
                          <div className="event-timeline">
                            {t(
                              events.map((r, i) => (
                                <article className="event-item" key={r.id}>
                                  <div className="event-mark">
                                    {t(String(i + 1).padStart(2, '0'))}
                                  </div>
                                  <section className="surface">
                                    <div className="section-heading">
                                      <div>
                                        <small>
                                          {t(r.body.date || '时间待补充')}
                                        </small>
                                        <h3>{t(r.body.title)}</h3>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        onClick={() => openEditor(r)}
                                      >
                                        {t('继续补充')}
                                        <ChevronRight size={16} />
                                      </Button>
                                    </div>
                                    <p>
                                      {t(
                                        r.body.action ||
                                          '还没有记录你的具体行动。',
                                      )}
                                    </p>
                                    <div className="event-facts">
                                      <span>
                                        {t('角色：')}
                                        {t(r.body.role || '待补充')}
                                      </span>
                                      <span>
                                        {t('来源：')}
                                        {t(r.body.sourceIds?.length || 0)}
                                        {t('份')}
                                      </span>
                                      <span>
                                        {t(
                                          r.body.hypothesis
                                            ? '推测，不进入正式材料'
                                            : r.body.confirmed
                                              ? '本人已核对经历'
                                              : '口述线索',
                                        )}
                                      </span>
                                    </div>
                                    {t(
                                      r.body.team && (
                                        <p className="muted">
                                          {t('团队贡献：')}
                                          {t(r.body.team)}
                                        </p>
                                      ),
                                    )}
                                  </section>
                                </article>
                              )),
                            )}
                          </div>
                        ) : (
                          <Empty
                            title={t('还没有记录经历')}
                            note={t(
                              '不必一次讲完履历。一件具体的事，就足以开始。',
                            )}
                          />
                        ),
                      )}
                      <button
                        className="subtle-next"
                        onClick={() => navigate('evidence')}
                      >
                        {t('看看这些经历可能需要哪些材料')}
                        <ArrowRight size={17} />
                      </button>
                    </>
                  ),
                )}
                {t(
                  step === 'evidence' && (
                    <>
                      <div className="evidence-summary">
                        <div>
                          <strong>{t(evidence.length)}</strong>
                          <span>{t('份材料')}</span>
                        </div>
                        <div>
                          <strong>
                            {t(
                              evidence.filter(
                                (x) => x.body.status === 'reviewed',
                              ).length,
                            )}
                          </strong>
                          <span>{t('份摘录已核对')}</span>
                        </div>
                        <div>
                          <strong>
                            {t(
                              evidence.filter(
                                (x) => x.body.status === 'conflict',
                              ).length,
                            )}
                          </strong>
                          <span>{t('处材料冲突')}</span>
                        </div>
                        <p>
                          {t('数量反映整理进度，')}
                          <br />
                          {t('不代表资格或批准概率。')}
                        </p>
                      </div>
                      <div className="criterion-grid">
                        {t(
                          CRITERIA.map((k, i) => {
                            const related = evidence.filter((e) =>
                              e.body.criteria?.includes(k.id),
                            );
                            return (
                              <button
                                key={k.id}
                                className={`criterion ${filter === k.id ? 'selected' : ''}`}
                                onClick={() =>
                                  setFilter(filter === k.id ? 'all' : k.id)
                                }
                              >
                                <div>
                                  <small>
                                    {t(String(i + 1).padStart(2, '0'))}
                                  </small>
                                  <span>
                                    {t(related.length)}
                                    {t('份相关材料')}
                                  </span>
                                </div>
                                <h3>{t(k.title)}</h3>
                                <p>{t(k.check)}</p>
                              </button>
                            );
                          }),
                        )}
                      </div>
                      {t(
                        filter !== 'all' && (
                          <section className="criterion-note">
                            <h3>
                              {t(
                                CRITERIA.find((x) => x.id === filter)?.question,
                              )}
                            </h3>
                            <p>
                              {t(
                                CRITERIA.find((x) => x.id === filter)?.caution,
                              )}
                            </p>
                            <button
                              className="text-link"
                              onClick={() => setFilter('all')}
                            >
                              {t('查看全部材料')}
                            </button>
                          </section>
                        ),
                      )}
                      {t(evidenceTable())}
                      {profile.preparationMode === 'diy' && (
                        <AgentAssistEntry stage="evidence" />
                      )}
                      <div className="source-note">
                        <ShieldCheck size={18} />
                        <p>
                          {t(
                            '逐项分析之后，仍需结合全部记录审查持续认可、领域地位和赴美工作。',
                          )}
                          <a
                            href={OFFICIAL[1][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('阅读 USCIS 官方规则 \u2197')}
                          </a>
                        </p>
                      </div>
                    </>
                  ),
                )}
                {t(
                  step === 'prepare' && (
                    <>
                      <section className="upload-surface">
                        <Upload size={24} />
                        <div>
                          <h2>{t('把原件放进项目')}</h2>
                          <p>
                            {t(
                              'PDF、DOCX、PNG、JPG、TXT · 单份 50 MB · 项目合计 2 GB',
                              'PDF, DOCX, PNG, JPG, TXT · 50 MB per file · 2 GB per project',
                            )}
                          </p>
                        </div>
                        <Button
                          disabled={busy}
                          onClick={() => {
                            setReplaceId('');
                            fileRef.current?.click();
                          }}
                        >
                          {t('选择文件')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => add('evidence')}
                        >
                          {t('记录网页 / 摘录')}
                        </Button>
                      </section>
                      <Tabs
                        value={track}
                        onValueChange={(v) => setTrack(String(v))}
                      >
                        <div className="section-heading">
                          <TabsList>
                            <TabsTrigger value="company">
                              {t('公司准备')}
                            </TabsTrigger>
                            <TabsTrigger value="evidence">
                              {t('个人材料')}
                            </TabsTrigger>
                          </TabsList>
                          <Button
                            variant="outline"
                            onClick={() => add('task', { track })}
                          >
                            <Plus size={16} />
                            {t('添加任务')}
                          </Button>
                        </div>
                        {t(
                          ['company', 'evidence'].map((trackKey) => (
                            <TabsContent key={trackKey} value={trackKey}>
                              <section className="surface task-list">
                                {t(
                                  tasks
                                    .filter((r) => r.body.track === trackKey)
                                    .map((r) => (
                                      <button
                                        className="task-row"
                                        key={r.id}
                                        onClick={() => openEditor(r)}
                                      >
                                        <span
                                          className={`task-check ${r.body.state === 'done' ? 'done' : ''}`}
                                        >
                                          {t(
                                            r.body.state === 'done' ? (
                                              <CheckIcon size={16} />
                                            ) : r.body.state === 'waiting' ? (
                                              <Clock3 size={16} />
                                            ) : null,
                                          )}
                                        </span>
                                        <span className="task-copy">
                                          <strong>{t(r.body.title)}</strong>
                                          <small>{t(r.body.notes)}</small>
                                          {(r.body.owner &&
                                            r.body.owner !== '本人') ||
                                          r.body.due ||
                                          r.body.cost ? (
                                            <span>
                                              {r.body.owner &&
                                              r.body.owner !== '本人'
                                                ? t(r.body.owner)
                                                : null}
                                              {t(
                                                r.body.due
                                                  ? `${r.body.owner && r.body.owner !== '本人' ? ' · ' : ''}${r.body.due}`
                                                  : '',
                                              )}
                                              {t(
                                                r.body.cost
                                                  ? `${(r.body.owner && r.body.owner !== '本人') || r.body.due ? ' · ' : ''}${r.body.cost}`
                                                  : '',
                                              )}
                                            </span>
                                          ) : null}
                                        </span>
                                        <Status value={r.body.state} />
                                        <ChevronRight size={17} />
                                      </button>
                                    )),
                                )}
                              </section>
                            </TabsContent>
                          )),
                        )}
                      </Tabs>
                      <div className="section-heading separated">
                        <h2>{t('项目原件与来源')}</h2>
                        <span>
                          {t(
                            '材料有更新时，系统会提示受影响的内容',
                            'When a source changes, the system flags affected work',
                          )}
                        </span>
                      </div>
                      {t(evidenceTable())}
                      <FeeCalculator />
                    </>
                  ),
                )}
                {t(
                  step === 'draft' && (
                    <>
                      <section className="surface">
                        <div className="section-heading">
                          <h2>{t('从已确认的事实组装材料')}</h2>
                          <FileText size={20} />
                        </div>
                        <p className="muted">
                          {t(
                            '先用已经确认的事实生成可编辑草稿；如果某个说法还没有材料支持，系统会在旁边提醒。你确认事实与出处后，再进入专业复核和定稿。',
                            'Build editable drafts from confirmed facts first. If a statement still lacks support, the system flags it beside the text. Confirm facts and sources before professional review and finalization.',
                          )}
                        </p>
                        <div className="document-track-grid">
                          {DOCUMENT_TRACKS.map((documentTrack) => (
                            <article key={documentTrack.id}>
                              <div className="document-track-heading">
                                {documentTrack.id === 'petitioner' ? (
                                  <Building2 size={20} />
                                ) : (
                                  <FileText size={20} />
                                )}
                                <div>
                                  <h3>
                                    {t(
                                      documentTrack.title[0],
                                      documentTrack.title[1],
                                    )}
                                  </h3>
                                  <p>
                                    {t(
                                      documentTrack.note[0],
                                      documentTrack.note[1],
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="document-template-actions">
                                {documentTrack.documents.map(
                                  ([type, zh, en]) => (
                                    <Button
                                      key={type}
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() => createDraft(type)}
                                    >
                                      {t(zh, en)}
                                      <ArrowRight size={14} />
                                    </Button>
                                  ),
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                        <div className="shared-document-actions">
                          <div>
                            <strong>
                              {t(
                                '跨双线与协作文书',
                                'Cross-track and collaboration documents',
                              )}
                            </strong>
                            <span>
                              {t(
                                '汇总全案或处理递交后的补件事项。',
                                'Summarize the full case or prepare post-filing response work.',
                              )}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => createDraft('lawyer')}
                          >
                            {t('律所沟通准备包', 'Counsel preparation brief')}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => createDraft('rfe')}
                          >
                            {t('RFE / NOID 响应清单')}
                          </Button>
                        </div>
                        {t(
                          documents.length ? (
                            <div className="document-list">
                              {t(
                                documents.map((r) => (
                                  <article key={r.id} className="document-row">
                                    <FileText />
                                    <div>
                                      <h3>{t(r.body.title)}</h3>
                                      <p>
                                        {t('修订')}
                                        {t(r.version)} ·{t(' ')}
                                        {t(r.body.sourceIds?.length || 0)}
                                        {t('份来源 \u00B7')}
                                        {t(' ')}
                                        {t(fmt(r.updated))}
                                      </p>
                                      <Status
                                        value={r.body.state}
                                        stale={r.body.stale}
                                      />
                                    </div>
                                    <div className="document-actions">
                                      <Button
                                        variant="outline"
                                        onClick={() => openEditor(r)}
                                      >
                                        {t('打开并核对')}
                                      </Button>
                                      <a
                                        href={`${API}/${project.id}/documents/${r.id}`}
                                      >
                                        DOCX ↓
                                      </a>
                                      <a
                                        href={`${API}/${project.id}/documents/${r.id}?print=1`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {t('打印 / PDF \u2197')}
                                      </a>
                                    </div>
                                  </article>
                                )),
                              )}
                            </div>
                          ) : (
                            <Empty
                              title={t('还没有申请稿')}
                              note={t(
                                '先从个人证明或申请公司任一侧生成准备稿；系统会保留来源与待补事项。',
                                'Start with a beneficiary or petitioner draft. USCOO retains its sources and missing items.',
                              )}
                            />
                          ),
                        )}
                      </section>
                      {profile.preparationMode === 'diy' && (
                        <AgentAssistEntry stage="draft" />
                      )}
                      <div className="source-note">
                        <FileText size={18} />
                        <p>
                          {t(
                            'I-129 与 SS-4 当前输出字段工作表，正式表格需逐页回填核对。',
                          )}
                          <a
                            href={OFFICIAL[2][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('打开 USCIS I-129 官方页面')}
                          </a>
                          {t(' ')}·{t(' ')}
                          <a
                            href={OFFICIAL[2][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('核对当日适用版本')}
                          </a>
                        </p>
                      </div>
                    </>
                  ),
                )}
                {t(
                  step === 'filing' && (
                    <>
                      <section className="surface">
                        <div className="section-heading">
                          <div>
                            <h2>{t('递交前的七项检查')}</h2>
                            <p className="muted">
                              {t(
                                '按实际材料逐项确认。跨日、改稿或规则变化后需要重审。',
                              )}
                            </p>
                          </div>
                          <span className="count-label">
                            {t(gates.filter((x) => x.ok).length)}
                            {t('/ 7 已完成今日核验')}
                          </span>
                        </div>
                        <div className="gate-list">
                          {t(
                            gates.map((g, i) => (
                              <button
                                key={g.id}
                                onClick={() =>
                                  g.record
                                    ? openEditor(g.record)
                                    : add('gate', {
                                        gate: g.id,
                                        reviewedOn: new Date()
                                          .toISOString()
                                          .slice(0, 10),
                                        confirmed: false,
                                        note: '',
                                      })
                                }
                              >
                                <span
                                  className={`gate-mark ${g.ok ? 'done' : ''}`}
                                >
                                  {t(g.ok ? <CheckIcon size={17} /> : i + 1)}
                                </span>
                                <div>
                                  <h3>{t(g.title)}</h3>
                                  <p>{t(g.help)}</p>
                                </div>
                                <Status value={g.ok ? 'reviewed' : 'lead'} />
                                <ChevronRight size={17} />
                              </button>
                            )),
                          )}
                        </div>
                        <div className="freeze-bar">
                          <p>
                            {t('冻结保留当前稿件、来源及核验快照。')}
                            <br />
                            {t('它不代表已打印、已寄出或已受理。')}
                          </p>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await post('freeze', { confirmed: true });
                                await refresh();
                                setNotice(
                                  '申请包已冻结。请与实际签署、组包和交接凭证对应。',
                                );
                              })
                            }
                          >
                            <LockKeyhole size={16} />
                            {t('核对后冻结申请包')}
                          </Button>
                        </div>
                        {t(
                          packets.map((r) => (
                            <div className="packet-row" key={r.id}>
                              <div>
                                <h3>{t(r.body.title)}</h3>
                                <p>
                                  {t(fmt(r.created))}
                                  {t('\u00B7 历史快照不可覆盖')}
                                </p>
                              </div>
                              <a
                                className="outline-link"
                                href={`${API}/${project.id}/packets/${r.id}`}
                              >
                                <Download size={16} />
                                {t('下载冻结包')}
                              </a>
                            </div>
                          )),
                        )}
                      </section>
                      {profile.preparationMode === 'diy' && (
                        <AgentAssistEntry stage="filing" />
                      )}
                      <section className="surface">
                        <div className="section-heading">
                          <h2>{t('寄出之后，分别记录每个阶段')}</h2>
                          <Button
                            variant="outline"
                            onClick={() => add('filing')}
                          >
                            <Plus size={16} />
                            {t('记录事件')}
                          </Button>
                        </div>
                        <div className="lifecycle-legend">
                          <span>{t('USCIS 申请')}</span>
                          <ChevronRight size={16} />
                          <span>{t('领馆签证（适用时）')}</span>
                          <ChevronRight size={16} />
                          <span>{t('入境 / I-94 / 工作')}</span>
                        </div>
                        {t(
                          records.filter((r) => r.kind === 'filing').length ? (
                            <div className="filing-events">
                              {t(
                                records
                                  .filter((r) => r.kind === 'filing')
                                  .map((r) => (
                                    <button
                                      key={r.id}
                                      onClick={() => openEditor(r)}
                                    >
                                      <time>{t(r.body.date)}</time>
                                      <div>
                                        <h3>{t(r.body.title)}</h3>
                                        <p>
                                          {t(
                                            r.body.event === '221g'
                                              ? '领馆 221(g) · 与 USCIS RFE 分开记录'
                                              : r.body.event,
                                          )}
                                          {t(
                                            r.body.deadline
                                              ? f(
                                                  ' \u00B7 截止 {0}',
                                                  r.body.deadline,
                                                )
                                              : '',
                                          )}
                                        </p>
                                        <p>{t(r.body.notes)}</p>
                                      </div>
                                      <ChevronRight size={16} />
                                    </button>
                                  )),
                              )}
                            </div>
                          ) : (
                            <Empty
                              title={t('尚未记录递交事件')}
                              note={t(
                                '打印、寄送、受理与批准分别留痕。领馆 221(g) 在领馆分支处理。',
                              )}
                            />
                          ),
                        )}
                      </section>
                      <section className="surface">
                        <h2>{t('官方规则与当日核验')}</h2>
                        <p className="muted">
                          {t(
                            '读取成功也需要核对适用条件；无法读取时，打开官方页面后将核验内容作为来源记录。',
                          )}
                        </p>
                        <div className="official-list">
                          {t(
                            OFFICIAL.slice(0, 8).map(([name, url]) => (
                              <div key={url}>
                                <a href={url} target="_blank" rel="noreferrer">
                                  {t(name)}
                                  <ArrowUpRight size={15} />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() =>
                                    run(async () => {
                                      const r = await post('rules', { url });
                                      await refresh();
                                      setNotice(
                                        r.state === 'unavailable'
                                          ? '未完成自动读取。请打开官方来源并记录人工核验结果。'
                                          : '已保留页面读取记录；仍需核对适用条款。',
                                      );
                                    })
                                  }
                                >
                                  {t('记录读取结果')}
                                </Button>
                              </div>
                            )),
                          )}
                        </div>
                        {t(
                          records
                            .filter((r) => r.kind === 'rule')
                            .map((r) => (
                              <div className="rule-log" key={r.id}>
                                <span>{t(r.body.title)}</span>
                                <span>
                                  {t(
                                    r.body.state === 'unavailable'
                                      ? '未完成读取'
                                      : '已读取，待人工复核',
                                  )}
                                </span>
                                <small>{t(fmt(r.created))}</small>
                              </div>
                            )),
                        )}
                      </section>
                    </>
                  ),
                )}
                <footer className="workspace-footer">
                  <span>
                    {t(
                      'USCOO 帮助整理与制作材料；事实、签署、付款和正式提交由你确认。',
                    )}
                  </span>
                  <button
                    className="text-link"
                    onClick={() => setSettings(true)}
                  >
                    {t('项目设置与隐私', 'Project settings and privacy')}
                  </button>
                </footer>
              </>
            ),
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </main>
      </div>
      {t(
        editor && project && (
          <RecordEditor
            key={`${editor.id || editor.kind}-${replaceId}`}
            item={editor}
            records={records}
            projectId={project.id}
            error={error}
            busy={busy}
            onClose={() => {
              setEditor(null);
              setError('');
            }}
            onSave={saveRecord}
            onHistory={loadHistory}
          />
        ),
      )}
      <JourneyReviewDialog
        open={journeyReview}
        onOpenChange={setJourneyReview}
        projectId={project?.id || initialProjectId}
        preparationMode={profile.preparationMode}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('新建申请项目')}</DialogTitle>
            <DialogDescription>
              {t('不同项目分别保存资料和修改记录。')}
            </DialogDescription>
          </DialogHeader>
          <label className="field">
            <span>{t('项目名称')}</span>
            <Input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <Button onClick={create} disabled={busy || !title.trim()}>
            {t('建立项目')}
          </Button>
          {t(error && <p role="alert">{t(error)}</p>)}
        </DialogContent>
      </Dialog>
      <Dialog
        open={history !== null}
        onOpenChange={(v) => !v && setHistory(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{t('此前保存的修订')}</DialogTitle>
            <DialogDescription>
              {t('历史记录供核对，不会覆盖当前内容。')}
            </DialogDescription>
          </DialogHeader>
          {t(
            history?.length ? (
              history.map((r, i) => (
                <details key={i}>
                  <summary>
                    {t('修订')}
                    {t(r.version)} · {t(fmt(r.created))}
                  </summary>
                  <pre className="history-text">
                    {t(JSON.stringify(r.body, null, 2))}
                  </pre>
                </details>
              ))
            ) : (
              <p>{t('还没有此前修订。')}</p>
            ),
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[740px]">
          <DialogHeader>
            <DialogTitle>
              {t('项目设置与隐私', 'Project settings and privacy')}
            </DialogTitle>
            <DialogDescription>
              {t(
                '保存、导出、对外分享和删除分别控制。',
                'Storage, exports, external sharing, and deletion are controlled separately.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="service-grid">
            <div>
              <strong>{t('案件与原件')}</strong>
              <span>
                {t(caps.storage ? '已连接持久保存服务' : '正在确认服务状态')}
              </span>
            </div>
            <div>
              <strong>{t('扫描件识别')}</strong>
              <span>{t('待接入；当前对照原页录入')}</span>
            </div>
            <div>
              <strong>{t('实际递交')}</strong>
              <span>{t('由你或受托第三方完成')}</span>
            </div>
          </div>
          <p>
            {t(
              '项目按登录用户隔离，原件需要登录后读取。先不用填写证件号、签名或银行信息；导出或分享前，请逐项核对内容和接收人。',
              'Projects are separated by signed-in user and source files require sign-in. Do not enter identity numbers, signatures, or bank details yet; review every item and recipient before exporting or sharing.',
            )}
          </p>
          {t(
            project && (
              <>
                <div className="form-divider">
                  <h3>{t('导出与删除')}</h3>
                  <p>
                    {t(
                      '完整导出包含个人信息，只交给明确授权的人。删除会移除项目、当前和历史原件以及分享；已被他人下载的副本无法追回，基础设施备份清除遵循服务商策略。',
                    )}
                  </p>
                  <div className="inline-actions">
                    <a
                      className="outline-link"
                      href={`${API}/${project.id}/export`}
                    >
                      {t('完整 ZIP \u2193')}
                    </a>
                    <a
                      className="outline-link"
                      href={`${API}/${project.id}/export?format=json`}
                    >
                      {t('全部记录 JSON \u2193')}
                    </a>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteText('');
                        setDeleteOpen(true);
                      }}
                    >
                      {t('删除项目')}
                    </Button>
                  </div>
                </div>
                <div className="form-divider">
                  <h3>{t('只分享匿名进度')}</h3>
                  <p>
                    {t(
                      '分享公司线与个人线的任务总数和完成数，有效期 7 天。姓名、标题、任务文字、原件和摘录均不分享。当前站点仍受访问权限限制。',
                    )}
                  </p>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const r = await post('shares', { confirmed: true });
                        setShareUrl(`${window.location.origin}${r.url}`);
                        await refresh();
                      })
                    }
                  >
                    <Link2 size={16} />
                    {t('生成匿名进度链接')}
                  </Button>
                  {t(
                    shareUrl && (
                      <Input
                        aria-label={t('匿名进度链接')}
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.target.select()}
                      />
                    ),
                  )}
                  <div>
                    {t(
                      data?.shares
                        .filter((s) => s.kind !== 'lawyer')
                        .map((s) => (
                          <div className="share-row" key={s.id}>
                            <span>
                              {t(
                                s.revoked
                                  ? '已撤回'
                                  : f('到期 {0}', s.expires.slice(0, 10)),
                              )}
                            </span>
                            {t(
                              !s.revoked && (
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    run(async () => {
                                      await request(
                                        `${API}/${project.id}/shares/${s.id}`,
                                        { method: 'DELETE' },
                                      );
                                      await refresh();
                                      setShareUrl('');
                                    })
                                  }
                                >
                                  {t('撤回')}
                                </Button>
                              ),
                            )}
                          </div>
                        )),
                    )}
                  </div>
                </div>
                <details>
                  <summary>{t('最近的项目操作')}</summary>
                  {t(
                    data?.audit.map((a, i) => (
                      <div className="audit-line" key={i}>
                        <span>{t(a.action)}</span>
                        <small>{t(fmt(a.created))}</small>
                      </div>
                    )),
                  )}
                </details>
              </>
            ),
          )}
          <p className="fine-print">
            {t(
              '当前为定向内测版本。USCOO 未替你注册公司、申请税号、开户、提交政府表格或建立律师关系。核心自助免费；政府、机构、律师及其他第三方费用另列。',
            )}
          </p>
          {t(
            error && (
              <p className="notice error" role="alert">
                {t(error)}
              </p>
            ),
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('删除这份申请项目？')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('此操作会删除项目及原件。请输入\u201C')}
              {t(project?.title)}
              {t('\u201D确认。')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            aria-label={t('输入项目名称确认删除')}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || deleteText !== project?.title}
              onClick={() =>
                run(async () => {
                  await request(`${API}/${project!.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confirm: deleteText }),
                  });
                  setData(null);
                  setSettings(false);
                  setDeleteOpen(false);
                  await refresh('');
                  setNotice('项目已删除。');
                })
              }
            >
              {t('确认删除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  function evidenceTable() {
    const rows = evidence.filter(
      (r) =>
        (filter === 'all' || r.body.criteria?.includes(filter)) &&
        `${r.body.title} ${r.body.issuer || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <section className="surface evidence-table">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <Input
              aria-label={t('查找材料')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('按标题或出具机构查找')}
            />
          </div>
          <Button variant="outline" onClick={() => add('evidence')}>
            {t('添加来源')}
            <Plus size={16} />
          </Button>
        </div>
        {t(
          rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('原件与来源')}</TableHead>
                  <TableHead>{t('出处')}</TableHead>
                  <TableHead>{t('当前状态')}</TableHead>
                  <TableHead className="text-right">{t('操作')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {t(
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <button
                          className="evidence-name"
                          onClick={() => openEditor(r)}
                        >
                          <FileText size={18} />
                          <span>
                            {t(r.body.title)}
                            <small>
                              {t(
                                r.body.file
                                  ? `${(r.body.file.size / 1024).toFixed(0)} KB · 原件已保存`
                                  : '来源摘录',
                              )}
                              {t(r.body.replaces ? ' · 重传件' : '')}
                            </small>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span>{t(r.body.issuer || '出具人待补充')}</span>
                        <small className="block">
                          {t(r.body.page || '页段待核对')}
                        </small>
                      </TableCell>
                      <TableCell>
                        <Status value={r.body.status} />
                      </TableCell>
                      <TableCell>
                        <div className="table-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditor(r)}
                          >
                            {t('核对')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setReplaceId(r.id);
                              fileRef.current?.click();
                            }}
                          >
                            {t('重传')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          ) : (
            <Empty
              title={t(
                evidence.length ? '没有匹配的材料' : '原始材料从这里开始',
              )}
              note={t('上传原件，或记录公开来源、页段与逐字摘录。')}
              action={t('上传第一份原件')}
              onClick={() => {
                setReplaceId('');
                fileRef.current?.click();
              }}
            />
          ),
        )}
      </section>
    );
  }
}
