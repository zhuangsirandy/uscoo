import { translate, formatCopy, type Language } from './translations';
import { CRITERIA, type CaseData } from './case-domain';
import { EXPERIENCE } from './founder-intake';
export type BriefItem = {
  label: string;
  detail: string;
  status?: string;
  sourceId?: string;
  hasFile?: boolean;
};
export type BriefSection = {
  title: string;
  description: string;
  items: BriefItem[];
};
export const BRIEF_OUTLINE = [
  ['一页摘要', '先让律师知道你的领域、赴美目标、时间要求和目前线索。'],
  ['申请主体现状', '公司、真实工作安排、治理与签字授权，哪些已落实。'],
  ['成就时间线', '什么时候做了什么，结果如何，留下了什么记录。'],
  ['材料清单', '每份材料的出处、原件、核实和翻译状态。'],
  ['标准与交叉支持', '材料可能支持哪些方向，保留逐项判断的依据。'],
  ['待补行动', '把未解决的问题转换成可以分工的下一步。'],
  ['事件与个人归因', '分清团队成果和你的具体作用，并连回原始来源。'],
  ['留给律师的问题', '把身份路径、申请主体和证据策略集中讨论。'],
] as const;
const label = (r: any) =>
  r.body.hypothesis
    ? '设想，非已发生事实'
    : r.kind === 'event'
      ? r.body.confirmed
        ? '本人已确认，待专业判断'
        : '本人自述，待核实'
      : r.body.status === 'reviewed' && r.body.confirmed
        ? '用户已核对，待专业判断'
        : {
            lead: '线索，待核实',
            conflict: '存在冲突',
            unsupported: '支持不足',
            withdrawn: '已撤回',
          }[r.body.status as string] || '尚未完成核对';
