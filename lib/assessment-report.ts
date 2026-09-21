import {
  EXPERIENCE,
  COMPANY_LABEL,
  TIMING_LABEL,
  APPLICATION_PATH_LABEL,
  keywordHints,
} from './founder-intake';
import { translate, type Language } from './translations';

export type ReportInput = {
  language: Language;
  location: string;
  timing: string;
  company: string;
  applicationPath: string;
  assessment: {
    currentWork: string;
    standoutStory: string;
    sourceText?: string;
    answers: Record<string, string | undefined>;
  };
};

function reportTools(input: ReportInput) {
  const en = input.language === 'en';
  const t = (zh: string, english?: string) =>
    en && english ? english : String(translate(zh, input.language));
  const {
    currentWork,
    standoutStory,
    sourceText = '',
    answers,
  } = input.assessment;
  const hints = keywordHints(
    [currentWork, standoutStory, sourceText].filter(Boolean).join('\n'),
  );
  const goals = [
    t('所在地', 'Location') +
      ': ' +
      ({
        CN: t('中国大陆', 'Mainland China'),
        US: t('美国', 'United States'),
        other: t('其他国家或地区', 'Other country or region'),
      }[input.location] || input.location),
    t((TIMING_LABEL as Record<string, string>)[input.timing] || ''),
    t((COMPANY_LABEL as Record<string, string>)[input.company] || ''),
    t(
      (APPLICATION_PATH_LABEL as Record<string, string>)[
        input.applicationPath
      ] || '',
    ),
  ];
  return { t, currentWork, standoutStory, sourceText, answers, hints, goals };
}

/**
 * A short, ungated copy of what is already visible on the result page.
 * The full eight-criterion analysis remains in assessmentReport().
 */
export function assessmentSnapshot(input: ReportInput) {
  const { t, answers, hints, goals } = reportTools(input);
  const directions = EXPERIENCE.filter(
    (item) => answers[item.id] === 'yes' || hints.includes(item.id),
  ).slice(0, 3);
  return [
    'USCOO · ' + t('当前结果摘要', 'Current result summary'),
    t(
      '这是页面当前结果的简要副本，不是完整评估报告，也不是获批概率、法律意见或资格结论。',
      'This is a short copy of the current on-screen result. It is not the full assessment report, an approval probability, legal advice or an eligibility decision.',
    ),
    '',
    t('申请目标', 'Application goals'),
    ...goals,
    '',
    t('值得先核实的方向', 'Directions worth verifying first'),
    ...(directions.length
      ? directions.map((item) => '• ' + t(item.title))
      : [
          '• ' +
            t(
              '先补充一件具体经历，再判断最值得核实的方向。',
              'Add one specific achievement before choosing the strongest direction to verify.',
            ),
        ]),
    '',
    t('先找这三样', 'Find these three things first'),
    '1. ' +
      t(
        '能说明行动与结果发生时间的日期或时间线。',
        'Dates or a timeline showing when the action and result occurred.',
      ),
    '2. ' +
      t(
        '当时形成的原始记录、链接或文件。',
        'Original records, links or files created at the time.',
      ),
    '3. ' +
      t(
        '能够独立核对你个人作用与结果的第三方来源。',
        'Independent sources that can verify your role and the outcome.',
      ),
    '',
    t(
      '完整评估报告包含八项标准的逐项线索、尚待确认事项和材料建议；请在结果页保存姓名或称呼与邮箱后获取。',
      'The full report includes criterion-by-criterion leads, unresolved questions and evidence suggestions. Save your name and email on the result page to get it.',
    ),
    t('继续准备', 'Continue preparing') +
      ': https://www.uscoo.ai/beta?view=result',
    'USCOO: coo@uscoo.ai',
  ].join('\n');
}

export function assessmentReport(input: ReportInput) {
  const { t, currentWork, standoutStory, sourceText, answers, hints, goals } =
    reportTools(input);
  return [
    'USCOO · ' +
      t('初步评估与下一步准备清单', 'Initial assessment and next steps'),
    t(
      '基于本人自述和规则提示，尚未核验。不是获批概率、法律意见或资格结论。',
      'Based on self-reported information and rule-based prompts, not verified. This is not an approval probability, legal advice or an eligibility decision.',
    ),
    '',
    t('申请目标', 'Application goals'),
    ...goals,
    '',
    t('当前工作', 'Current work') + ': ' + currentWork,
    t('一件具体经历', 'One defining achievement') + ': ' + standoutStory,
    ...(sourceText
      ? ['', t('导入的经历文字', 'Imported experience'), sourceText]
      : []),
    '',
    t(
      '八项标准：线索与待核对材料',
      'Eight criteria: leads and evidence to check',
    ),
    ...EXPERIENCE.map((item) => {
      const selected = answers[item.id] === 'yes';
      const hinted = hints.includes(item.id);
      const state = selected
        ? t('你主动提到的线索', 'Self-reported lead')
        : hinted
          ? t('文字提示，需你确认', 'Text-based suggestion; please confirm')
          : t('尚未确认线索', 'No confirmed lead yet');
      return '\n' + t(item.title) + '\n' + state + '\n' + t(item.next);
    }),
    '',
    t('现在先做一件事', 'One thing to do next'),
    t(
      '选最有把握的一段经历，保留能证明“你做了什么、结果是什么、谁能核对”的原始记录。没有美国公司也可以先整理经历。',
      'Choose your strongest experience and collect original records of your actions, results and independent verification. You can begin before forming a U.S. company.',
    ),
    '',
    t('继续准备', 'Continue preparing') +
      ': https://www.uscoo.ai/beta?view=result',
    t(
      '该链接不包含你的私有报告；请保留本邮件或下载的副本。',
      'This link does not contain your private report. Keep this email or your downloaded copy.',
    ),
    'USCIS: https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-4',
    'USCOO: coo@uscoo.ai',
  ].join('\n');
}
