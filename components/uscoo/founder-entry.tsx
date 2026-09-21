'use client';
import { z } from 'zod';
import {
  assessmentReport,
  assessmentSnapshot,
  type ReportInput,
} from '@/lib/assessment-report';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Download,
  FileText,
  FolderOpen,
  KeyRound,
  Leaf,
  LockKeyhole,
  Upload,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CRITERIA, POLICY_URL, type CaseProject } from '@/lib/case-domain';
import {
  EXPERIENCE,
  keywordHints,
  COMPANY_LABEL,
  TIMING_LABEL,
  APPLICATION_PATH_LABEL,
  type Signals,
  type Answer,
} from '@/lib/founder-intake';
import Link from 'next/link';

import { LanguageSwitch, useI18n, useDraftState } from './language';
import FeeCalculator from './fee-calculator';
import { IntentForm } from './intent-form';
import { readResume } from '@/lib/resume-reader';
import { FounderHeader, type Stage } from './journey-header';
import PetitionerGuide from './petitioner-guide';
import AssessmentConversation from './assessment-conversation';
import { Choice } from './case-editor';
import {
  createBrowserId,
  getVisitorId,
  trackAssessmentEvent,
} from '@/lib/browser-engagement';
const API = '/api/uscoo/projects';
const O1_URL =
  'https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement';
