'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  LockKeyhole,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  APPLICATION_PATH_LABEL,
  COMPANY_LABEL,
  EXPERIENCE,
  TIMING_LABEL,
  type Signals,
} from '@/lib/founder-intake';
import { Choice } from './case-editor';
import type { Intent } from './intent-form';
import { useI18n, useDraftStorageStatus } from './language';

type Method = 'choices' | 'resume' | 'linkedin';

export default function AssessmentConversation({
  step,
  setStep,
  currentWork,
  setCurrentWork,
  standoutStory,
  setStandoutStory,
  method,
  setMethod,
  answers,
  setAnswers,
  sourceText,
  setSourceText,
  linkedin,
  setLinkedin,
  timing,
  setTiming,
  company,
  setCompany,
  intent,
  setIntent,
  applicationPath,
  setApplicationPath,
  busy,
  error,
  setError,
  fileNote,
  fileInput,
  loadFile,
  onFinish,
}: {
  step: number;
  setStep: (value: SetStateAction<number>) => void;
  currentWork: string;
  setCurrentWork: (value: SetStateAction<string>) => void;
  standoutStory: string;
  setStandoutStory: (value: SetStateAction<string>) => void;
  method: Method;
  setMethod: Dispatch<SetStateAction<Method>>;
  answers: Signals;
  setAnswers: (value: SetStateAction<Signals>) => void;
  sourceText: string;
  setSourceText: (value: SetStateAction<string>) => void;
  linkedin: string;
  setLinkedin: (value: SetStateAction<string>) => void;
  timing: keyof typeof TIMING_LABEL | '';
  setTiming: (value: SetStateAction<keyof typeof TIMING_LABEL | ''>) => void;
  company: keyof typeof COMPANY_LABEL;
  setCompany: (value: SetStateAction<keyof typeof COMPANY_LABEL>) => void;
  intent: Intent;
  setIntent: (value: SetStateAction<Intent>) => void;
  applicationPath: keyof typeof APPLICATION_PATH_LABEL;
  setApplicationPath: (
    value: SetStateAction<keyof typeof APPLICATION_PATH_LABEL>,
  ) => void;
  busy: boolean;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  fileNote: string;
  fileInput: RefObject<HTMLInputElement | null>;
  loadFile: (file?: File) => void;
  onFinish: () => void;
}) {
  const { t } = useI18n();
  const storageStatus = useDraftStorageStatus();
  const answered = Object.keys(answers).length;
  const next = (number: number) => {
    setError('');
    setStep(number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="founder-page-heading assessment-heading">
        <p className="founder-eyebrow">{t('初步评估', 'Initial assessment')}</p>
        <h1>
          {t(
            '不用填一张长表。我们一次只聊一件事。',
            'No long form. We will take one question at a time.',
          )}
        </h1>
        <p className="founder-lead">
          {t(
            '先说明你的申请目标，再讲正在做的工作和一件最能代表你的经历。三步之后，你会看到基于本次回答的具体整理结果。',
            'Start with your application goals, then your current work and one defining achievement. After three steps, you will see a concrete synthesis of your answers.',
          )}
        </p>
      </section>
      {(storageStatus === 'session' || storageStatus === 'memory') && (
        <p className="assessment-storage-warning" role="alert">
          {storageStatus === 'session'
            ? t(
                '草稿仅保存在当前标签页，关闭前请下载结果。',
                'Draft saved only in this tab. Download the result before closing it.',
              )
            : t(
                '浏览器无法暂存草稿，请保持本页打开并在完成后下载。',
                'Browser storage is unavailable. Keep this page open and download your result when finished.',
              )}
        </p>
      )}
      <nav
        className="assessment-stepper"
        aria-label={t('评估进度', 'Assessment progress')}
      >
        {[1, 2, 3].map((number) => (
          <button
            type="button"
            key={number}
            data-state={
              step === number ? 'current' : step > number ? 'done' : 'later'
            }
            onClick={() => number < step && next(number)}
            aria-current={step === number ? 'step' : undefined}
          >
            <span>{step > number ? <Check size={15} /> : number}</span>
            {number === 1
              ? t('你的申请目标', 'Your application goals')
              : number === 2
                ? t('现在在做什么', 'Your work now')
                : t('一件杰出经历', 'One defining achievement')}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <section
          className="assessment-question-card"
          data-invalid={Boolean(error)}
        >
          <span className="assessment-question-number">01</span>
          <p className="founder-eyebrow">
            {t('先了解你的实际需求', 'Start with your practical needs')}
          </p>
          <h2>
            {t(
              '你希望什么时候开始，又准备怎样申请？',
              'When do you want to begin, and how are you considering applying?',
            )}
          </h2>
          <p>
            {t(
              '这四项都是准备顺序的重要依据，不用于直接判断你能否获批。',
              'These four answers help sequence your preparation. They do not determine eligibility or predict approval.',
            )}
          </p>
          <div className="assessment-plan-grid">
            <label>
              {t('当前所在国家或地区', 'Current country or region')}
              <Choice
                value={intent.location}
                onChange={(value) => {
                  setIntent({
                    ...intent,
                    location: value as Intent['location'],
                  });
                  setError('');
                }}
                options={[
                  ['CN', t('中国大陆', 'Mainland China')],
                  ['US', t('美国', 'United States')],
                  ['other', t('其他国家或地区', 'Another country or region')],
                ]}
              />
            </label>
            <label>
              {t('期望多久获得申请结果', 'Expected petition decision window')}
              <Choice
                value={timing}
                onChange={(value) => {
                  setTiming(value as keyof typeof TIMING_LABEL);
                  setError('');
                }}
                options={Object.entries(TIMING_LABEL).map(([id, label]) => [
                  id,
                  t(label),
                ])}
              />
            </label>
            <label>
              {t(
                '你现在有可以提出申请的美国公司吗？',
                'Do you currently have a U.S. company that may file the petition?',
              )}
              <Choice
                value={company}
                onChange={(value) => {
                  setCompany(value as keyof typeof COMPANY_LABEL);
                  setError('');
                }}
                options={Object.entries(COMPANY_LABEL).map(([id, label]) => [
                  id,
                  t(label),
                ])}
              />
            </label>
            <label>
              {t(
                '你目前倾向哪种申请方式？',
                'Which application route are you considering?',
              )}
              <Choice
                value={applicationPath}
                onChange={(value) => {
                  setApplicationPath(
                    value as keyof typeof APPLICATION_PATH_LABEL,
                  );
                  setError('');
                }}
                options={Object.entries(APPLICATION_PATH_LABEL).map(
                  ([id, label]) => [id, t(label)],
                )}
              />
            </label>
          </div>
          {error && (
            <p className="founder-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="assessment-actions">
            <a href="/beta">{t('返回了解项目', 'Back to About O-1A')}</a>
            <Button
              onClick={() =>
                intent.location !== 'unknown' && timing
                  ? next(2)
                  : setError('请选择当前所在地和期望获得申请结果的时间。')
              }
            >
              {t('继续', 'Continue')}
              <ArrowRight />
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section
          className="assessment-question-card"
          data-invalid={Boolean(error)}
        >
          <span className="assessment-question-number">02</span>
          <p className="founder-eyebrow">
            {t('说说你现在的工作', 'Tell us about your work today')}
          </p>
          <h2>
            {t(
              '用一两句话说说，你现在在做什么？',
              'In one or two sentences, what are you working on now?',
            )}
          </h2>
          <p>
            {t(
              '说行业、产品、你的角色和服务对象就够了。不需要法律术语。',
              'Your field, product, role and customers are enough. No legal vocabulary needed.',
            )}
          </p>
          <Textarea
            autoFocus
            rows={5}
            maxLength={2000}
            value={currentWork}
            onChange={(event) => {
              setCurrentWork(event.target.value);
              setError('');
            }}
            placeholder={t(
              '例如：我在做一款面向跨境电商公司的风控软件，负责产品方向和主要客户。',
              'For example: I build risk software for cross-border merchants and lead product direction and key accounts.',
            )}
          />
          <p className="founder-micro">
            {t('一两句话即可。', 'One or two sentences are enough.')}{' '}
            {currentWork.length}/2000
          </p>
          {error && (
            <p className="founder-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="assessment-actions">
            <Button variant="ghost" onClick={() => next(1)}>
              {t('上一步', 'Back')}
            </Button>
            <Button
              onClick={() =>
                currentWork.trim()
                  ? next(3)
                  : setError('先用一两句话说说你现在在做什么。')
              }
            >
              {t('继续', 'Continue')}
              <ArrowRight />
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section
          className="assessment-question-card"
          data-invalid={Boolean(error)}
        >
          <span className="assessment-question-number">03</span>
          <p className="founder-eyebrow">
            {t('从一件具体的事开始', 'Start with one concrete event')}
          </p>
          <h2>
            {t(
              '哪一段是你最有把握说“这是我做成的”？',
              'Which achievement makes you most confident saying, “I made this happen”?',
            )}
          </h2>
          <p>
            {t(
              '说清当时的问题、你亲自做的决定、结果，以及谁或什么记录能证明。',
              'Describe the problem, the decision you personally made, the result, and who or what record can verify it.',
            )}
          </p>
          <div className="story-starters">
            <p>
              {t(
                '选一个方向，照着提示写。括号留给你的真实事实；没有精确数字也可以先描述变化。',
                'Choose a starting point. Replace the brackets with your own facts; describe the change if you do not have exact numbers.',
              )}
            </p>
            {[
              [
                '产品与技术',
                'Product or technology',
                '我在【公司/项目】负责【工作】。我亲自【行动】；成果被【客户/用户】采用，带来【变化】。可核对的记录是【链接/合同/数据】。',
                'At [company/project], I was responsible for [work]. I personally [action]. [Customers/users] adopted it, resulting in [change]. [Links/contracts/data] can verify this.',
              ],
              [
                '业务与融资',
                'Business or funding',
                '我在【公司】负责【职责】，亲自推动【关键行动】，取得【业务/融资结果】。我与团队的贡献分别是【说明】，可提供【记录】。',
                'At [company], I led [responsibility] and personally drove [action], achieving [business/funding result]. My contribution versus the team was [detail], supported by [records].',
              ],
              [
                '报道与奖项',
                'Coverage or awards',
                '【媒体/机构】在【时间】报道/认可了我的【工作】。我的具体贡献是【事实】，可通过【原文/名单/评选规则】核对。',
                '[Outlet/organization] covered or recognized my [work] in [date]. My specific contribution was [fact], verifiable through [article/list/selection rules].',
              ],
              [
                '评审与专业影响',
                'Reviewing or professional impact',
                '我受【机构】邀请评审【他人工作】，实际完成了【任务】。邀请、评审记录和结果可由【材料】证明。',
                '[Organization] invited me to review [others’ work]. I completed [task]. [Records] document the invitation, completed reviews and outcomes.',
              ],
            ].map(([zh, en, draftZh, draftEn]) => (
              <Button
                key={en}
                type="button"
                variant="outline"
                onClick={() => {
                  setStandoutStory((old) =>
                    (old
                      ? old + '\n\n' + t(draftZh, draftEn)
                      : t(draftZh, draftEn)
                    ).slice(0, 5000),
                  );
                  setError('');
                }}
              >
                {t(zh, en)}
              </Button>
            ))}
            <small>
              {t(
                '写作提示不代表满足审核标准；融资、用户数或奖项仍需核实你的个人贡献和领域影响。',
                'These are writing prompts, not evidence of eligibility. Funding, user counts and awards still need verification of your contribution and field impact.',
              )}
            </small>
          </div>
          <Textarea
            rows={6}
            maxLength={5000}
            value={standoutStory}
            onChange={(event) => {
              setStandoutStory(event.target.value);
              setError('');
            }}
            placeholder={t(
              '例如：客户流失上升时，我决定重做定价和交付方式，六个月内续费率提升到……当时的董事会记录和客户邮件可以证明。',
              'For example: when churn rose, I changed pricing and delivery. Retention reached … within six months. Board records and customer emails can verify it.',
            )}
          />
          <p className="founder-micro">
            {t(
              '建议先写 100–300 字；也可只点选下方经历继续。',
              'Start with 3–5 sentences, or choose experience types below to continue.',
            )}{' '}
            {standoutStory.length}/5000
          </p>
          <div className="assessment-method-intro">
            <strong>
              {t(
                '也可以用现成资料开始',
                'Or start with material you already have',
              )}
            </strong>
            <p>
              {t(
                '直接讲、使用简历、使用 LinkedIn，是三种输入方式；内容最终会合并到同一个结果。',
                'Tell the story directly, use a resume, or use LinkedIn. All three feed the same result.',
              )}
            </p>
          </div>
          <Tabs
            value={method}
            onValueChange={(value) => {
              setMethod(value as Method);
              setError('');
            }}
          >
            <TabsList className="founder-input-tabs">
              <TabsTrigger value="choices">
                {t('按经历点选', 'Choose experience types')}
              </TabsTrigger>
              <TabsTrigger value="resume">
                {t('使用简历', 'Use a resume')}
              </TabsTrigger>
              <TabsTrigger value="linkedin">
                {t('使用 LinkedIn', 'Use LinkedIn')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="choices">
              <details
                className="assessment-experience-picker"
                open={!standoutStory.trim()}
              >
                <summary>
                  {t(
                    '不知怎么开口？从熟悉的经历中点选',
                    'Not sure what to say? Choose familiar experience types',
                  )}
                  <ChevronDown size={15} />
                </summary>
                <div className="assessment-choice-grid">
                  {EXPERIENCE.map((item) => (
                    <label
                      key={item.id}
                      data-selected={answers[item.id] === 'yes'}
                    >
                      <Checkbox
                        checked={answers[item.id] === 'yes'}
                        onCheckedChange={(checked) =>
                          setAnswers((old) => ({
                            ...old,
                            [item.id]: checked ? 'yes' : undefined,
                          }))
                        }
                      />
                      <span>
                        <strong>{t(item.title)}</strong>
                        <small>{t(item.example)}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            </TabsContent>
            <TabsContent value="resume">
              <div className="founder-import">
                <Upload size={24} />
                <h3>{t('上传或粘贴简历', 'Upload or paste a resume')}</h3>
                <p>
                  {t(
                    '支持 PDF、DOCX、TXT，最大 8 MB。你可以先检查提取出的文字。',
                    'PDF, DOCX and TXT are supported up to 8 MB. You can review the extracted text first.',
                  )}
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                >
                  {busy
                    ? t('正在读取…', 'Reading…')
                    : t('选择文件', 'Choose file')}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="linkedin">
              <div className="founder-import founder-linkedin">
                <h3>
                  {t('带入 LinkedIn 经历', 'Bring in your LinkedIn experience')}
                </h3>
                <Input
                  type="url"
                  value={linkedin}
                  onChange={(event) => setLinkedin(event.target.value)}
                  placeholder="https://www.linkedin.com/in/your-name"
                />
                <p>
                  {t(
                    '粘贴 About / Experience 内容，或上传导出的 PDF。系统不会登录你的 LinkedIn。',
                    'Paste your About / Experience text or upload an exported PDF. USCOO does not sign in to LinkedIn.',
                  )}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".pdf,.docx,.txt"
            aria-label={t('选择简历文件', 'Choose a resume file')}
            onChange={(event) => loadFile(event.target.files?.[0])}
          />
          {(method !== 'choices' || sourceText) && (
            <div className="founder-resume-text">
              <label htmlFor="resume-text">
                {t('导入的经历文字', 'Imported experience text')}
              </label>
              <Textarea
                id="resume-text"
                value={sourceText}
                maxLength={40000}
                rows={6}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={t(
                  '在这里粘贴简历或 LinkedIn 经历……',
                  'Paste resume or LinkedIn experience here…',
                )}
              />
              {fileNote && (
                <p role="status" className="founder-micro">
                  {t(fileNote)}
                </p>
              )}
              {sourceText && (
                <p className="founder-hints">
                  <BookOpen size={16} />
                  {t(
                    '这份文字已经带入。结果页会从具体事实和可证明材料开始。',
                    'This text is included. The result will start with concrete facts and supporting records.',
                  )}
                </p>
              )}
            </div>
          )}
          {error && (
            <p className="founder-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="assessment-actions">
            <Button variant="ghost" onClick={() => next(2)}>
              {t('上一步', 'Back')}
            </Button>
            <Button size="lg" disabled={busy} onClick={onFinish}>
              {t('看看我手上有什么', 'See what I have')}
              <ArrowRight />
            </Button>
          </div>
          <p className="founder-micro">
            <LockKeyhole size={14} />
            {t(
              '当前回答会留在这台设备上；只有你看到结果并主动保存时，才会创建私有项目。',
              'Your answers stay on this device. A private project is created only if you review the result and choose to save it.',
            )}
          </p>
        </section>
      )}
    </>
  );
}
