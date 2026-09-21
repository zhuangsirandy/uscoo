'use client';

import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarRange,
  FileCheck2,
  FileSearch,
  FolderKanban,
  Globe2,
  GraduationCap,
  Leaf,
  MessageCircleQuestion,
  RefreshCw,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { LanguageSwitch, useI18n } from './language';

export default function MarketingHome({
  signedIn,
}: {
  signedIn: boolean;
  userName: string;
}) {
  const { t } = useI18n();
  const painPoints = [
    [
      '成绩在国外，不知道怎么对上美国的尺子',
      '融资、客户、专利和媒体报道都是真实成绩，但还需要说明它们与哪项 USCIS 标准有关，以及你本人做了什么。',
      'Your achievements were built outside the U.S.',
      'Funding, customers, patents and press are real achievements, but each still needs a clear link to a USCIS criterion and to your own contribution.',
    ],
    [
      '觉得自己“没什么好写的”',
      '很多创始人会说“这是团队做的”或“我只是做了决定”。真正有分量的个人作用，往往就藏在这些细节里。',
      'You are not sure what is worth writing about',
      'Founders often say “the team did it” or “I only made the decision.” The strongest evidence of personal contribution is often hidden in those details.',
    ],
    [
      '还没有美国公司，不知道谁来申请',
      '公司怎么成立、谁有权签字、职位和工作如何安排，都会影响后面的材料。USCOO 帮你把这些问题按顺序理清。',
      'You do not yet have a U.S. company',
      'Formation, signing authority, role and proposed work all affect the petition. USCOO helps you resolve them in the right order.',
    ],
    [
      '自己准备怕漏，交给律所又难沟通',
      '无论自主申请还是委托律所，都需要一份清楚的事实记录、材料清单和进度安排，才能减少反复和遗漏。',
      'Self-filing feels risky; counsel handoff feels fragmented',
      'Both routes need a clear factual record, evidence list and timeline to reduce missed items and repeated explanations.',
    ],
  ];
  const journey = [
    ['01', '先看懂 O-1A 和完整流程', 'Understand O-1A and the full path'],
    [
      '02',
      '说说你正在做什么和一件代表经历',
      'Describe your work and one defining achievement',
    ],
    [
      '03',
      '看见值得继续核实的方向',
      'See which directions are worth verifying',
    ],
    [
      '04',
      '找到每个方向还需要的材料',
      'Find the records each direction still needs',
    ],
    ['05', '决定自主申请或委托律所', 'Choose self-filing or a law firm'],
    [
      '06',
      '公司和个人两边一起准备，组卷递交并跟进',
      'Prepare both sides, assemble, file and follow up',
    ],
  ];
  const capabilities = [
    {
      icon: MessageCircleQuestion,
      zhTitle: '提炼你的杰出能力',
      enTitle: 'Surface your strongest contributions',
      zh: '从一件具体的事开始追问：你做了什么决定、产生了什么结果、谁能证明。你只管回忆，系统帮你把重点找出来。',
      en: 'Start with one concrete event: what you decided, what changed, and who can verify it. You recall the facts; the system helps surface what matters.',
    },
    {
      icon: Globe2,
      zhTitle: '对标 USCIS 八项标准',
      enTitle: 'Map to the eight USCIS criteria',
      zh: '无论成绩在哪个国家做出，逐条看它能说明什么、还差哪份记录，并把公司成果与你的个人贡献分开。',
      en: 'Wherever the work happened, see what it may support, what record is still needed, and how company results differ from your own contribution.',
    },
    {
      icon: Building2,
      zhTitle: '准备美国公司',
      enTitle: 'Prepare the U.S. company',
      zh: '按顺序管理注册、EIN、银行账户、治理文件、董事会决议与授权签字，并与后续 O-1A 工作安排保持一致。',
      en: 'Manage formation, EIN, banking, governance, resolutions and signing authority in sequence, aligned with the later O-1A work arrangement.',
    },
    {
      icon: FileSearch,
      zhTitle: '记录材料与个人归因',
      enTitle: 'Connect evidence to your contribution',
      zh: '每份材料记清来源、日期、页段和支持内容。同一件事只讲一遍，写文书、答复补件和交给律所时继续复用。',
      en: 'Record each source, date, passage and supported fact once, then reuse it in drafts, responses and counsel handoff.',
    },
    {
      icon: FileCheck2,
      zhTitle: '生成文书并检查一致性',
      enTitle: 'Draft and check consistency',
      zh: '把申请信、工作安排、商业计划事实清单和 Exhibit 索引放在一起核对，及时发现职位、日期、职责或报酬不一致。',
      en: 'Review support letters, work plans, business-plan facts and exhibit indexes together so conflicting roles, dates, duties or pay are visible.',
    },
    {
      icon: FolderKanban,
      zhTitle: '组卷、递交与跟进',
      enTitle: 'Package, file and follow up',
      zh: '查看已完成、待处理和截止日期；冻结递交版本，记录寄送、受理、补件、签证和入境进度。',
      en: 'Track completed work, open tasks and deadlines; freeze filing versions and record delivery, receipt, RFE, visa and entry milestones.',
    },
  ];

  return (
    <div className="founder-app marketing-home">
      <a href="#marketing-main" className="founder-skip">
        {t('跳到正文', 'Skip to content')}
      </a>
      <header className="marketing-header">
        <a
          href="/"
          className="marketing-brand"
          aria-label={t('USCOO 首页', 'USCOO home')}
        >
          <Leaf size={24} />
          <strong>USCOO</strong>
          <span>
            {t(
              '创业者的 O-1A 准备助手',
              'O-1A preparation for founders',
            )}
          </span>
        </a>
        <nav className="marketing-desktop-nav" aria-label={t('首页导航', 'Homepage navigation')}>
          <a href="#what-is-o1">{t('O-1 是什么', 'What is O-1')}</a>
          <a href="#how-it-works">{t('如何工作', 'How it works')}</a>
          <a href="#core-value">{t('能力', 'Capabilities')}</a>
          <a href="#faq">{t('常见问题', 'FAQ')}</a>
          <LanguageSwitch />
          <a className="account-link" href="/account">
            <UserRound size={16} />
            {signedIn
              ? t('我的账号', 'My account')
              : t('注册 / 登录', 'Register / sign in')}
          </a>
          <a className="founder-button" href="/beta?view=assessment">
            {t('免费开始', 'Start free')}
            <ArrowRight size={16} />
          </a>
        </nav>
        <details className="mobile-site-menu">
          <summary>{t('菜单', 'Menu')}</summary>
          <div onClick={(event) => { if ((event.target as HTMLElement).closest('a')) event.currentTarget.closest('details')?.removeAttribute('open'); }}>
            <a href="/beta?view=assessment">{t('开始免费评估', 'Start a free assessment')}</a>
            <a href="/account">{t('账号 / ChatGPT 登录', 'Account / ChatGPT sign-in')}</a>
            <a href="#what-is-o1">{t('O-1 是什么', 'What is O-1')}</a>
            <a href="#how-it-works">{t('如何工作', 'How it works')}</a>
            <a href="#core-value">{t('能力', 'Capabilities')}</a>
            <a href="#faq">{t('常见问题', 'FAQ')}</a>
          </div>
        </details>
      </header>

      <main id="marketing-main">
        <section className="marketing-hero">
          <div className="marketing-hero-copy">
            <p className="founder-eyebrow">
              {t(
                '创业者的 O-1A 准备助手',
                'O-1A preparation for founders',
              )}
            </p>
            <h1>
              <span>{t('把你在世界任何地方', 'Turn achievements built')}</span>{' '}
              <span>{t('做出的成绩，', 'anywhere in the world')}</span>{' '}
              <span>{t('', 'into evidence')}</span>
              <em>{t('变成 USCIS 看得懂的证据。', 'USCIS can understand.')}</em>
            </h1>
            <p>
              {t(
                'USCOO 会从一件具体经历开始，帮你提炼个人贡献、对照 USCIS 的八项杰出人才标准，并把美国公司、申请材料和递交进度放在同一条路上。你可以自主申请，也可以随时把整理好的资料交给律所。',
                'USCOO starts with one concrete achievement, helps surface your personal contribution, maps it to the eight USCIS criteria, and connects the U.S. company, evidence and filing progress in one path. Self-file or hand an organized record to counsel whenever you choose.',
              )}
            </p>
            <div className="founder-actions">
              <a className="founder-button" href="/beta?view=assessment">
                {t('免费开始', 'Start free')}
                <ArrowRight size={17} />
              </a>
              <a className="founder-button outline" href="#how-it-works">
                {t('先看看它怎么工作', 'See how it works')}
              </a>
            </div>
            <p className="marketing-access-note">
              {t(
                '无需账号完成评估并查看结果。邮箱可获取报告；长期工作台当前使用 ChatGPT 登录。',
                'Assess and see results without an account. Get a report by email; the ongoing workspace currently uses ChatGPT sign-in.',
              )}
            </p>
          </div>
          <div
            className="marketing-hero-system"
            aria-label={t(
              '公司与个人两边的准备示意',
              'Company and personal preparation tracks',
            )}
          >
            <div className="system-head">
              <span>{t('同一份申请', 'One petition')}</span>
              <b>{t('两边一起准备', 'Two connected tracks')}</b>
            </div>
            <div className="system-track">
              <Building2 />
              <div>
                <strong>{t('公司这一边', 'Company side')}</strong>
                <span>
                  {t(
                    '注册 · EIN · 银行 · 授权签字',
                    'Formation · EIN · banking · signing authority',
                  )}
                </span>
              </div>
            </div>
            <div className="system-track">
              <Sparkles />
              <div>
                <strong>{t('你这一边', 'Your side')}</strong>
                <span>
                  {t(
                    '经历 · 个人贡献 · 证据 · 归因',
                    'Achievements · contribution · evidence · attribution',
                  )}
                </span>
              </div>
            </div>
            <div className="system-converge">
              <span>{t('讲清同一组事实', 'Align the facts')}</span>
              <ArrowRight />
              <span>{t('逐份核对', 'Review')}</span>
              <ArrowRight />
              <strong>{t('组卷递交', 'Package & file')}</strong>
            </div>
          </div>
        </section>

        <section
          className="marketing-proof-strip"
          aria-label={t('产品能力', 'Product capabilities')}
        >
          <span>
            {t('不用先有美国公司', 'No U.S. company required to start')}
          </span>
          <span>
            {t('对标 USCIS 八项标准', 'Mapped to eight USCIS criteria')}
          </span>
          <span>
            {t('自主申请或交给律所', 'Self-file or work with counsel')}
          </span>
          <span>{t('中英双语全程', 'Bilingual throughout')}</span>
        </section>

        <section
          className="marketing-section marketing-o1-intro"
          id="what-is-o1"
        >
          <div className="marketing-o1-copy">
            <p className="founder-eyebrow">
              {t('O-1 是什么？', 'What is O-1?')}
            </p>
            <h2>
              {t(
                '为杰出人才赴美继续专业工作而设的临时工作类别。',
                'A temporary work classification for extraordinary talent continuing professional work in the United States.',
              )}
            </h2>
            <p>
              {t(
                'O-1 允许你在身份有效期内，为获批的美国申请人从事获批的工作并在美国生活。首次获批期限按实际工作或活动确定，最长可达 3 年；为继续同一工作或活动，通常可按需要申请最长 1 年的延期，法规没有预设累计次数上限。',
                'O-1 lets you live in the United States and perform the work approved for the U.S. petitioner during the authorized period. The initial validity period is tied to the work or event and may be up to three years; extensions to continue the same work or event may generally be granted in increments of up to one year, with no preset cumulative limit in the regulation.',
              )}
            </p>
            <p>
              {t(
                'O-1A 资格本身不要求特定学历，也不走 H-1B 式的年度名额抽签；它没有 O-1A 专属的统一工资门槛，但报酬、合同与工作安排仍须真实、合规并在申请材料中说明。对符合条件的创始人而言，它是较灵活的赴美工作与创业路径之一。',
                'O-1A itself does not require a particular degree or use an H-1B-style annual cap lottery. It has no O-1A-specific uniform wage threshold, although compensation, contracts and work arrangements must still be genuine, lawful and documented. For qualifying founders, it can be one of the more flexible U.S. work and entrepreneurship paths.',
              )}
            </p>
            <div className="marketing-o1-sources">
              <a
                href="https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement"
                target="_blank"
                rel="noreferrer"
              >
                {t('USCIS：O-1 官方介绍', 'USCIS: O-1 overview')}
                <ArrowRight size={14} />
              </a>
              <a
                href="https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-9"
                target="_blank"
                rel="noreferrer"
              >
                {t('USCIS：有效期与延期规则', 'USCIS: validity and extensions')}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
          <div
            className="marketing-o1-facts"
            aria-label={t('O-1 主要特点', 'Key O-1 features')}
          >
            <article>
              <CalendarRange />
              <strong>{t('首次最长 3 年', 'Up to 3 years initially')}</strong>
              <span>
                {t('按实际工作或活动确定', 'Based on the work or event')}
              </span>
            </article>
            <article>
              <RefreshCw />
              <strong>{t('可以按规则续期', 'Extensions available')}</strong>
              <span>
                {t(
                  '继续同一活动通常最长 1 年一次',
                  'Usually up to 1 year at a time for the same activity',
                )}
              </span>
            </article>
            <article>
              <GraduationCap />
              <strong>
                {t('无特定学历门槛', 'No specified degree threshold')}
              </strong>
              <span>
                {t(
                  '核心是杰出能力与持续认可',
                  'The focus is extraordinary ability and sustained acclaim',
                )}
              </span>
            </article>
            <article>
              <BadgeDollarSign />
              <strong>{t('无年度抽签', 'No annual cap lottery')}</strong>
              <span>
                {t(
                  '报酬与工作安排仍需如实说明',
                  'Compensation and work terms still must be documented',
                )}
              </span>
            </article>
          </div>
        </section>

        <details className="marketing-more"><summary>{t('为什么公司成绩还需要个人证据？', 'Why do company results need personal evidence?')}</summary>
        <section className="marketing-section" id="pain-points">
          <div className="marketing-section-heading">
            <p className="founder-eyebrow">
              {t(
                '真正卡住创业者的，不是经历不够',
                'The challenge is not a lack of achievement',
              )}
            </p>
            <h2>
              {t(
                '难的是把真实经历，变成美国移民局能核对的证据。',
                'The challenge is turning real work into evidence USCIS can verify.',
              )}
            </h2>
          </div>
          <div className="marketing-pain-grid">
            {painPoints.map(([zhTitle, zhNote, enTitle, enNote], index) => (
              <article key={zhTitle}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{t(zhTitle, enTitle)}</h3>
                <p>{t(zhNote, enNote)}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="marketing-section marketing-cross-border"
          id="cross-border"
        >
          <div className="marketing-cross-border-copy">
            <p className="founder-eyebrow">
              {t(
                '跨国经历，也有清楚的对标方法',
                'A clear way to translate cross-border achievements',
              )}
            </p>
            <h2>
              {t(
                '在中国拿的奖、在印度做的产品、在以色列申的专利，都可以从真实材料开始核对。',
                'Awards from China, products built in India and patents filed in Israel can all be assessed from their underlying records.',
              )}
            </h2>
            <p>
              {t(
                '关键是把公司的成果、你的正式角色、你亲自做的决定、可验证的结果和第三方证明连起来，再看它最接近哪项标准。',
                'Connect the company result, your formal role, the decision you personally made, the verifiable outcome and third-party support—then assess the most relevant criterion.',
              )}
            </p>
          </div>
          <div className="marketing-example-card">
            <div>
              <span>{t('你可能会说', 'You might say')}</span>
              <p>
                {t(
                  '“产品是团队一起做的，我只是拍了个板。”',
                  '“The team built the product; I only made the call.”',
                )}
              </p>
            </div>
            <div>
              <span>{t('USCOO 会继续问', 'USCOO follows up')}</span>
              <p>
                {t(
                  '“当时有哪些选择？你为什么坚持这一条？如果没有你的决定，结果最可能有什么不同？”',
                  '“What were the alternatives? Why did you insist on this direction? What likely would have changed without your decision?”',
                )}
              </p>
            </div>
            <div className="example-outcome">
              <span>{t('接下来要找', 'What to find next')}</span>
              <p>
                {t(
                  '公司决议、共同创始人的书面确认，以及上线后的客户采用数据。它们一起说明你的作用与结果。',
                  'A company resolution, co-founder confirmation and customer-adoption data. Together they show your role and the outcome.',
                )}
              </p>
            </div>
          </div>
        </section>

        </details>
        <section
          className="marketing-section marketing-journey"
          id="how-it-works"
        >
          <div className="marketing-section-heading">
            <p className="founder-eyebrow">
              {t(
                '从“我能不能试试”到组卷递交',
                'From “could this work?” to a filing package',
              )}
            </p>
            <h2>
              {t(
                '你不用一次搞懂全部。每一步只做一件事，做完就知道下一步在哪。',
                'You do not need to learn everything at once. Each step has one clear job and a clear next move.',
              )}
            </h2>
          </div>
          <div className="marketing-journey-list">
            {journey.map(([number, zh, en], index) => (
              <div key={number}>
                <b>{number}</b>
                <span>{t(zh, en)}</span>
                {index < journey.length - 1 && <ArrowRight size={15} />}
              </div>
            ))}
          </div>
          <a className="marketing-inline-cta" href="/beta?view=assessment">
            {t('免费开始', 'Start free')}
            <ArrowRight size={16} />
          </a>
        </section>

        <section className="marketing-section marketing-value" id="core-value">
          <div className="marketing-value-intro">
            <p className="founder-eyebrow">
              {t(
                '从事实到递交，一套系统接起来',
                'One system from facts to filing',
              )}
            </p>
            <h2>
              {t(
                '先梳理经历，再按缺口准备。',
                'Understand your experience, then prepare what is missing.',
              )}
            </h2>
            <p>
              {t(
                '同一件事只需要讲一遍。后面的材料、任务、文书、律所沟通和递交记录都从这份事实继续。需要深入核验时，再在对应步骤选择 Agent 协助。',
                'Explain each fact once, then carry it through evidence, tasks, drafts, counsel handoff and filing records. Choose Agent help at the step where deeper review is useful.',
              )}
            </p>
          </div>
          <div className="marketing-value-grid">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.zhTitle}>
                  <Icon />
                  <h3>{t(item.zhTitle, item.enTitle)}</h3>
                  <p>{t(item.zh, item.en)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="marketing-section marketing-proof-tools">
          <div>
            <p className="founder-eyebrow">
              {t('费用先算清，服务费分开看', 'See government fees separately')}
            </p>
            <h2>
              {t(
                'I-129、庇护项目附加费、I-907 和领馆费用，按你的情况即时估算。',
                'Estimate I-129, the Asylum Program Fee, I-907 and consular fees for your situation.',
              )}
            </h2>
            <p>
              {t(
                '政府行政费用与律师、翻译和其他第三方预算分开列示。每一项保留官方查询入口，递交前可以再次核对。',
                'Government filing fees are separated from legal, translation and other third-party budgets, with official links for a final filing-day check.',
              )}
            </p>
            <a className="marketing-inline-cta" href="/beta#fees">
              {t('打开费用估算器', 'Open the fee estimator')}
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="marketing-fee-preview">
            <Banknote />
            <span>{t('政府费用', 'Government fees')}</span>
            <strong>I-129 · I-907 · MRV</strong>
            <small>
              {t(
                '平台服务费与第三方预算另列',
                'Platform services and third-party budgets are listed separately',
              )}
            </small>
          </div>
        </section>

        <details className="marketing-more"><summary>{t('USCOO 的创立故事', 'The story behind USCOO')}</summary>
        <section className="marketing-section marketing-origin">
          <div>
            <p className="founder-eyebrow">
              {t(
                '来自一次真实的 DIY 申请',
                'Built from a real self-filed case',
              )}
            </p>
            <h2>
              {t(
                '这套方法，是从一个真实批准的案子里长出来的。',
                'This method grew out of a real approved case.',
              )}
            </h2>
          </div>
          <p>
            {t(
              'USCOO 的创始人曾亲自完成公司准备、授权安排、经历回溯、材料核对、组卷和递交。两个月、无 RFE、一次批准。USCOO 把那次申请中反复用到的判断和工作方法，变成一条普通创业者也能一步步走下去的路径。',
              'USCOO’s founder personally handled company preparation, authority records, achievement reconstruction, evidence review, packaging and filing. The case was approved in two months without an RFE. USCOO turns the repeated reasoning and work from that process into a path other founders can follow step by step.',
            )}
          </p>
        </section>

        </details>
        <section className="marketing-section marketing-faq" id="faq">
          <div className="marketing-section-heading">
            <p className="founder-eyebrow">
              {t(
                '开始前常见的三个问题',
                'Three common questions before you start',
              )}
            </p>
            <h2>{t('现在只需要知道这些。', 'This is enough to begin.')}</h2>
          </div>
          <div>
            <details>
              <summary>
                {t(
                  '我还没有美国公司，可以先评估吗？',
                  'Can I assess first without a U.S. company?',
                )}
              </summary>
              <p>
                {t(
                  '可以。先说明你目前在做什么和赴美计划；决定继续后，再比较已有公司、成立公司或由其他雇主申请的安排。',
                  'Yes. Start with your current work and U.S. plan; compare an existing company, a new company or another employer only after you decide to continue.',
                )}
              </p>
            </details>
            <details>
              <summary>
                {t('我必须找律所吗？', 'Do I have to retain a law firm?')}
              </summary>
              <p>
                {t(
                  '不必把律所当成固定步骤。你可以自主申请，也可以在任何阶段把八节沟通包、原件 ZIP 或只读链接交给律所。',
                  'A law firm is not a fixed product step. Self-file, or hand an eight-section brief, source-file ZIP or read-only link to counsel at any stage.',
                )}
              </p>
            </details>
            <details>
              <summary>
                {t(
                  '初步评估会直接告诉我能不能获批吗？',
                  'Will the initial assessment predict approval?',
                )}
              </summary>
              <p>
                {t(
                  '初评先帮你找出值得核实的方向和下一份该找的材料。正式判断还需要核对原件、个人贡献、持续认可和整体记录。',
                  'The assessment identifies promising directions and the next record to find. A formal judgment still depends on source review, personal attribution, sustained recognition and the record as a whole.',
                )}
              </p>
            </details>
          </div>
        </section>

        <section className="marketing-final-cta">
          <p className="founder-eyebrow">
            {t(
              '不用先想清楚自己够不够',
              'You do not need a verdict before starting',
            )}
          </p>
          <h2>
            {t(
              '用十几分钟，看清你的第一步。',
              'Take a few minutes to see your first step clearly.',
            )}
          </h2>
          <p>
            {t(
              '不用先成立公司，不用先准备材料。先说说你正在做什么，以及一件最能代表你的经历。',
              'No company or prepared documents needed. Start by describing your work and one achievement that represents you.',
            )}
          </p>
          <a className="founder-button" href="/beta?view=assessment">
            {t('免费开始', 'Start free')}
            <ArrowRight size={17} />
          </a>
        </section>
      </main>

      <footer className="marketing-footer">
        <div>
          <strong>USCOO</strong>
          <span>
            {t(
              '创业者的 O-1A 准备助手',
              'O-1A preparation for founders',
            )}
          </span>
        </div>
        <p>
          {t(
            'USCOO 帮助你理解流程、整理事实和准备材料，不构成法律意见或律师代理关系。签署、付款和递交始终由你本人或受托方确认。',
            'USCOO helps explain the process, organize facts and prepare materials. It is not legal advice or an attorney-client relationship. Signing, payment and filing always require confirmation by you or your authorized representative.',
          )}
        </p>
        <div className="marketing-footer-links">
          <a href="mailto:coo@uscoo.ai">coo@uscoo.ai</a>
          <a href="/privacy">{t('隐私说明', 'Privacy')}</a>
          <a href="/beta?view=assessment">{t('免费开始', 'Start free')}</a>
        </div>
      </footer>
    </div>
  );
}
