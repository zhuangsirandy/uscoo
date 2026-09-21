export const STEPS = [
  ['path', '总览', '看清现在最值得做什么'],
  ['profile', '公司与工作安排', '确认申请公司、时间和真实工作安排'],
  ['story', '我的经历', '分清个人贡献、团队成果与可证明事实'],
  ['evidence', '材料与对标', '按 USCIS 标准筛选、核对并整理来源'],
  ['prepare', '待办任务', '公司资料与个人证明同步推进'],
  ['draft', '文书', '用已确认事实组装、交叉核对和定稿'],
  ['filing', '递交与跟进', '组卷、留存递交版本并跟进后续事件'],
] as const;
export const POLICY_URL =
  'https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-4';
export const CRITERIA = [
  {
    id: 'awards',
    title: '获奖与荣誉',
    term: 'Awards / prizes',
    check: '获奖人、评选机制、领域及认可范围',
    question: '奖项颁给谁？评选规则和公布名单还在吗？',
    caution: '公司奖项、融资或付费证书不能自动证明个人获奖。',
  },
  {
    id: 'membership',
    title: '高门槛协会会员',
    term: 'Membership',
    check: '杰出成就入会要求、专家评审和实际获选',
    question: '加入这个协会需要什么成就，由谁评审？',
    caution: '缴费或一般从业资格本身不够。',
  },
  {
    id: 'media',
    title: '关于你的媒体报道',
    term: 'Published material',
    check: '报道是否关于本人及工作；作者、日期、媒体性质',
    question: '报道具体写了你做的哪件事？',
    caution: '只出现名字或公司新闻不自动成立。',
  },
  {
    id: 'judging',
    title: '评审他人的工作',
    term: 'Judging',
    check: '同领域或相关领域、实际评判和完成记录',
    question: '你实际评判过哪些项目？留下了什么评分或反馈？',
    caution: '论坛组织者、演讲者或受邀未履职不能自动视为评审。',
  },
  {
    id: 'contribution',
    title: '原创贡献及领域影响',
    term: 'Original contributions',
    check: '原创性、本人作用、采用情况与重大意义',
    question: '这件事里你负责哪一部分？谁采用了成果？',
    caution: '专利、软著或产品存在，不等于产生了重大意义。',
  },
  {
    id: 'authorship',
    title: '学术文章',
    term: 'Scholarly articles',
    check: '学术性质、作者、领域、发表载体',
    question: '文章研究了什么，发表在哪里？',
    caution: '一般博客、采访或营销稿不能直接替代学术文章。',
  },
  {
    id: 'critical',
    title: '关键或必要职责',
    term: 'Critical or essential capacity',
    check: '机构杰出声誉、实际职责与个人作用',
    question: '你负责的工作对机构有什么具体作用？',
    caution: 'Founder、CEO 等头衔本身不足以说明关键作用。',
  },
  {
    id: 'salary',
    title: '高薪或其他报酬',
    term: 'High salary / remuneration',
    check: '报酬、服务关系、同领域可比基准',
    question: '这项报酬对应什么工作，有什么可比数据？',
    caution: '融资额、公司估值和持股比例不能直接当作个人报酬。',
  },
] as const;
export type Kind =
  | 'intake'
  | 'event'
  | 'evidence'
  | 'task'
  | 'document'
  | 'gate'
  | 'packet'
  | 'filing'
  | 'rule'
  | 'comment'
  | 'consent';
export type RecordItem = {
  id: string;
  projectId: string;
  kind: Kind;
  body: Record<string, any>;
  version: number;
  created: string;
  updated: string;
};
export type Profile = {
  preparationMode?: 'diy' | 'counsel';
  companyGoal?:
    | 'undecided'
    | 'new-o1a'
    | 'existing-o1a'
    | 'company-only'
    | 'external-petitioner';
  entityType?: string;
  formationState?: string;
  formationStatus?: 'not-started' | 'choosing' | 'filed' | 'active';
  desiredApproval?: string;
  arrivalDate?: string;
  name?: string;
  company?: string;
  companyState?: string;
  location?: string;
  route?: string;
  field?: string;
  target?: string;
  status?: string;
  statusUntil?: string;
  role?: string;
  duties?: string;
  start?: string;
  end?: string;
  pay?: string;
  workplace?: string;
  premium?: boolean;
  modelConsent?: boolean;
};