const taskState: Record<string, string> = {
  todo: '待开始',
  doing: '进行中',
  waiting: '等待配合',
  done: '已标记完成',
  cancelled: '已取消',
};
const independence: Record<string, string> = {
  independent: '独立第三方',
  related: '有关联的第三方',
  self: '本人提供',
  unknown: '独立性待确认',
};
const translation: Record<string, string> = {
  'not-needed': '无需翻译（待核对适用性）',
  needed: '待翻译',
  draft: '已有译稿，待认证',
  certified: '已记录认证，待核对',
};
export function buildLawyerBrief(
  c: CaseData,
  language: Language = 'zh',
): BriefSection[] {
  const t = (value: any) => translate(value, language);
  const f = (key: string, ...values: any[]) =>
    formatCopy(key, language, ...values);
  const p = c.project.profile;
  const events = c.records.filter(
    (x) => x.kind === 'event' && !x.body.hypothesis,
  );
  const materials = c.records.filter((x) => x.kind === 'evidence');
  const tasks = c.records.filter((x) => x.kind === 'task');
  const intake = c.records.find((x) => x.kind === 'intake')?.body;
  const sourceNames = (ids: string[] = []) =>
    ids
      .map((id) => {
        const r = materials.find((x) => x.id === id);
        return r
          ? `${r.body.title} [${id}]（${t(label(r))}）`
          : f('来源记录待核对 [{0}]', id);
      })
      .join('；') || '尚未关联来源';
  const lineNames = EXPERIENCE.filter(
    (x) => intake?.answers?.[x.id] === 'yes',
  ).map((x) => t(CRITERIA.find((k) => k.id === x.id)?.title));
  const companyGoal = {
    undecided: ['尚未确定申请主体路径', 'Petitioner path not yet selected'],
    'new-o1a': [
      '成立美国公司并准备作为 O-1A 申请公司',
      'Form a U.S. company and prepare it as the O-1A petitioner',
    ],
    'existing-o1a': [
      '准备由现有美国公司提出 O-1A 申请',
      'Prepare an existing U.S. company as the O-1A petitioner',
    ],
    'company-only': [
      '目前仅进行公司注册与运营前准备',
      'Company formation and pre-operation setup only',
    ],
    'external-petitioner': [
      '由其他美国雇主或合格美国代理人提出申请',
      'Use another U.S. employer or a qualifying U.S. agent',
    ],
  }[p.companyGoal || 'undecided'];
  const groups: BriefItem[][] = [
    [
      {
        label: language === 'en' ? 'Company preparation goal' : '公司准备目标',
        detail: `${language === 'en' ? companyGoal[1] : companyGoal[0]}\n${p.entityType || (language === 'en' ? 'Entity type not confirmed' : '实体类型待确认')} · ${p.formationState || (language === 'en' ? 'Formation or operating state not confirmed' : '注册州或经营州待确认')} · ${p.formationStatus || (language === 'en' ? 'Company stage not confirmed' : '公司阶段待确认')}`,
      },
      {
        label:
          language === 'en'
            ? 'Target dates (planning only)'
            : '目标日期（仅用于计划）',
        detail:
          language === 'en'
            ? `Target approval: ${p.desiredApproval || 'Not set'}; U.S. arrival: ${p.arrivalDate || 'Not set'}; work start: ${p.start || 'Not set'}`
            : `希望获批：${p.desiredApproval || '待定'}；预计赴美：${p.arrivalDate || '待定'}；开始工作：${p.start || '待定'}`,
      },
      {
        label: '个人与领域',
        detail: f(
          '{0} \u00B7 {1}',
          p.name || '姓名待补充',
          p.field || '领域待说明',
        ),
      },
      {
        label: '赴美目标',
        detail: f(
          '{0}\n{1}；{2}',
          p.target || '时间目标待确认',
          p.role || '拟任职责待确认',
          p.duties || '工作内容待说明',
        ),
      },
      {
        label: '现状与时间',
        detail: f(
          '所在地：{0}；当前身份：{1}；身份期限：{2}\n拟工作期：{3} 至 {4}',
          p.location || '待补充',
          p.status || '待补充',
          p.statusUntil || '待核对',
          p.start || '待定',
          p.end || '待定',
        ),
      },
      {
        label: '当前准备程度',
        detail: f(
          '{0} 条经历记录，{1} 份材料记录；其中 {2} 份已由用户标记核对。此数字不代表证据标准成立。',
          events.length,
          materials.length,
          materials.filter(
            (x) => x.body.confirmed && x.body.status === 'reviewed',
          ).length,
        ),
      },
      {
        label: '优先讨论的经历线索',
        detail: lineNames.length
          ? f(
              '{0}。来自初步点选，尚未验证或排序。',
              lineNames.join(language === 'en' ? ', ' : '、'),
            )
          : '尚未选择优先线索。可根据完整记录，与律师确定最有支持的方向。',
      },
    ],
    [
      {
        label: '申请主体',
        detail: f(
          '{0}\n{1}',
          p.company || '公司名称尚未补充',
          p.companyState || '设立与运营状态待确认',
        ),
      },
      {
        label: '拟工作安排',
        detail: f(
          '职责：{0}\n地点：{1}；报酬：{2}\n本人不能直接自我申请；独立法人、签字权限及真实工作关系需结合个案核实。',
          p.duties || '待补充',
          p.workplace || '待补充',
          p.pay || '待补充',
        ),
      },
      ...tasks
        .filter((x) => x.body.track === 'company')
        .map((x) => ({
          label: x.body.title,
          detail: f(
            '{0}\n完成依据：{1}',
            x.body.notes || '',
            x.body.receipt || '未提供',
          ),
          status: taskState[x.body.state] || '待确认',
        })),
    ],
    events.map((x) => ({
      label: f('{0} \u00B7 {1}', x.body.date || '日期待补充', x.body.title),
      detail: f(
        '做了什么：{0}\n结果：{1}\n书面记录：{2}',
        x.body.action || '待补充',
        x.body.result || '待补充',
        sourceNames(x.body.sourceIds),
      ),
      status: t(label(x)),
    })),
    materials.map((x) => ({
      label: x.body.title,
      detail: f(
        '出具人：{0}；日期：{1}\n出处：{2}；页段：{3}\n来源关系：{4}\n原件：{5}；翻译：{6}\n备注：{7}',
        x.body.issuer || '待确认',
        x.body.date || '待确认',
        x.body.url || '链接未提供',
        x.body.page || '待标注',
        independence[x.body.independence] || '待确认',
        x.body.file
          ? '私有项目中有文件，完整性需逐页核对'
          : '未上传原件，仅有文字或记录',
        translation[x.body.translation] || '待确认',
        x.body.notes || '无补充备注',
      ),
      status: t(label(x)),
      sourceId: x.id,
      hasFile: !!x.body.file,
    })),
    CRITERIA.map((k) => {
      const mapped = materials.filter((x) => x.body.criteria?.includes(k.id));
      return {
        label: k.title,
        detail: f(
          '{0}\n核对：{1}\n{2}{3}\n{4}',
          k.term,
          k.check,
          mapped.length
            ? mapped
                .map((x) => `${x.body.title} [${x.id}] · ${t(label(x))}`)
                .join('\n')
            : '尚未关联材料。',
          intake?.answers?.[k.id] === 'yes'
            ? '\n初步点选提到过此类经历，仍需核实。'
            : '',
          k.caution,
        ),
        status: '初步关联，仍需专业复核',
      };
    }),
    [
      ...materials
        .filter((x) => !(x.body.confirmed && x.body.status === 'reviewed'))
        .map((x) => ({
          label: f('核对：{0}', x.body.title),
          detail: f(
            '{0}\n下一步：补齐出处、页段及可核对原件，再由本人确认。',
            x.body.notes || '核对原文、真实性、个人归因与适用要件。',
          ),
          status: t(label(x)),
        })),
      ...tasks
        .filter((x) => !['done', 'cancelled'].includes(x.body.state))
        .map((x) => ({
          label: x.body.title,
          detail: f(
            '{0}\n负责人：{1}；截止安排：{2}',
            x.body.notes || '具体事项待说明',
            x.body.owner || '待分工',
            x.body.due || '待商定',
          ),
          status: taskState[x.body.state] || '待确认',
        })),
      ...EXPERIENCE.filter((x) => intake?.answers?.[x.id] === 'yes').map(
        (x) => ({
          label: f('初步线索：{0}', CRITERIA.find((k) => k.id === x.id)?.title),
          detail: x.next,
          status: '来自本人点选，待核实',
        }),
      ),
    ],
    events.map((x) => ({
      label: x.body.title,
      detail: f(
        '本人角色：{0}\n具体行动：{1}\n团队与本人边界：{2}\n可能关联方向：{3}\n来源链：{4}',
        x.body.role || '待说明',
        x.body.action || '待说明',
        x.body.team || '尚未区分',
        (x.body.criteria || [])
          .map((id: string) =>
            t(CRITERIA.find((k) => k.id === id)?.title || id),
          )
          .join(language === 'en' ? ', ' : '、') || '待讨论',
        sourceNames(x.body.sourceIds),
      ),
      status: t(label(x)),
    })),
    [
      {
        label: '证据门槛与整体审查',
        detail:
          '现有材料能否满足适用证据要求，并证明持续认可及领域地位？哪些事实最有支持，哪些仅是线索？',
      },
      {
        label: '申请主体与工作安排',
        detail: f(
          '{0}独立法人、工作内容、签字权限及代理安排是否适用并有依据？',
          p.company ? f('拟由 {0} 申请。', p.company) : '尚未明确申请主体。',
        ),
      },
      {
        label: '身份与办理路径',
        detail: f(
          '目前记录：{0}，期限 {1}，路径 {2}。需要补充哪些身份历史，如何衔接工作开始日？',
          p.status || '身份未说明',
          p.statusUntil || '未核对',
          (
            {
              consular: '领馆办理',
              change: '境内变更身份',
              extension: '延期',
              unknown: '待确认',
            } as Record<string, string>
          )[p.route || 'unknown'],
        ),
      },
      {
        label: 'Consultation 与材料组成',
        detail: f(
          '针对 {0}，需要哪类咨询意见？如有例外，适用依据是什么？普通推荐信不能自动替代此要求。',
          p.field || '待明确的领域',
        ),
      },
      ...(materials.some((x) => x.body.status === 'conflict')
        ? [
            {
              label: '冲突信息',
              detail:
                '有材料被标记为存在冲突。请逐项比较原件，决定更正和解释方式，避免把冲突内容直接写入申请。',
            },
          ]
        : []),
      ...(intake?.timing === 'soon' || p.statusUntil
        ? [
            {
              label: '时间优先事项',
              detail:
                '已记录较近的赴美目标或身份期限。请先核对真实截止日、可行路径与加急适用性；系统不据此承诺开工日期。',
            },
          ]
        : []),
    ],
  ];
  return BRIEF_OUTLINE.map(([title, description], i) => ({
    title: t(title),
    description: t(description),
    items: groups[i].map((item) => ({
      ...item,
      label: t(item.label),
      detail: t(item.detail),
      status: t(item.status),
    })),
  }));
}
export function lawyerBriefText(c: CaseData, language: Language = 'zh') {
  return buildLawyerBrief(c, language)
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n${s.description}\n\n${s.items.length ? s.items.map((x) => `${x.label}${x.status ? ` [${x.status}]` : ''}\n${x.detail}${x.sourceId ? `\nSource ID: ${x.sourceId}` : ''}`).join('\n\n') : '此节尚无记录；待补充，不代表相关事实不存在。'}`,
    )
    .join('\n\n');
}