const STATUS = { yes: '你提到的线索', unsure: '还需要了解', no: '暂未提到' };
function PolicyLink({
  href = POLICY_URL,
  children = '查看 USCIS 原文',
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const { t, f } = useI18n();
  return (
    <a className="founder-source" href={href} target="_blank" rel="noreferrer">
      {t(children)}
      <ArrowUpRight size={13} />
    </a>
  );
}
export default function FounderEntry({
  signedIn,
  initialStage = 'overview',
}: {
  signedIn: boolean;
  initialStage?: Stage;
}) {
  const { t, f, language } = useI18n();
  const [intent, setIntent] = useDraftState('intent', {
    desiredApproval: '',
    arrivalDate: '',
    workStartDate: '',
    location: 'unknown',
    workPlan: '',
  });
  const [beneficiaryName, setBeneficiaryName] = useDraftState(
      'beneficiaryName',
      '',
    ),
    [petitionerName, setPetitionerName] = useDraftState('petitionerName', '');
  const [currentWork, setCurrentWork] = useDraftState('currentWork', ''),
    [standoutStory, setStandoutStory] = useDraftState('standoutStory', ''),
    [assessmentStep, setAssessmentStep] = useDraftState('assessmentStep', 1),
    [projectTitle, setProjectTitle] = useDraftState('projectTitle', ''),
    [inviteCode, setInviteCode] = useDraftState('inviteCode', '');
  const [activeProject, setActiveProject] = useDraftState('activeProject', '');
  const [restoring, setRestoring] = useState(
    signedIn && initialStage === 'result',
  );
  const [stage, setStage] = useState<Stage>(initialStage);
  const [method, setMethod] = useState<'choices' | 'resume' | 'linkedin'>(
    'choices',
  );
  const [answers, setAnswers] = useDraftState<Signals>('answers', {});
  const [sourceText, setSourceText] = useDraftState('sourceText', ''),
    [sourceName, setSourceName] = useDraftState('sourceName', ''),
    [linkedin, setLinkedin] = useDraftState('linkedin', '');
  const [company, setCompany] = useDraftState<keyof typeof COMPANY_LABEL>(
      'company',
      'unknown',
    ),
    [applicationPath, setApplicationPath] = useDraftState<
      keyof typeof APPLICATION_PATH_LABEL
    >('applicationPath', 'undecided'),
    [field, setField] = useDraftState('field', ''),
    [timing, setTiming] = useDraftState<keyof typeof TIMING_LABEL | ''>(
      'timing',
      '',
    );
  const [projects, setProjects] = useState<CaseProject[]>([]),
    [projectsError, setProjectsError] = useState('');
  const [consent, setConsent] = useDraftState('consent', false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fileNote, setFileNote] = useState(''),
    [saveOpen, setSaveOpen] = useState(false),
    [accountStatus, setAccountStatus] = useState<
      'unknown' | 'pending' | 'active'
    >('unknown'),
    [forceNewProject, setForceNewProject] = useState(false),
    [leadName, setLeadName] = useState(''),
    [leadEmail, setLeadEmail] = useState(''),
    [leadWechat, setLeadWechat] = useState(''),
    [leadHasChatgpt, setLeadHasChatgpt] = useState<'yes' | 'no' | 'unknown'>(
      'unknown',
    ),
    [leadInterview, setLeadInterview] = useState(false),
    [leadSaved, setLeadSaved] = useState(false);
  const submission = useRef({ value: '', id: '' });
  const [leadEmailStatus, setLeadEmailStatus] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/uscoo/leads')
      .then((r) => (r.ok ? r.json() : null))
      .then((b: any) => setEmailAvailable(b?.emailAvailable ?? null))
      .catch(() => {});
  }, []);
  const [leadEmailTouched, setLeadEmailTouched] = useState(false);
  const leadNameValid = leadName.trim().length > 0;
  const leadEmailValid = z.email().max(320).safeParse(leadEmail.trim()).success;
  const fileInput = useRef<HTMLInputElement>(null),
    requestId = useRef(''),
    trackedEvents = useRef(new Set<string>()),
    heading = useRef<HTMLHeadingElement>(null);
  const answered = Object.keys(answers).length;
  const leads = EXPERIENCE.filter((x) => answers[x.id] === 'yes');
  const unsure = EXPERIENCE.filter((x) => answers[x.id] === 'unsure');
  const hints = keywordHints(
    [currentWork, standoutStory, sourceText].filter(Boolean).join('\n'),
  );
  const hasAssessmentResult = Boolean(
    intent.location !== 'unknown' &&
    currentWork.trim() &&
    (standoutStory.trim() || sourceText.trim() || answered) &&
    timing,
  );
  const hasNarrative = Boolean(standoutStory.trim() || sourceText.trim());
  const primaryDirection =
    CRITERIA.find((criterion) =>
      EXPERIENCE.some(
        (item) =>
          item.id === criterion.id &&
          (answers[item.id] === 'yes' || hints.includes(item.id)),
      ),
    ) || null;
  const resultDirections = EXPERIENCE.filter(
    (item) =>
      answers[item.id] === 'yes' ||
      answers[item.id] === 'unsure' ||
      hints.includes(item.id),
  );
  useEffect(() => {
    function sync() {
      const h = new URLSearchParams(window.location.search).get('view')
        ? '#' + new URLSearchParams(window.location.search).get('view')
        : window.location.hash;
      setStage(
        h === '#result'
          ? 'result'
          : h === '#assessment'
            ? 'assessment'
            : 'overview',
      );
      if (h === '#mywork')
        setTimeout(
          () => document.getElementById('mywork')?.scrollIntoView(),
          30,
        );
    }
    let cancelled = false;
    if (signedIn && new URLSearchParams(window.location.search).get('case'))
      setRestoring(true);
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    if (signedIn)
      fetch(API, { cache: 'no-store' })
        .then(async (r) => {
          if (!r.ok) throw new Error('项目列表暂时未能读取，请刷新重试。');
          const list = (
            (await r.json()) as {
              projects: CaseProject[];
            }
          ).projects;
          if (cancelled) return;
          setProjects(list);
          const id = new URLSearchParams(window.location.search).get('case');
          if (id && !list.some((p) => p.id === id)) {
            setActiveProject('');
            setAnswers({});
            throw new Error('无法读取这份评估，请重新选择项目。');
          }
          if (id) {
            const response = await fetch(`${API}/${id}`, { cache: 'no-store' });
            if (!response.ok)
              throw new Error('无法读取这份评估，请重新选择项目。');
            const c: any = await response.json(),
              draft = c.records.find((x: any) => x.kind === 'intake')?.body;
            if (cancelled) return;
            setActiveProject(id);
            if (draft) {
              setAnswers(draft.answers);
              setCurrentWork(
                draft.currentWork ||
                  c.project.profile.field ||
                  draft.field ||
                  draft.workPlan ||
                  '此前保存的专业经历',
              );
              setStandoutStory(
                draft.standoutStory ||
                  draft.sourceText ||
                  (Object.keys(draft.answers || {}).length
                    ? '此前已按经历类型完成初步评估'
                    : ''),
              );
              setBeneficiaryName(
                c.project.profile.name ?? draft.beneficiaryName ?? '',
              );
              setPetitionerName(
                c.project.profile.company ?? draft.petitionerName ?? '',
              );
              setMethod(draft.method || 'choices');
              setCompany(draft.company);
              setApplicationPath(draft.applicationPath || 'undecided');
              setField(c.project.profile.field ?? draft.field);
              setTiming(draft.timing || '');
              setSourceText(draft.sourceText);
              setSourceName(draft.sourceName);
              setLinkedin(draft.linkedin);
              setIntent({
                desiredApproval:
                  c.project.profile.desiredApproval ??
                  draft.desiredApproval ??
                  '',
                arrivalDate:
                  c.project.profile.arrivalDate ?? draft.arrivalDate ?? '',
                workStartDate:
                  c.project.profile.start ?? draft.workStartDate ?? '',
                location:
                  c.project.profile.location ?? draft.location ?? 'unknown',
                workPlan: c.project.profile.duties ?? draft.workPlan ?? '',
              });
            }
          }
        })
        .catch((e) => {
          if (!cancelled) setProjectsError(e.message);
        })
        .finally(() => {
          if (!cancelled) setRestoring(false);
        });
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, [signedIn]);
  useEffect(() => {
    const event =
      stage === 'assessment'
        ? 'assessment_started'
        : stage === 'result' && hasAssessmentResult
          ? 'result_viewed'
          : null;
    if (!event || trackedEvents.current.has(event)) return;
    trackedEvents.current.add(event);
    void trackAssessmentEvent(event, language);
  }, [stage, hasAssessmentResult, language]);
  useEffect(() => {
    if (
      stage === 'result' &&
      new URLSearchParams(window.location.search).get('save') === '1'
    ) {
      void openSave();
    }
  }, [stage]);
  function go(next: Stage, validateAssessment = false) {
    const hasAchievement = Boolean(
      standoutStory.trim() || sourceText.trim() || answered,
    );
    if (
      next === 'result' &&
      (intent.location === 'unknown' ||
        !timing ||
        !currentWork.trim() ||
        !hasAchievement)
    ) {
      setStage('assessment');
      const missingStep =
        intent.location === 'unknown' || !timing
          ? 1
          : !currentWork.trim()
            ? 2
            : 3;
      setAssessmentStep(missingStep);
      setError(
        missingStep === 1
          ? '请选择当前所在地和期望获得申请结果的时间。'
          : missingStep === 2
            ? '先用一两句话说说你现在在做什么。'
            : '请讲一件你最有把握说“这是我做成的”的经历，或导入现有资料。',
      );
      setTimeout(
        () =>
          document
            .querySelector('.assessment-question-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        0,
      );
      return;
    }
    if (next === 'result' && validateAssessment && hints.length) {
      setAnswers((old) => {
        const copy = { ...old };
        for (const id of hints) if (!copy[id]) copy[id] = 'unsure';
        return copy;
      });
    }
    const target = next;
    setStage(target);
    setError('');
    window.history.pushState(
      null,
      '',
      target === 'overview'
        ? '/beta'
        : `/beta?view=${target}${activeProject ? '&case=' + encodeURIComponent(activeProject) : ''}`,
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  }
  async function loadFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    setFileNote('');
    try {
      const text = await readResume(file);
      if (text.replace(/\[第 \d+ 页\]/g, '').trim().length < 30)
        throw new Error(
          '这份文件没有足够的可读取文字。扫描件可先转成文字，或用下方点选继续。',
        );
      setSourceText(text);
      setSourceName(file.name);
      setFileNote(
        `已读取 ${file.name}。请检查文字，尤其是日期、数字和职位。${text.length >= 40000 ? '只保留前 40,000 字；PDF 最多读取前 30 页。' : ''}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  function reportInput(): ReportInput {
    return {
      language,
      location: intent.location,
      timing,
      company,
      applicationPath,
      assessment: { currentWork, standoutStory, sourceText, answers },
    };
  }
  function downloadText(body: string, filename: string) {
    const url = URL.createObjectURL(
      new Blob([body], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadSnapshot() {
    downloadText(
      assessmentSnapshot(reportInput()),
      language === 'en'
        ? 'USCOO-current-result-summary.txt'
        : 'USCOO-当前结果摘要.txt',
    );
  }
  function downloadFullReport() {
    downloadText(
      assessmentReport(reportInput()),
      language === 'en'
        ? 'USCOO-full-initial-assessment.txt'
        : 'USCOO-完整初步评估报告.txt',
    );
  }
  const suggestedProjectTitle = `${(
    petitionerName.trim() ||
    field.trim() ||
    currentWork.trim().slice(0, 28) ||
    t('我的 O-1A 申请', 'My O-1A case')
  ).replace(/[·\s]+$/, '')} · O-1A`;
  const duplicateProject = !activeProject
    ? projects.find(
        (project) =>
          project.title.trim().toLocaleLowerCase() ===
          (projectTitle || suggestedProjectTitle).trim().toLocaleLowerCase(),
      )
    : undefined;
  async function openSave() {
    if (!projectTitle.trim()) setProjectTitle(suggestedProjectTitle);
    setForceNewProject(false);
    setSaveOpen(true);
    setError('');
    void trackAssessmentEvent('save_opened', language);
    if (!signedIn) return;
    setAccountStatus('unknown');
    try {
      const response = await fetch('/api/uscoo/account', { cache: 'no-store' });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || '账号状态暂时无法读取。');
      setAccountStatus(body.account.accessStatus);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }
  async function begin(destination: 'pre-review') {
    if (!consent || busy || !projectTitle.trim()) return;
    if (!signedIn) {
      window.location.assign(
        `/signin-with-chatgpt?return_to=${encodeURIComponent('/beta?view=result&save=1')}`,
      );
      return;
    }
    if (duplicateProject && !forceNewProject) return;
    setBusy(true);
    setError('');
    try {
      if (accountStatus !== 'active') {
        if (!inviteCode.trim())
          throw new Error('请输入邀请码，开通后即可保存并继续。');
        const activation = await fetch('/api/uscoo/account/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
        });
        const activationBody: any = await activation.json();
        if (!activation.ok)
          throw new Error(activationBody.error || '邀请码未能验证。');
        setAccountStatus('active');
      }
      requestId.current ||= createBrowserId();
      const current: any = activeProject
        ? await (
            await fetch(`${API}/${activeProject}`, { cache: 'no-store' })
          ).json()
        : null;
      const r = await fetch(
        activeProject ? `${API}/${activeProject}/intake` : API,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: projectTitle.trim(),
            requestId: requestId.current,
            revision: current?.project?.revision,
            intake: {
              answers,
              currentWork,
              standoutStory,
              beneficiaryName,
              petitionerName,
              method,
              sourceText,
              sourceName,
              linkedin,
              company,
              field,
              timing,
              applicationPath,
              ...intent,
              consent: true,
            },
          }),
        },
      );
      const b: any = await r.json();
      if (!r.ok)
        throw new Error(
          b.error || '保存未完成，当前梳理仍留在页面，可以重试或下载。',
        );
      window.location.assign(
        `/pre-review?project=${encodeURIComponent(b.project.id)}`,
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function saveEmailLead() {
    setLeadEmailTouched(true);
    if (!leadNameValid || !leadEmailValid || busy) return;
    setBusy(true);
    setError('');
    try {
      const value = JSON.stringify({
        leadName,
        leadEmail,
        leadWechat,
        intent,
        timing,
        company,
        applicationPath,
        leadHasChatgpt,
        leadInterview,
        language,
        currentWork,
        standoutStory,
        sourceText,
        answers,
      });
      if (submission.current.value !== value)
        submission.current = { value, id: createBrowserId() };
      const response = await fetch('/api/uscoo/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: submission.current.id,
          visitorId: getVisitorId(),
          name: leadName.trim(),
          email: leadEmail.trim(),
          wechat: leadWechat.trim(),
          location: intent.location,
          timing,
          company,
          applicationPath,
          hasChatgpt: leadHasChatgpt,
          wantsInterview: leadInterview,
          language,
          assessment: { currentWork, standoutStory, sourceText, answers },
          website: '',
        }),
      });
      const body: any = await response.json();
      if (!response.ok)
        throw new Error(body.error || '联系方式暂时无法保存，请稍后再试。');
      setLeadSaved(true);
      setLeadEmailStatus(body.lead.emailStatus);
      downloadFullReport();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="founder-app">
      <FounderHeader
        active={stage === 'overview' ? 0 : stage === 'assessment' ? 1 : 2}
        projectId={activeProject || undefined}
        onNavigate={go}
      />
      <main key={stage} id="founder-main" className="founder-main">
        {t(
          stage === 'overview' && (
            <>
              <section className="founder-hero">
                <div className="founder-hero-copy">
                  <p className="founder-eyebrow">
                    {t('了解项目 / 你的 O-1A 系统化准备路径')}
                  </p>
                  <h1 ref={heading} tabIndex={-1}>
                    {t('想去美国创业，')}
                    <br />
                    {t('先看懂 O-1A 这条路。')}
                  </h1>
                  <p className="founder-lead">
                    {t(
                      'USCOO 协助你完成 O-1A 杰出人才申请的全流程：评估经历、整理证据、准备申请公司、编排材料，并按需要选择自主申请或委托律所。',
                      'USCOO supports the full O-1A preparation journey: assess your experience, organize evidence, prepare the petitioner, assemble documents, and choose self-filing or a law firm when you are ready.',
                    )}
                  </p>
                  <div className="founder-actions">
                    <Button size="lg" onClick={() => go('assessment')}>
                      {t('先看看我的经历')}
                      <ArrowRight />
                    </Button>
                    <a href="#roadmap">
                      {t('先看完整流程')}
                      <ChevronDown size={15} />
                    </a>
                  </div>
                  <p className="founder-micro">
                    {t(
                      '先点选或导入简历 \u00B7 无需先建档 \u00B7 可以随时停下来',
                    )}
                  </p>
                </div>
                <aside className="founder-primer">
                  <span className="founder-overline">{t('O-1A 是什么？')}</span>
                  <h2>
                    {t('让你的专业成就，')}
                    <br />
                    {t('支持你赴美继续工作。')}
                  </h2>
                  <p>
                    {t(
                      'O-1A 是面向科学、教育、商业或体育领域杰出人才的临时工作类别。创业者也可以探索这条路。',
                    )}
                  </p>
                  <div className="founder-primer-note">
                    {t(
                      '申请会同时说明两件事：你的杰出能力，以及你将在美国继续从事的具体专业工作。',
                      'The petition brings together two things: evidence of your extraordinary ability and the specific professional work you plan to continue in the United States.',
                    )}
                  </div>
                  <PolicyLink href={O1_URL} children="O-1 官方介绍" />
                </aside>
              </section>
              <section className="founder-section" aria-labelledby="two-sides">
                <div className="founder-section-heading">
                  <div>
                    <p className="founder-eyebrow">{t('先理解这两件事')}</p>
                    <h2 id="two-sides">
                      {t('有个人成就，也要有真实的赴美工作。')}
                    </h2>
                  </div>
                  <span className="founder-small">
                    {t('注册公司只是其中一部分')}
                  </span>
                </div>
                <div className="founder-dual">
                  <article>
                    <div className="founder-icon">
                      <UserRound size={21} />
                    </div>
                    <h3>{t('你做过什么，能用什么证明？')}</h3>
                    <p>
                      {t(
                        '看你在领域里的成就、认可和个人作用。产品、融资、职位都是了解经历的起点，后面还要找到具体证据。',
                      )}
                    </p>
                    <a href="#criteria">
                      {t('看看哪些经历值得整理')}
                      <ArrowRight size={14} />
                    </a>
                  </article>
                  <article>
                    <div className="founder-icon">
                      <Building2 size={21} />
                    </div>
                    <h3>{t('谁为你申请，你去做什么？')}</h3>
                    <p>
                      {t(
                        '通常由美国雇主或符合要求的美国代理人提交。你拥有的独立美国公司可能作为申请人，但本人不能直接自我申请；主体及工作安排需核实。',
                      )}
                    </p>
                    <a href="#petitioner" className="founder-source">
                      {t(
                        '了解申请公司详情',
                        'Understand the petitioning company',
                      )}
                    </a>
                  </article>
                </div>
              </section>
              <PetitionerGuide />
              <section className="founder-section" id="roadmap">
                <div className="founder-section-heading">
                  <div>
                    <p className="founder-eyebrow">{t('一页看完整条路')}</p>
                    <h2>
                      {t(
                        'USCOO 协助你从“我能不能试试”，走到正式赴美创业（工作）。',
                        'USCOO takes you from “Could this work for me?” to preparing to build or work in the United States.',
                      )}
                    </h2>
                  </div>
                </div>
                <ol className="founder-roadmap">
                  {t(
                    [
                      [
                        '先看懂',
                        '理解 O-1A 适用对象、杰出能力证明和赴美工作安排。',
                        '了解全貌',
                      ],
                      [
                        '说说你的经历',
                        '从你现在的工作、一件杰出经历和赴美时间开始。',
                        '双方信息',
                      ],
                      [
                        '看看你手上有什么',
                        '把回答变成值得核实的方向，先用现有记录补缺口。',
                        '优先利用已有材料',
                      ],
                      [
                        '还差什么',
                        '把已有线索和材料逐项对标 USCIS 标准。',
                        '查缺补漏',
                      ],
                      [
                        '怎么继续',
                        '选择自主申请，或委托律所；选择律所后再生成沟通资料包与分享链接。',
                        '由你决定',
                      ],
                      [
                        '公司与个人双线准备',
                        '推进公司工作安排、个人杰出证明、文书和专业复核。',
                        'O-1A 杰出人才申请工作台',
                      ],
                      [
                        '递交与后续跟踪',
                        '记录申请包、寄送、受理、补件、签证及入境节点。',
                        '持续跟踪',
                      ],
                    ].map(([title, note, tag], i) => (
                      <li key={title}>
                        <span className="road-number">0{t(i + 1)}</span>
                        <h3>{t(title)}</h3>
                        <p>{t(note)}</p>
                        <small>{t(tag)}</small>
                      </li>
                    )),
                  )}
                </ol>
              </section>
              <section className="founder-section founder-time">
                <div>
                  <p className="founder-eyebrow">{t('时间、精力与费用')}</p>
                  <h2>
                    {t('先把经历挖出来，')}
                    <br />
                    {t('再把它变成有出处的材料。')}
                  </h2>
                  <p>
                    {t(
                      '前一半 USCOO 陪你追问到具体场景；后一半需要你找原件或请知情人确认，我们会告诉你每份材料该找谁、该问什么。',
                      'USCOO helps you reconstruct the concrete event first. Then, as you find originals or ask knowledgeable people to confirm it, the system tells you whom to ask and what each record should establish.',
                    )}
                  </p>
                </div>
                <div className="founder-time-list">
                  <div>
                    <h3>{t('先留 30–60 分钟，回顾杰出经历')}</h3>
                    <p>
                      {t(
                        '这是第一轮梳理的安排建议。先用现有简历，不必一开始就准备完整申请包。',
                      )}
                    </p>
                  </div>
                  <div>
                    <h3>{t('材料准备按周安排，外部配合可能延长到月')}</h3>
                    <p>
                      {t(
                        '取决于现有证据、公司安排、推荐人及翻译。它是个人准备计划，不是统一申请周期。',
                      )}
                    </p>
                  </div>
                  <div>
                    <h3>{t('USCIS 审理与签证时间，分开计算')}</h3>
                    <p>
                      {t(
                        '普通审理以官方查询为准；适用的 O-1 加急通常是 15 个工作日内采取审理行动，可能包括补件，并非保证批准。领馆预约或行政处理另计。',
                      )}
                    </p>
                    <PolicyLink
                      href="https://www.uscis.gov/forms/all-forms/how-do-i-request-premium-processing"
                      children="加急规则"
                    />
                    {t(' ')}
                    <PolicyLink
                      href="https://egov.uscis.gov/processing-times/"
                      children="普通审理查询"
                    />
                  </div>
                  <details>
                    <summary>
                      {t('会有哪些费用？')}
                      <ChevronDown size={15} />
                    </summary>
                    <p>
                      {t(
                        '政府申请及适用加急费用、公司运营相关费用，以及按需要发生的翻译、律师或其他服务费用。是否适用与金额取决于具体情况，递交前再按官方标准核验。',
                      )}
                    </p>
                    <PolicyLink
                      href="https://www.uscis.gov/feecalculator"
                      children="官方费用计算器"
                    />
                  </details>
                </div>
              </section>
              <FeeCalculator />
              <section className="founder-section" id="criteria">
                <div className="founder-section-heading">
                  <div>
                    <p className="founder-eyebrow">{t('不需要先背法律条文')}</p>
                    <h2>{t('从这些熟悉的经历开始找线索。')}</h2>
                  </div>
                  <PolicyLink />
                </div>
                <p className="founder-section-intro">
                  {t(
                    '通常需有一项重大国际公认奖项，或满足八类证据中的至少三类，并接受整体审查。三个\u201C有\u201D不等于符合三项标准，更不等于获批；证据的质量、持续认可和领域地位都要判断。',
                  )}
                </p>
                <div className="founder-criteria">
                  {t(
                    CRITERIA.map((c, i) => (
                      <details key={c.id}>
                        <summary>
                          <span className="criterion-number">0{t(i + 1)}</span>
                          <strong>{t(c.title)}</strong>
                          <ChevronDown size={16} />
                        </summary>
                        <div>
                          <p>{t(c.question)}</p>
                          <p>{t(c.caution)}</p>
                          <small>
                            {t('核对重点：')}
                            {t(c.check)}。
                          </small>
                        </div>
                      </details>
                    )),
                  )}
                </div>
                <details className="founder-extra">
                  <summary>
                    {t('创业者的经历不完全落在这些类别里怎么办？')}
                    <ChevronDown size={16} />
                  </summary>
                  <p>
                    {t(
                      '先保留真实经历与证据。若列出的标准不易适用于你的职业，可能需要讨论可比证据；这有适用前提，不能仅因某项材料不足就替代。系统会保留问题，供后续专业判断。',
                    )}
                  </p>
                </details>
              </section>
              <section className="founder-start">
                <div>
                  <p className="founder-eyebrow">{t('下一步很小')}</p>
                  <h2>{t('先看看你的经历里，有哪些值得继续整理。')}</h2>
                  <p>
                    {t(
                      '你可以点选，也可以带一份简历。不需要先填写护照、地址或公司税号。',
                    )}
                  </p>
                </div>
                <Button size="lg" onClick={() => go('assessment')}>
                  {t('开始初步梳理')}
                  <ArrowRight />
                </Button>
              </section>
              <section id="mywork" className="founder-section founder-mywork">
                <h2>{t('已保存的申请项目', 'Saved application projects')}</h2>
                <p>
                  {t(
                    '只有你明确选择保存时才会建立项目。每张卡对应一份独立申请，可以随时继续准备或切换申请方式。',
                    'A project is created only when you explicitly save. Each card is one application you can continue or move between filing methods.',
                  )}
                </p>
                {t(projectsError && <p role="alert">{t(projectsError)}</p>)}
                {t(
                  projects.length ? (
                    <div className="founder-projects">
                      {t(
                        projects.map((p, index) => (
                          <div key={p.id}>
                            <div>
                              <span className="project-record-label">
                                {t('独立申请项目', 'Application project')}{' '}
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <strong>{t(p.title)}</strong>
                              <small>
                                {t('最近更新', 'Updated')}{' '}
                                {t(p.updated.slice(0, 10))} ·{' '}
                                {t('建立于', 'created')}{' '}
                                {t(p.created.slice(0, 10))} ·{' '}
                                {p.profile.preparationMode === 'diy'
                                  ? t('自主申请', 'Self-filing')
                                  : p.profile.preparationMode === 'counsel'
                                    ? t('律所协作', 'Law firm collaboration')
                                    : t(
                                        '申请方式待选择',
                                        'Method not selected',
                                      )}
                              </small>
                            </div>
                            <Link href={`/prepare?project=${p.id}&step=path`}>
                              {t('打开项目工作台', 'Open project workspace')}
                              <ArrowRight size={14} />
                            </Link>
                            <Link href={`/lawyer?project=${p.id}`}>
                              {p.profile.preparationMode === 'counsel'
                                ? t('律师沟通包', 'Counsel brief')
                                : t('选择申请方式', 'Choose method')}
                            </Link>
                          </div>
                        )),
                      )}
                    </div>
                  ) : (
                    <div className="founder-inline-empty">
                      <FolderOpen size={20} />
                      <span>
                        {t('还没有保存的准备项目。先从自己的经历开始。')}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => go('assessment')}
                      >
                        {t('看看我的经历')}
                      </Button>
                    </div>
                  ),
                )}
              </section>
            </>
          ),
        )}
        {stage === 'assessment' && (
          <AssessmentConversation
            step={assessmentStep}
            setStep={setAssessmentStep}
            currentWork={currentWork}
            setCurrentWork={setCurrentWork}
            standoutStory={standoutStory}
            setStandoutStory={setStandoutStory}
            method={method}
            setMethod={setMethod}
            answers={answers}
            setAnswers={setAnswers}
            sourceText={sourceText}
            setSourceText={setSourceText}
            linkedin={linkedin}
            setLinkedin={setLinkedin}
            timing={timing}
            setTiming={setTiming}
            company={company}
            setCompany={setCompany}
            intent={intent}
            setIntent={setIntent}
            applicationPath={applicationPath}
            setApplicationPath={setApplicationPath}
            busy={busy}
            error={error}
            setError={setError}
            fileNote={fileNote}
            fileInput={fileInput}
            loadFile={loadFile}
            onFinish={() => {
              void trackAssessmentEvent('assessment_completed', language);
              go('result', true);
            }}
          />
        )}
        {false &&
          t(
            stage === 'assessment' && (
              <>
                <section className="founder-page-heading">
                  <p className="founder-eyebrow">
                    {t('初步判断 / 从你熟悉的事情开始')}
                  </p>
                  <h1 ref={heading} tabIndex={-1}>
                    {t(
                      '你有哪些杰出的经历，先从这里说起。',
                      'Start with the achievements that may demonstrate extraordinary ability.',
                    )}
                  </h1>
                  <p className="founder-lead">
                    {t(
                      '选择一种快速评估方式开始；三种方式可以随时切换、相互补充，最后都会进入同一份评估结果。',
                      'Start with any of the three quick assessment methods. You can switch between them and combine the information in one result.',
                    )}
                  </p>
                </section>
                <section className="intent-form">
                  <h2>
                    {t('你与申请公司', 'You and the petitioning company')}
                  </h2>
                  <p>
                    {t(
                      '先收集与你的目标有关的基本信息；尚未确定的名称可以留空。',
                      'Start with basic information relevant to your plans. Leave undecided names blank.',
                    )}
                  </p>
                  <div className="intent-grid">
                    <label>
                      {t(
                        '你的姓名（受益人 / Beneficiary）',
                        'Your name · Beneficiary',
                      )}
                      <Input
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        maxLength={200}
                      />
                    </label>
                    <label>
                      {t(
                        '申请公司或代理人名称（Petitioner）',
                        'Petitioning company or agent · Petitioner',
                      )}
                      <Input
                        value={petitionerName}
                        onChange={(e) => setPetitionerName(e.target.value)}
                        maxLength={200}
                      />
                    </label>
                  </div>
                  <a href="/beta#petitioner">
                    {t('什么是申请公司？', 'What is a petitioner?')}
                  </a>
                </section>
                <IntentForm
                  value={intent}
                  onChange={setIntent}
                  company={company}
                  setCompany={setCompany}
                  approvalWindow={timing}
                  setApprovalWindow={setTiming}
                  field={field}
                  setField={setField}
                />
                {error.includes('期望多久获得申请结果') && (
                  <p className="founder-error" role="alert">
                    {t(error)}
                  </p>
                )}
                <div className="founder-assessment-layout">
                  <div>
                    <div className="assessment-method-intro">
                      <span>
                        {t(
                          '三种快速评估方式',
                          'Three quick assessment methods',
                        )}
                      </span>
                      <p>
                        {t(
                          '手头没有简历就直接点选；有现成简历就上传；习惯使用 LinkedIn 就导入主页内容。',
                          'Choose experience prompts if you have no resume handy, upload a resume you already have, or import content from your LinkedIn profile.',
                        )}
                      </p>
                    </div>
                    <Tabs
                      value={method}
                      onValueChange={(v) => {
                        setMethod(v as typeof method);
                        setError('');
                      }}
                    >
                      <TabsList className="founder-input-tabs">
                        <TabsTrigger value="choices">
                          {t('按经历点选', 'Choose experience prompts')}
                        </TabsTrigger>
                        <TabsTrigger value="resume">
                          {t('上传或粘贴简历', 'Upload or paste a resume')}
                        </TabsTrigger>
                        <TabsTrigger value="linkedin">
                          {t('导入 LinkedIn 内容', 'Import LinkedIn content')}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="choices">
                        <div className="founder-input-note">
                          <Check size={18} />
                          <p>
                            {t(
                              '不用写长段自我介绍。下面这些事，有没有发生在你的经历里？',
                            )}
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="resume">
                        <div className="founder-import">
                          <Upload size={25} />
                          <h3>{t('选择简历，或粘贴已有介绍')}</h3>
                          <p>
                            {t(
                              '支持 PDF、DOCX、TXT，最大 8 MB。文字在当前页面读取，你可以检查和删改。',
                            )}
                          </p>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => fileInput.current?.click()}
                          >
                            {t(busy ? '正在读取…' : '选择简历文件')}
                          </Button>
                          <p className="founder-micro">
                            {t(
                              '扫描 PDF 暂不识别图片文字；最多读取前 30 页、40,000 字。',
                            )}
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="linkedin">
                        <div className="founder-import founder-linkedin">
                          <h3>{t('用 LinkedIn 上已有的经历')}</h3>
                          <label htmlFor="linkedin">
                            {t('个人主页链接（可选，用于记录出处）')}
                          </label>
                          <Input
                            id="linkedin"
                            type="url"
                            placeholder="https://www.linkedin.com/in/your-name"
                            value={linkedin}
                            maxLength={2000}
                            onChange={(e) => setLinkedin(e.target.value)}
                          />
                          <p>
                            {t(
                              '粘贴主页中的 About / Experience，或上传导出的 PDF。目前不会自动读取链接或登录 LinkedIn。',
                            )}
                          </p>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => fileInput.current?.click()}
                          >
                            {t('选择导出的 PDF')}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <input
                      ref={fileInput}
                      className="sr-only"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      aria-label={t('选择简历文件')}
                      onChange={(e) => loadFile(e.target.files?.[0])}
                    />
                    {t(
                      (method !== 'choices' || sourceText) && (
                        <div className="founder-resume-text">
                          <label htmlFor="resume-text">
                            {t('你的经历文字')}
                            <span>{t('可编辑，尚未保存到项目')}</span>
                          </label>
                          <Textarea
                            id="resume-text"
                            value={sourceText}
                            maxLength={40000}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder={t(
                              '粘贴简历、LinkedIn 经历，或简短介绍你做过的工作\u2026\u2026',
                            )}
                            rows={6}
                          />
                          {t(
                            fileNote && (
                              <p role="status" className="founder-micro">
                                {t(fileNote)}
                              </p>
                            ),
                          )}
                          {t(
                            sourceText && (
                              <>
                                <div className="founder-hints">
                                  <BookOpen size={16} />
                                  <p>
                                    {t(
                                      hints.length
                                        ? f(
                                            '文字中出现了与\u201C{0}\u201D有关的词。请在下方确认是否有这些经历。',
                                            hints
                                              .map(
                                                (id) =>
                                                  CRITERIA.find(
                                                    (c) => c.id === id,
                                                  )?.title,
                                              )
                                              .join('、'),
                                          )
                                        : '可以继续用下面的点选补充。没有出现关键词，也不代表你没有相关经历。',
                                    )}
                                    <small>
                                      {t(
                                        '这里只提示关键词；不验证事实，不自动判定满足标准。',
                                      )}
                                    </small>
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setSourceText('');
                                    setSourceName('');
                                    setFileNote('');
                                  }}
                                >
                                  {t('清除这段文字')}
                                </Button>
                              </>
                            ),
                          )}
                        </div>
                      ),
                    )}
                    {t(
                      error && !error.includes('期望多久获得申请结果') && (
                        <p className="founder-error" role="alert">
                          {t(error)}
                        </p>
                      ),
                    )}
                    <div className="founder-question-intro">
                      <h2>{t('哪些经历与你有关？')}</h2>
                      <p>
                        {t(
                          '选\u201C有这类经历\u201D只表示值得继续了解，不表示已符合某项标准。可以跳过。',
                        )}
                      </p>
                    </div>
                    <div className="founder-questions">
                      {t(
                        EXPERIENCE.map((x, i) => (
                          <fieldset key={x.id} className="founder-question">
                            <legend>
                              <span>{t(String(i + 1).padStart(2, '0'))}</span>
                              {t(x.title)}
                              {t(
                                hints.includes(x.id) && (
                                  <small>{t('文字中有相关线索')}</small>
                                ),
                              )}
                            </legend>
                            <p>{t(x.example)}</p>
                            <RadioGroup
                              aria-label={t(x.title)}
                              value={answers[x.id] || ''}
                              onValueChange={(v) =>
                                setAnswers((a) => ({
                                  ...a,
                                  [x.id]: v as Answer,
                                }))
                              }
                              className="founder-answer-options"
                            >
                              {t(
                                [
                                  ['yes', '有这类经历'],
                                  ['unsure', '不确定'],
                                  ['no', '暂时没有'],
                                ].map(([v, label]) => (
                                  <label
                                    key={v}
                                    data-selected={answers[x.id] === v}
                                  >
                                    <RadioGroupItem
                                      value={v}
                                      aria-label={t(label)}
                                    />
                                    {t(label)}
                                  </label>
                                )),
                              )}
                            </RadioGroup>
                            <details>
                              <summary>
                                {t('后面会看什么？')}
                                <ChevronDown size={13} />
                              </summary>
                              <p>{t(x.next)}</p>
                              <p>
                                {t(
                                  CRITERIA.find((c) => c.id === x.id)?.caution,
                                )}
                              </p>
                            </details>
                          </fieldset>
                        )),
                      )}
                    </div>
                    <div className="founder-assessment-submit">
                      <p>
                        {t(
                          !timing
                            ? '请先选择期望多久获得申请结果。'
                            : answered
                              ? f(
                                  '已回答 {0} / 8 类经历，其余可以稍后再看。',
                                  answered,
                                )
                              : '至少选择一项，就可以看看下一步。',
                        )}
                      </p>
                      <Button
                        size="lg"
                        disabled={!answered || !timing || busy}
                        onClick={() => go('result', true)}
                      >
                        {t('看看接下来怎么准备')}
                        <ArrowRight />
                      </Button>
                    </div>
                  </div>
                  <aside className="founder-assessment-aside">
                    <span className="founder-overline">
                      {t('这一轮，你会得到')}
                    </span>
                    <h2>{t('一份继续探索的起点。')}</h2>
                    <ul>
                      <li>{t('哪些经历值得找材料')}</li>
                      <li>{t('每条线索下一步要找什么')}</li>
                      <li>{t('公司与赴美计划还缺哪些信息')}</li>
                    </ul>
                    <div>
                      <LockKeyhole size={17} />
                      <p>
                        {t(
                          '本轮回答会尝试暂存在这台设备的浏览器中。长期保存需要登录；共享设备请下载后清除浏览器数据。',
                        )}
                      </p>
                    </div>
                    <p className="founder-micro">
                      {t('暂时不需要：护照、出生日期、家庭地址、公司税号。')}
                    </p>
                  </aside>
                </div>
              </>
            ),
          )}
        {stage === 'result' && restoring && (
          <section className="founder-empty-result" role="status">
            <h1>{t('评估结果', 'Assessment results')}</h1>
            <p>
              {t('正在读取已保存的评估…', 'Loading your saved assessment…')}
            </p>
          </section>
        )}
        {t(
          stage === 'result' && !hasAssessmentResult && !restoring && (
            <section className="founder-empty-result">
              <h1>{t('评估结果', 'Assessment results')}</h1>
              <p>
                {t(
                  '这一步需要前面的三问。回到初步评估后，系统会带你从第一处未完成的回答继续。',
                  'This step needs the three earlier answers. Return to the assessment and continue from the first unanswered question.',
                )}
              </p>
              <Button
                onClick={() => {
                  setAssessmentStep(
                    !currentWork.trim()
                      ? 1
                      : !standoutStory.trim() && !sourceText.trim() && !answered
                        ? 2
                        : 3,
                  );
                  go('assessment');
                }}
              >
                {t('开始初步评估', 'Start initial assessment')}
              </Button>
              {t(projectsError && <p role="alert">{t(projectsError)}</p>)}
            </section>
          ),
        )}
        {t(
          stage === 'result' && hasAssessmentResult && !restoring && (
            <>
              <section className="founder-page-heading">
                <p className="founder-eyebrow">
                  {t('看看你手上有什么', 'See what you already have')}
                </p>
                <h1 ref={heading} tabIndex={-1}>
                  {t(
                    primaryDirection
                      ? '这里有一条值得先核实的主线。'
                      : '先把这件事拆成角色、行动、结果和证明。',
                    primaryDirection
                      ? 'There is one promising direction to verify first.'
                      : 'Break this event into role, action, result and proof.',
                  )}
                </h1>
                <p className="founder-lead">
                  {t(
                    '下面不是分数，而是把你的回答转成可以继续查证的方向、材料和下一步。',
                    'This is not a score. It turns your answer into a direction, supporting records and a practical next step.',
                  )}
                </p>
                <div className="founder-actions">
                  <Button variant="outline" onClick={() => go('assessment')}>
                    {t('返回修改')}
                  </Button>
                  <Button variant="ghost" onClick={downloadSnapshot}>
                    <Download />
                    {t('下载当前结果摘要', 'Download current result summary')}
                  </Button>
                </div>
                <p className="founder-micro">
                  {t(
                    '当前结果摘要可直接下载，无需留下信息；完整报告在页面下方保存后获取。',
                    'Download this short summary without sharing any information. Save below to get the full report.',
                  )}
                </p>
              </section>
              <section className="assessment-synthesis">
                <div>
                  <span>
                    {t(
                      'USCOO 从本次回答中提炼到',
                      'What USCOO surfaced from this answer',
                    )}
                  </span>
                  <h2>
                    {primaryDirection
                      ? t(
                          `你的价值可能不只在“参与过”，而在你亲自推动结果发生；这更接近“${primaryDirection.title}”方向。`,
                          `Your value may lie not merely in participating, but in personally causing the outcome—closest to the “${primaryDirection.term}” direction.`,
                        )
                      : t(
                          '这段经历的关键不在头衔，而在你做了哪个别人没有替你做的决定。',
                          'The key is not your title, but the decision you made that no one else made for you.',
                        )}
                  </h2>
                  <p>
                    {t(
                      '这是从你的用词和点选中形成的工作假设。下一步要用日期、原始记录和第三方信息把它核实。',
                      'This is a working hypothesis based on your wording and selections. Dates, source records and third-party support are the next verification step.',
                    )}
                  </p>
                </div>
                <aside>
                  <strong>
                    {t('先找这三样', 'Find these three things first')}
                  </strong>
                  <ol>
                    <li>
                      {t(
                        '当时你做决定或承担职责的记录',
                        'A record of your decision or responsibility',
                      )}
                    </li>
                    <li>
                      {t(
                        '结果发生前后的数字、日期或可核对事实',
                        'Before-and-after numbers, dates or verifiable facts',
                      )}
                    </li>
                    <li>
                      {t(
                        '能说明你本人作用的独立来源或知情人',
                        'An independent source or knowledgeable person who can verify your role',
                      )}
                    </li>
                  </ol>
                </aside>
              </section>
              <div className="result-plan-summary">
                <strong>{t('你的赴美时间目标', 'Your U.S. timeline')}</strong>
                <p>
                  {t('希望获批', 'Target approval')}:{' '}
                  {t(
                    intent.desiredApproval ||
                      (timing
                        ? t(TIMING_LABEL[timing])
                        : t('待确定', 'Not set')),
                  )}{' '}
                  · {t('预计赴美', 'Target arrival')}:{' '}
                  {t(intent.arrivalDate || t('待确定', 'Not set'))} ·{' '}
                  {t('希望开始工作', 'Target work start')}:{' '}
                  {t(intent.workStartDate || t('待确定', 'Not set'))}
                </p>
                <p>
                  {t(
                    intent.workPlan ||
                      t(
                        '下一步补充你将在美国实际负责的业务、职责和第一年目标。',
                        'Next, add the business, responsibilities and first-year outcomes you will personally own in the United States.',
                      ),
                  )}
                </p>
                <small>
                  {t(
                    '以上是你的计划日期，不是获批或入境承诺。',
                    'These are your planning dates, not promises of approval or admission.',
                  )}
                </small>
              </div>
              <section className="founder-result-summary">
                <div>
                  <span className="founder-overline">{t('个人经历')}</span>
                  <h2>
                    {t(
                      resultDirections.length
                        ? language === 'en'
                          ? `${resultDirections.length} directions worth verifying first`
                          : `有 ${resultDirections.length} 个方向值得先核实`
                        : hasNarrative
                          ? t(
                              '已有一段代表经历，先拆解事实与证明',
                              'One defining achievement is ready to break into facts and proof',
                            )
                          : t(
                              '还没有明确的经历线索',
                              'No clear experience leads yet',
                            ),
                    )}
                  </h2>
                  <p>
                    {t(
                      resultDirections.length
                        ? resultDirections
                            .map((x) =>
                              t(CRITERIA.find((c) => c.id === x.id)?.title),
                            )
                            .join(language === 'en' ? ', ' : '、')
                        : hasNarrative
                          ? t(
                              '这段经历已经进入梳理。下一步补齐你的具体行动、结果数字、时间和可核对来源，再判断它最接近哪项标准。',
                              'This achievement is now in the review path. Add your specific actions, outcome metrics, dates and verifiable sources before mapping it to a criterion.',
                            )
                          : t(
                              '可以回到简历里找一件做成的事，从职责、成果和他人评价开始。',
                              'Return to your resume and find one completed achievement, starting with your role, outcome and outside recognition.',
                            ),
                    )}
                    {t(
                      unsure.length
                        ? f('；另有 {0} 类你还不确定。', unsure.length)
                        : '',
                    )}
                  </p>
                  <small>
                    {t(
                      '正式预审会逐份核对来源、内容和你的个人作用。',
                      'Formal pre-review checks each source, its content, and your personal contribution.',
                    )}
                  </small>
                </div>
                <div>
                  <span className="founder-overline">{t('赴美工作')}</span>
                  <h2>{t(COMPANY_LABEL[company])}</h2>
                  <p>
                    {t(
                      company === 'existing'
                        ? '接下来确认公司作为申请人的安排、真实工作内容和签字权限。已有公司不代表此部分已完成。'
                        : '先想清楚赴美继续做什么，再核实适用的申请主体。当前不必为了完成评估就注册公司。',
                    )}
                  </p>
                  <small>{timing ? t(TIMING_LABEL[timing]) : ''}</small>
                </div>
              </section>
              <section className="founder-section">
                <div className="founder-section-heading">
                  <div>
                    <p className="founder-eyebrow">
                      {t('现在就能补上的几件事', 'What you can add right now')}
                    </p>
                    <h2>
                      {t(
                        leads.length
                          ? '每一条线索，对应一件具体的事。'
                          : hasNarrative
                            ? '先把这段经历补成一份可核对的记录。'
                            : '先找一份简历、一段经历或一条第三方记录。',
                      )}
                    </h2>
                  </div>
                </div>
                <div className="founder-result-lines">
                  {t(
                    resultDirections.map((x) => (
                      <article key={x.id}>
                        <div>
                          <span
                            className={`founder-chip ${answers[x.id] === 'unsure' ? 'uncertain' : ''}`}
                          >
                            {answers[x.id]
                              ? t(STATUS[answers[x.id]!])
                              : t(
                                  '系统建议先核实',
                                  'Suggested for verification',
                                )}
                          </span>
                          <h3>
                            {t(CRITERIA.find((c) => c.id === x.id)?.title)}
                          </h3>
                        </div>
                        <p>{t(x.next)}</p>
                        <details>
                          <summary>
                            {t('为什么需要进一步核实？')}
                            <ChevronDown size={13} />
                          </summary>
                          <p>
                            {t(CRITERIA.find((c) => c.id === x.id)?.caution)}
                          </p>
                        </details>
                      </article>
                    )),
                  )}
                  {t(
                    !resultDirections.length && (
                      <div className="founder-inline-empty">
                        <BookOpen size={24} />
                        <p>
                          {t(
                            hasNarrative
                              ? t(
                                  '你已经提供了一段经历。先找到当时的邮件、合同、数据、公开报道或知情人，把“我做了什么”和“产生了什么结果”分别证明清楚。',
                                  'You have already provided an achievement. Find the emails, contracts, data, public coverage or knowledgeable people that separately support what you did and what changed.',
                                )
                              : t(
                                  '这一轮没有提到相关经历，不等于不符合资格。若你有其他特殊成就，可以先整理原始记录，再请专业人士判断是否适用。',
                                  'No relevant experience was reported this time; that is not an ineligibility finding. Document any other exceptional achievements and discuss their relevance with a qualified professional.',
                                ),
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
                <details className="founder-extra">
                  <summary>
                    {t('查看全部八类记录，包括跳过的内容')}
                    <ChevronDown size={16} />
                  </summary>
                  <dl className="founder-all-results">
                    {t(
                      CRITERIA.map((c) => (
                        <div key={c.id}>
                          <dt>{t(c.title)}</dt>
                          <dd>
                            {t(
                              answers[c.id] ? STATUS[answers[c.id]!] : '未回答',
                            )}
                          </dd>
                        </div>
                      )),
                    )}
                  </dl>
                </details>
              </section>
              <section className="founder-section">
                <h2>{t('当前准备程度', 'Current preparation readiness')}</h2>
                <p>
                  {t(
                    '当前已经找到值得核实的方向。下一步先补现有证明、申请公司安排和赴美工作计划，再按标准逐项预审。',
                    'You now have directions worth verifying. Next, add existing supporting records, the petitioning arrangement and your U.S. work plan, then review each against the applicable standard.',
                  )}
                </p>
              </section>
              <FeeCalculator />
              <section className="founder-save">
                <div>
                  <p className="founder-eyebrow">
                    {t(
                      '下一步：找出还差什么',
                      'Next: see what is still missing',
                    )}
                  </p>
                  <h2>
                    {t(
                      '保存这次结果，获取完整报告并查看材料缺口。',
                      'Save this result, get the full report and see evidence gaps.',
                    )}
                  </h2>
                  <p>
                    {t(
                      '未登录用户只需留下姓名或称呼与邮箱即可获取完整报告；登录用户可继续保存长期进度并进入材料预审清单。',
                      'Guests only need a name and email to get the full report. Signed-in users can also save long-term progress and open the document pre-review checklist.',
                    )}
                  </p>
                  <ul>
                    <li>
                      {t(
                        '保存本次点选、计划，以及页面中保留的经历文字和链接。',
                      )}
                    </li>
                    <li>
                      {t(
                        '导入文字仍是待核实材料；原始文件需要在准备阶段另行上传。',
                      )}
                    </li>
                    <li>
                      {t(
                        '如果选择律所协作，可预览、下载或按章节分享律师沟通包；系统不会自动联系或聘请律师。',
                        'If you choose a law firm, you can preview, download, or share selected sections of the counsel brief. USCOO does not automatically contact or retain a lawyer.',
                      )}
                    </li>
                  </ul>
                  {t(
                    error && (
                      <p className="founder-error" role="alert">
                        {t(error)}
                      </p>
                    ),
                  )}
                  <div className="founder-actions">
                    <Button size="lg" disabled={busy} onClick={openSave}>
                      {signedIn
                        ? t('保存并查看材料缺口', 'Save and see evidence gaps')
                        : t(
                            '保存结果并获取完整报告',
                            'Save and get the full report',
                          )}
                      <ArrowRight />
                    </Button>
                  </div>
                  <p className="founder-micro">
                    {t(
                      '上方免费摘要只保留本页结论；完整报告会逐项整理八项标准的线索、待确认事项和材料建议。',
                      'The free summary above keeps only this page’s conclusions. The full report covers all eight criteria, open questions and evidence suggestions.',
                    )}
                  </p>
                </div>
              </section>
            </>
          ),
        )}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent className="save-project-dialog">
            <DialogHeader>
              <DialogTitle>
                {signedIn
                  ? t('保存为你的申请项目', 'Save as your application project')
                  : t('保存结果并继续', 'Save your result and continue')}
              </DialogTitle>
              <DialogDescription>
                {signedIn
                  ? t(
                      '先给这份申请一个能认出来的名字。姓名和公司名称会进入私有档案，不影响刚才的初步结果。',
                      'Give this case a recognizable name. Your name and company name go into the private record and do not change the assessment you just saw.',
                    )
                  : t(
                      '你可以留下邮箱获取完整报告，也可以使用 ChatGPT 登录后保存长期进度。',
                      'Leave your email to get the full report, or sign in with ChatGPT to save long-term progress.',
                    )}
              </DialogDescription>
            </DialogHeader>
            {signedIn && (
              <div className="save-project-fields">
                <label>
                  {t('项目名称', 'Project name')}
                  <Input
                    autoFocus
                    value={projectTitle}
                    maxLength={120}
                    onChange={(event) => {
                      setProjectTitle(event.target.value);
                      setForceNewProject(false);
                    }}
                  />
                </label>
                <label>
                  {t('你的姓名', 'Your name')}
                  <Input
                    value={beneficiaryName}
                    maxLength={200}
                    onChange={(event) => setBeneficiaryName(event.target.value)}
                    placeholder={t(
                      '用于你的私有申请档案',
                      'For your private application record',
                    )}
                  />
                </label>
                <label>
                  {t(
                    '申请公司或代理人名称',
                    'Petitioning company or agent name',
                  )}
                  <Input
                    value={petitionerName}
                    maxLength={200}
                    onChange={(event) => setPetitionerName(event.target.value)}
                    placeholder={t(
                      '尚未确定可先留空',
                      'Leave blank if not yet decided',
                    )}
                  />
                  <small>
                    {t(
                      '律师会把提出 I-129 的主体称为 Petitioner。',
                      'Counsel may call the entity filing Form I-129 the petitioner.',
                    )}
                  </small>
                </label>
              </div>
            )}
            {signedIn && (
              <label className="founder-consent">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                />
                <span>
                  {t(
                    '我愿意把以上内容保存到自己的私有项目。',
                    'I want to save this information in my private project.',
                  )}
                </span>
              </label>
            )}

            {duplicateProject && !forceNewProject && (
              <div className="duplicate-project-choice" role="alert">
                <strong>
                  {t(
                    '发现一份同名项目',
                    'A project with this name already exists',
                  )}
                </strong>
                <p>
                  {t(
                    '你可以接着上次那份继续，也可以明确新建一份独立项目。',
                    'Continue the existing case or explicitly create a separate one.',
                  )}
                </p>
                <div className="founder-actions">
                  <Button
                    onClick={() =>
                      window.location.assign(
                        `/pre-review?project=${encodeURIComponent(duplicateProject.id)}`,
                      )
                    }
                  >
                    {t('接着上次那份', 'Continue existing')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setForceNewProject(true)}
                  >
                    {t('新建一份', 'Create a new one')}
                  </Button>
                </div>
              </div>
            )}

            {!signedIn ? (
              <div className="lead-save-options">
                {leadSaved ? (
                  <div className="lead-save-success" role="status">
                    <Check size={22} />
                    <div>
                      <strong>
                        {t(
                          '评估与联系方式已保存',
                          'Assessment and contact details saved',
                        )}
                      </strong>
                      <p>
                        {leadEmailStatus === 'accepted'
                          ? t(
                              '报告已交给邮件服务发送，请查看收件箱与垃圾邮件。若未收到，可直接下载。',
                              'Your report was accepted by the email service. Check your inbox and spam folder, or download it below.',
                            )
                          : t(
                              '报告邮件尚未确认发出。请先下载保存；你的评估记录已保留，无需重复提交邮箱。',
                              'The report email is not confirmed as sent. Download it now; your assessment is saved and you do not need to submit your email again.',
                            )}
                      </p>
                      <Button variant="outline" onClick={downloadFullReport}>
                        {t(
                          '下载完整评估报告',
                          'Download full assessment report',
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <section className="lead-email-form">
                    <div>
                      <strong>
                        {t(
                          '暂时不登录？留下邮箱并获取完整报告',
                          'Not ready to sign in? Get the full report with your email',
                        )}
                      </strong>
                      <p>
                        {t(
                          '保存后可立即下载报告，并尝试发送至邮箱；页面会显示邮件发送状态。',
                          'Save and download your report immediately. We will also attempt email delivery and show its status.',
                        )}
                      </p>
                    </div>
                    {emailAvailable === false && (
                      <p role="status">
                        {t(
                          '自动邮件暂未启用，本次可立即下载报告。留下邮箱后，记录会保留供后续服务跟进。',
                          'Automatic email is not yet enabled. Download your report now; your email and assessment remain available for service follow-up.',
                        )}
                      </p>
                    )}
                    <div className="save-project-fields">
                      <label>
                        {t('姓名或称呼（必填）', 'Name (required)')}
                        <Input
                          required
                          value={leadName}
                          maxLength={200}
                          onChange={(e) => setLeadName(e.target.value)}
                        />
                      </label>
                      <label>
                        {t('邮箱（必填）', 'Email (required)')}
                        <Input
                          type="email"
                          autoComplete="email"
                          onBlur={() => setLeadEmailTouched(true)}
                          aria-invalid={leadEmailTouched && !leadEmailValid}
                          required
                          value={leadEmail}
                          maxLength={320}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="name@example.com"
                        />
                        {leadEmailTouched && !leadEmailValid && (
                          <small role="alert">
                            {t(
                              '请输入有效邮箱，例如 name@example.com。',
                              'Enter a valid email, such as name@example.com.',
                            )}
                          </small>
                        )}
                      </label>
                    </div>
                    <details className="term-guide">
                      <summary>
                        {t(
                          '补充联系方式与使用意愿（选填）',
                          'Contact preferences and interest (optional)',
                        )}
                      </summary>
                      <div className="save-project-fields">
                        <label>
                          {t('微信号（选填）', 'WeChat ID (optional)')}
                          <Input
                            value={leadWechat}
                            maxLength={120}
                            onChange={(e) => setLeadWechat(e.target.value)}
                          />
                        </label>
                        <label>
                          {t(
                            '你是否有可用的 ChatGPT 账号？',
                            'Do you have a ChatGPT account you can use?',
                          )}
                          <Choice
                            value={leadHasChatgpt}
                            onChange={(value) =>
                              setLeadHasChatgpt(value as typeof leadHasChatgpt)
                            }
                            options={[
                              ['yes', t('有', 'Yes')],
                              ['no', t('没有', 'No')],
                              ['unknown', t('不确定', 'Not sure')],
                            ]}
                          />
                        </label>
                      </div>
                      <label className="founder-consent">
                        <Checkbox
                          checked={leadInterview}
                          onCheckedChange={(value) =>
                            setLeadInterview(value === true)
                          }
                        />
                        <span>
                          {t(
                            '我愿意参加一次 15 分钟用户访谈（选填）',
                            'I am open to a 15-minute user interview (optional)',
                          )}
                        </span>
                      </label>
                    </details>
                    {error && (
                      <p className="founder-error" role="alert">
                        {t(error)}
                      </p>
                    )}
                    <Button
                      size="lg"
                      disabled={busy || !leadNameValid || !leadEmailValid}
                      onClick={saveEmailLead}
                    >
                      {busy
                        ? t('正在保存…', 'Saving…')
                        : t('保存并获取完整报告', 'Save and get full report')}
                      <Download size={16} />
                    </Button>
                    <p className="founder-micro">
                      {t(
                        '提交即表示你同意 USCOO 按隐私政策保存本次评估和联系方式，用于提供报告和处理本次服务请求。',
                        'By submitting, you agree that USCOO may store this assessment and contact information under its Privacy Policy to provide the report and handle this service request.',
                      )}
                    </p>
                  </section>
                )}
                <div className="save-access-step">
                  <UserRound size={20} />
                  <div>
                    <strong>
                      {t(
                        '使用 ChatGPT 登录并继续工作台',
                        'Sign in with ChatGPT and continue to the workspace',
                      )}
                    </strong>
                    <p>
                      {t(
                        '适合已有可用 ChatGPT 账号的用户。登录后可保存长期进度；邀请码在进入核心工作台时验证。',
                        'For users with an available ChatGPT account. Sign in to save long-term progress; the invitation code is checked when opening the core workspace.',
                      )}
                    </p>
                  </div>
                  <a
                    className="founder-button"
                    href={`/signin-with-chatgpt?return_to=${encodeURIComponent('/beta?view=result&save=1')}`}
                    target="_top"
                  >
                    {t('登录并继续', 'Sign in & continue')}
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            ) : accountStatus === 'unknown' ? (
              <p role="status">
                {t('正在确认保存权限…', 'Checking save access…')}
              </p>
            ) : (
              <>
                {accountStatus === 'pending' && (
                  <div className="save-access-step invite-save-step">
                    <KeyRound size={20} />
                    <div>
                      <strong>
                        {t(
                          '输入邀请码，开通这份私有工作区',
                          'Enter an invitation code to open this private workspace',
                        )}
                      </strong>
                      <p>
                        {t(
                          '你已经看过初步结果。邀请码只验证一次，之后可持续保存材料与进度。',
                          'You have reviewed the initial result. The invite is verified once, then this account can keep saving records and progress.',
                        )}
                      </p>
                    </div>
                    <Input
                      value={inviteCode}
                      onChange={(event) =>
                        setInviteCode(event.target.value.toUpperCase())
                      }
                      placeholder={t('邀请码', 'Invitation code')}
                      aria-label={t('邀请码', 'Invitation code')}
                    />
                  </div>
                )}
                {error && (
                  <p className="founder-error" role="alert">
                    {t(error)}
                  </p>
                )}
                {(!duplicateProject || forceNewProject) && (
                  <Button
                    size="lg"
                    disabled={
                      !consent ||
                      busy ||
                      !projectTitle.trim() ||
                      (accountStatus === 'pending' && !inviteCode.trim())
                    }
                    onClick={() => begin('pre-review')}
                  >
                    {busy
                      ? t('正在保存…', 'Saving…')
                      : t(
                          '保存并查看材料清单',
                          'Save & open document checklist',
                        )}
                    <ArrowRight />
                  </Button>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
        <footer className="founder-footer">
          <span>{t('USCOO \u00B7 创业者的 O-1A 准备助手')}</span>
          <p>
            {t(
              '帮助理解路径、整理事实和准备资料。个案资格与申请策略需结合完整证据判断。',
            )}
          </p>
          <PolicyLink />
        </footer>
      </main>
    </div>
  );
}