export const COMPANY_PLAN_TASKS = [
  {
    key: 'company-scope',
    phase: '01',
    scopes: ['company', 'o1a'],
    title: '明确公司目标、经营州与责任边界',
    notes:
      '先确认仅做公司启动，还是同时准备作为 O-1A 申请公司；记录实际经营州、适用州和需要另行获得的法律或税务意见。',
    basis: '经营规划 / 个案判断',
    url: 'https://www.sba.gov/counseling/launch-your-business/',
  },
  {
    key: 'company-entity',
    phase: '02',
    scopes: ['company'],
    title: '选择实体类型、州、名称与注册代理人',
    notes:
      '比较实体类型和州要求，核查名称可用性、注册地址与 registered agent；不要把注册州与实际经营州混为一谈。',
    basis: '州法 / 经营规划',
    url: 'https://www.sba.gov/counseling/launch-your-business/',
  },
  {
    key: 'company-formation',
    phase: '03',
    scopes: ['company'],
    title: '完成州注册并保存成立凭证',
    notes:
      '提交适用的成立文件与州费用，保存回执、成立文件、初始报告或州税务登记要求；具体名称和期限以所选州官方页面为准。',
    basis: '州官方要求',
    url: 'https://www.sba.gov/counseling/launch-your-business/',
  },
  {
    key: 'company-ein',
    phase: '04',
    scopes: ['company'],
    title: '申请 EIN 并建立税务记录',
    notes:
      '实体成立后按适用渠道申请 EIN，保存 IRS 确认；同步确认州税号、报税年度和需要的申报日历。EIN 官方申请本身免费。',
    basis: 'IRS / 州税务',
    url: 'https://www.irs.gov/businesses/employer-identification-number',
  },
  {
    key: 'company-governance',
    phase: '05',
    scopes: ['company', 'o1a'],
    title: '建立治理文件、授权与签字链',
    notes:
      '按实体类型保存章程或 operating agreement、股权或成员记录、初始决议、负责人和签字授权；区分公司决定与个人自述。',
    basis: '公司治理 / 个案判断',
    url: 'https://www.sba.gov/counseling/launch-your-business/',
  },
  {
    key: 'company-operations',
    phase: '06',
    scopes: ['company'],
    title: '完成运营前账户、记账、许可与保险检查',
    notes:
      '按实际业务核对银行开户、收付款、记账留存、州和地方许可、保险、网站或合同基础；不适用的项目记录原因。',
    basis: '经营需要 / 州与地方要求',
    url: 'https://www.sba.gov/counseling/launch-your-business/',
  },
  {
    key: 'company-payroll',
    phase: '07',
    scopes: ['company'],
    title: '确认用工、薪酬与合规启动条件',
    notes:
      '如将雇佣人员，确认工资系统、雇佣分类、州登记和相关申报；如暂不雇佣，记录当前安排和触发条件。',
    basis: '经营与用工要求',
    url: 'https://www.sba.gov/counseling/manage-your-business/',
  },
  {
    key: 'petitioner-work',
    phase: '08',
    scopes: ['o1a'],
    title: '确认申请公司与你的真实赴美工作安排',
    notes:
      '统一拟任职位、具体职责、工作地点、开始和结束日期、报酬及合同安排；多地点或代理人情形另行准备适用的 itinerary 和授权。',
    basis: 'Form I-129 / O/P Supplement / 个案判断',
    url: 'https://www.uscis.gov/i-129',
  },
  {
    key: 'petitioner-i129',
    phase: '09',
    scopes: ['o1a'],
    title: '逐项核对 I-129 申请公司字段与附件',
    notes:
      '核对申请公司法定名称、美国办公地址、税号、联系人、签字人、业务类型、成立年份、员工人数、工作场所及出口管制认证等适用字段。',
    basis: 'Form I-129 当期版本',
    url: 'https://www.uscis.gov/i-129',
  },
  {
    key: 'petitioner-align',
    phase: '10',
    scopes: ['o1a'],
    title: '将公司资料与你的个人证明对齐并完成组卷',
    notes:
      '交叉核对姓名、申请公司、职位、职责、报酬、地点和期间；把公司附件、个人证据、咨询意见及文书引用汇入同一份待递交申请包。',
    basis: '申请包一致性与专业复核',
    url: 'https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-7',
  },
  {
    key: 'agent-authorization',
    phase: 'A',
    scopes: ['external'],
    title: '核对美国代理人授权、合同与完整行程',
    notes:
      '仅在由美国代理人提出申请时使用；核对授权关系、实际雇主、服务日期、地址、工作地点、工资和其他约定。',
    basis: '代理人申请个案',
    url: 'https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-3',
  },
] as const;
export type CaseProject = {
  id: string;
  title: string;
  profile: Profile;
  revision: number;
  created: string;
  updated: string;
};
export type CaseData = {
  project: CaseProject;
  records: RecordItem[];
  jobs: any[];
  audit: any[];
  shares: any[];
};
export const GATES = [
  ['composition', '组成完整', '适用文件齐全，例外有依据；页数和目录对应。'],
  [
    'consistency',
    '内容一致',
    '姓名、主体、日期、职责、报酬及证据引用已逐项核对。',
  ],
  ['forms', '表格有效', '记录本次适用的官方表格版本及核验出处。'],
  ['signatures', '签署完成', '适用签字、签字人及授权依据已核对。'],
  ['fees', '费用与付款', '本案费项、规模等适用因素及付款方式已当日核验。'],
  ['address', '递交地址', '申请类型、渠道和承运商对应的地址已当日核验。'],
  ['processing', '处理选择', '用户已确认普通或加急；加急不保证批准。'],
] as const;
export const OFFICIAL = [
  ['申请主体', 'https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-3'],
  ['八项与整体审查', POLICY_URL],
  ['I-129 表格', 'https://www.uscis.gov/i-129'],
  ['费用计算', 'https://www.uscis.gov/feecalculator'],
  ['递交地址', 'https://www.uscis.gov/i-129-addresses'],
  ['I-907 加急', 'https://www.uscis.gov/i-907'],
  ['SS-4 / EIN', 'https://www.irs.gov/forms-pubs/about-form-ss-4'],
  [
    '领馆行政处理',
    'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html',
  ],
  ['USCIS 案件查询', 'https://egov.uscis.gov/'],
  ['I-94 查询', 'https://i94.cbp.dhs.gov/'],
] as const;
export const INITIAL_TASKS = [
  [
    'company',
    '确认申请主体',
    '已有公司核对成立与权限；尚无公司可比较实体与注册方案。',
    '个案判断',
    '',
  ],
  [
    'company',
    '准备 EIN / SS-4',
    '核对负责人与适用渠道，发送后保存受理或失败凭证。',
    '经营需要',
    'https://www.irs.gov/forms-pubs/about-form-ss-4',
  ],
  [
    'company',
    '治理与签字授权',
    '依据实体类型准备治理记录、真实工作安排和签字权限。',
    '个案判断',
    '',
  ],
  [
    'company',
    '开户资料与公司运营',
    '准备银行要求的 KYC 资料；与个人证据并行推进。',
    '经营需要',
    '',
  ],
  [
    'evidence',
    '记录杰出经历',
    '分开写清团队成果和你本人做的事。',
    '材料准备',
    '',
  ],
  [
    'evidence',
    '整理原始证据',
    '保留原件，记录出具人、日期、页段与具体支持内容。',
    '材料准备',
    '',
  ],
  [
    'evidence',
    '翻译与认证',
    '非英文材料需完整译文；真实译者确认能力并签署认证。',
    '适用要求',
    '',
  ],
  [
    'evidence',
    '判断 consultation 要求',
    '咨询意见与普通推荐信分开；例外需有规则依据。',
    '适用要求',
    POLICY_URL,
  ],
  [
    'evidence',
    '核对整体记录',
    '除证据门槛外，复核持续认可、领域地位和赴美工作。',
    '专业复核',
    POLICY_URL,
  ],
] as const;
export function getGateState(
  records: RecordItem[],
  today = new Date().toISOString().slice(0, 10),
) {
  return GATES.map(([id, title, help]) => {
    const r = records.find((x) => x.kind === 'gate' && x.body.gate === id);
    const ok = !!r?.body.confirmed && r.body.reviewedOn === today;
    return { id, title, help, record: r, ok };
  });
}
export function sourceIds(body: Record<string, any>): string[] {
  return Array.isArray(body.sourceIds) ? body.sourceIds : [];
}
export function evidenceText(r: RecordItem) {
  return `${r.body.title || ''}\n${r.body.excerpt || ''}`;
}
