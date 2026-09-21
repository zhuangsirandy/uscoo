import { z } from 'zod';

export const EXPERIENCE = [
  {
    id: 'critical',
    title: '在一家公司或项目中，承担过重要工作',
    example: '创办企业、带领业务、负责关键产品或研究。',
    next: '选一个代表项目，找出职责记录、实际成果，以及机构声誉的独立材料。',
    words: /创始|创办|联合创始|负责人|总监|founder|ceo|director|led\b/i,
  },
  {
    id: 'contribution',
    title: '做出的成果，被别人采用或产生了影响',
    example: '技术被采用、方法被推广，或产品解决了领域里的实际问题。',
    next: '找出谁采用了成果、如何使用，以及能说明影响范围的第三方记录。',
    words: /专利|采用|原创|patent|adopt|impact|开源|open.source/i,
  },
  {
    id: 'media',
    title: '媒体报道过你和你做的工作',
    example: '人物专访、行业报道，内容具体谈到你的工作。',
    next: '保留报道全文、网址、作者和日期，标出关于你本人工作的段落。',
    words: /采访|报道|专访|interview|featured|press|媒体/i,
  },
  {
    id: 'judging',
    title: '受邀评价、评审过别人的工作',
    example: '比赛评委、论文审稿、行业项目评审，而且实际完成过。',
    next: '找邀请记录和实际完成评审的证明，例如评分、反馈或确认邮件。',
    words: /评审|评委|审稿|judge|judging|reviewer/i,
  },
  {
    id: 'awards',
    title: '获得过领域内的奖项或荣誉',
    example: '能找到评选规则、获奖名单及认可范围的奖项。',
    next: '找评选规则和官方名单，确认获奖人、竞争范围与奖项在领域中的认可。',
    words: /获奖|奖项|荣誉|award|prize|winner/i,
  },
  {
    id: 'authorship',
    title: '发表过领域内的学术文章',
    example: '专业期刊、重要行业刊物或其他主要媒体中的学术文章。',
    next: '保留全文、作者信息、发表日期及刊物信息，核对文章的学术性质。',
    words: /论文|学术|期刊|publication|journal|scholarly|paper/i,
  },
  {
    id: 'salary',
    title: '因专业工作，获得过较高的个人报酬',
    example: '薪酬或服务报酬；需要和同领域的可比标准比较。',
    next: '整理合同、实际报酬或报酬约定，再找同领域、相近条件的比较数据。',
    words: /薪酬|薪资|年薪|salary|compensation|remuneration/i,
  },
  {
    id: 'membership',
    title: '因专业成就，被选入有门槛的协会',
    example: '入会需要杰出成就，由领域专家判断；不只是缴会费。',
    next: '找协会章程、成就要求、评审机制，以及你实际获选的记录。',
    words: /协会|院士|会士|fellow|association|membership/i,
  },
] as const;
export type Answer = 'yes' | 'unsure' | 'no';
export type Signals = Partial<
  Record<(typeof EXPERIENCE)[number]['id'], Answer>
>;
const optionalDate = z.union([z.literal(''), z.iso.date()]).default('');
export const intakeSchema = z
  .object({
    answers: z
      .object(
        Object.fromEntries(
          EXPERIENCE.map((x) => [
            x.id,
            z.enum(['yes', 'unsure', 'no']).optional(),
          ]),
        ),
      )
      .strict(),
    method: z.enum(['choices', 'resume', 'linkedin']),
    currentWork: z.string().trim().min(2).max(2000),
    standoutStory: z.string().trim().min(2).max(5000),
    sourceText: z.string().max(40000).default(''),
    sourceName: z.string().max(200).default(''),
    linkedin: z
      .string()
      .max(2000)
      .default('')
      .refine((x) => {
        if (!x) return true;
        try {
          const u = new URL(x);
          return (
            u.protocol === 'https:' &&
            /(^|\.)linkedin\.com$/.test(u.hostname) &&
            u.pathname.startsWith('/in/')
          );
        } catch {
          return false;
        }
      }, '请使用 https://www.linkedin.com/in/ 开头的个人主页链接。'),
    beneficiaryName: z.string().trim().max(200).default(''),
    petitionerName: z.string().trim().max(200).default(''),
    company: z.enum(['unknown', 'none', 'planning', 'existing']).default('unknown'),
    field: z.string().max(120).default(''),
    timing: z.enum(['soon', 'six-months', 'twelve-months', 'exploring']),
    applicationPath: z.enum(['undecided', 'self', 'lawyer']).default('undecided'),
    desiredApproval: optionalDate,
    arrivalDate: optionalDate,
    workStartDate: optionalDate,
    location: z.enum(['unknown', 'US', 'CN', 'other']).default('unknown'),
    workPlan: z.string().max(2000).default(''),
    consent: z.literal(true),
  })
  .strict();
export const COMPANY_LABEL = {
  existing: '已有美国公司可以提出申请',
  planning: '正在注册或准备美国公司',
  none: '尚无申请公司',
  unknown: '不确定申请公司需要满足什么条件',
};
export const TIMING_LABEL = {
  soon: '3个月以内',
  'six-months': '3–6个月',
  'twelve-months': '6–12个月',
  exploring: '还没有明确计划',
};
export const APPLICATION_PATH_LABEL = {
  self: '自主申请',
  lawyer: '委托律师',
  undecided: '尚未决定',
};
export function keywordHints(text: string) {
  return EXPERIENCE.filter((x) => x.words.test(text)).map((x) => x.id);
}
