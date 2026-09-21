import catalog from './translations.en.json';
export type Language = 'en' | 'zh';
const english: Record<string, string> = catalog;
const terms: Record<string, string> = {
  受益人姓名: '你的姓名（受益人 / Beneficiary）',
  申请主体名称: '为你提出申请的公司或代理人（Petitioner）',
  申请主体: '申请公司或代理人（Petitioner）',
  申请支持信: '申请说明信（Petition Support Letter）',
  律师准备包: '律所沟通包（Counsel Brief）',
  律所沟通包: '律所沟通包（Counsel Brief）',
  赴美工作安排: '赴美工作安排（Proposed U.S. Work）',
  'I-129 字段工作表': '工作申请填写工作表（Form I-129）',
  'SS-4 字段工作表': '公司税号填写工作表（Form SS-4 / EIN）',
  'Consultation 判断记录': '专业组织咨询意见核对（Consultation）',
  'RFE / NOID 响应清单': '补件／拟拒通知回复清单（RFE / NOID）',
  'USCIS RFE 补件': '补充证据通知（Request for Evidence / RFE）',
  'USCIS NOID 拟拒': '拟拒绝通知（Notice of Intent to Deny / NOID）',
  '领馆 221(g)': '领馆补充审查（INA 221(g)）',
  '核对 I-94': '核对入境记录（Form I-94）',
  目前不支持: '现有材料尚不足以支持',
  存在冲突: '信息需核对（存在不一致）',
  尚未启用智能分析: '智能分析尚未接入',
  回到申请全貌: '返回了解项目',
  '初步判断 / 从你熟悉的事情开始': '初步评估 / 从实际需求和经历开始',
  开始初步梳理: '开始初步评估',
  '你的初步梳理 / 基于本次点选': '评估结果 / 基于本次实际需求和经历',
  计划递交日期: '总体时间安排',
  获奖与荣誉: '获奖与荣誉（Awards / Prizes）',
  高门槛协会会员: '高门槛专业会员（Membership）',
  关于你的媒体报道: '关于你的报道（Published Material）',
  评审他人的工作: '评审他人的工作（Judging）',
  原创贡献及领域影响: '原创成果与领域影响（Original Contributions）',
  学术文章: '学术文章（Scholarly Articles）',
  关键或必要职责: '关键或必要职责（Critical / Essential Capacity）',
  高薪或其他报酬: '高薪及其他报酬（Salary / Remuneration）',
};
export function translate(value: any, language: Language): any {
  if (language !== 'en')
    return typeof value === 'string' ? terms[value] || value : value;
  if (Array.isArray(value)) return value.map((x) => translate(x, language));
  if (typeof value !== 'string') return value;
  return english[value] ?? english[value.trim()] ?? value;
}

export function formatCopy(
  key: string,
  language: Language,
  ...values: any[]
): string {
  return translate(key, language).replace(
    /\{(\d+)\}/g,
    (_: string, index: string) =>
      String(translate(values[Number(index)] ?? '', language)),
  );
}
