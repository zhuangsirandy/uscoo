'use client';

import {
  ArrowRight,
  Building2,
  Check,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  COMPANY_PLAN_TASKS,
  type Profile,
  type RecordItem,
} from '@/lib/case-domain';
import { Choice } from './case-editor';
import { useI18n } from './language';

const GOALS = [
  [
    'undecided',
    '还没决定申请主体，先比较路径',
    'I have not chosen a petitioning arrangement yet',
  ],
  [
    'new-o1a',
    '成立美国公司，并准备作为 O-1A 申请公司',
    'Form a U.S. company and prepare it as the O-1A petitioner',
  ],
  [
    'existing-o1a',
    '已有美国公司，准备作为 O-1A 申请公司',
    'Prepare an existing U.S. company as the O-1A petitioner',
  ],
  [
    'company-only',
    '目前只完成美国公司注册及运营前准备',
    'Company formation and pre-operation setup only',
  ],
  [
    'external-petitioner',
    '由其他美国雇主或合格的美国代理人提出申请',
    'Use another U.S. employer or a qualifying U.S. agent',
  ],
] as const;

function wanted(goal: Profile['companyGoal']) {
  const scopes =
    goal === 'company-only'
      ? ['company']
      : goal === 'external-petitioner'
        ? ['o1a', 'external']
        : goal === 'new-o1a' || goal === 'existing-o1a'
          ? ['company', 'o1a']
          : [];
  return COMPANY_PLAN_TASKS.filter(
    (task) =>
      task.key === 'company-scope' ||
      task.scopes.some((scope) => scopes.includes(scope)),
  );
}

export default function CompanyPlan({
  profile,
  tasks,
  busy,
  onChange,
  onGenerate,
  onOpenTask,
  onOpenTasks,
}: {
  profile: Profile;
  tasks: RecordItem[];
  busy: boolean;
  onChange: (profile: Profile) => void;
  onGenerate: () => void;
  onOpenTask: (task: RecordItem) => void;
  onOpenTasks: () => void;
}) {
  const { t } = useI18n();
  const goal = profile.companyGoal || 'undecided';
  const plan = wanted(goal);
  const byKey = new Map(
    tasks
      .filter((task) => task.body.track === 'company' && task.body.planKey)
      .map((task) => [task.body.planKey, task]),
  );
  const done = plan.filter(
    (item) => byKey.get(item.key)?.body.state === 'done',
  ).length;

  return (
    <section className="surface company-plan">
      <div className="company-plan-heading">
        <div>
          <p className="eyebrow">
            {t('申请公司准备', 'Petitioning company preparation')}
          </p>
          <h2>
            {t(
              '从公司注册到申请材料，不漏掉中间的运营准备。',
              'From company formation to petition evidence, keep every preparation step connected.',
            )}
          </h2>
          <p>
            {t(
              '这条线可独立用于美国公司注册与运营前准备；用于 O-1A 时，再把公司事实与受益人的职位、职责、日期、报酬和工作地点逐项对齐。',
              'This track can stand alone for U.S. company formation and pre-operation setup. For O-1A, it also aligns company facts with the beneficiary’s role, duties, dates, pay, and work locations.',
            )}
          </p>
        </div>
        <Building2 size={26} />
      </div>

      <div className="company-plan-controls">
        <label>
          <span>{t('本次公司准备目标', 'Company preparation goal')}</span>
          <Choice
            value={goal}
            onChange={(value) =>
              onChange({
                ...profile,
                companyGoal: value as Profile['companyGoal'],
              })
            }
            options={GOALS.map(([value, zh, en]) => [value, t(zh, en)])}
          />
        </label>
        <label>
          <span>
            {t('拟采用的实体类型', 'Entity type under consideration')}
          </span>
          <Choice
            value={profile.entityType || 'undecided'}
            onChange={(value) => onChange({ ...profile, entityType: value })}
            options={[
              ['undecided', t('尚待比较', 'Not decided')],
              ['llc', 'LLC'],
              ['corporation', t('Corporation（公司）', 'Corporation')],
              [
                'other',
                t('其他 / 需专业判断', 'Other / professional review needed'),
              ],
            ]}
          />
        </label>
        <label>
          <span>{t('注册州或实际经营州', 'Formation or operating state')}</span>
          <Input
            value={profile.formationState || ''}
            maxLength={120}
            onChange={(event) =>
              onChange({ ...profile, formationState: event.target.value })
            }
            placeholder={t('例如：California', 'For example: California')}
          />
        </label>
        <label>
          <span>{t('公司当前阶段', 'Current company stage')}</span>
          <Choice
            value={profile.formationStatus || 'not-started'}
            onChange={(value) =>
              onChange({
                ...profile,
                formationStatus: value as Profile['formationStatus'],
              })
            }
            options={[
              ['not-started', t('尚未开始', 'Not started')],
              ['choosing', t('正在选择州和实体', 'Choosing state and entity')],
              ['filed', t('已提交注册，等待结果', 'Formation filed')],
              ['active', t('公司已成立', 'Entity formed')],
            ]}
          />
        </label>
      </div>

      {goal === 'company-only' && (
        <p className="company-plan-boundary">
          {t(
            '当前选择只管理公司启动事项，不会把公司成立自动解释为满足 O-1A，也不会自动生成移民申请。以后可以在同一项目中切换目标。',
            'This choice manages company setup only. Formation does not establish O-1A eligibility or create an immigration petition. You can change the goal later in the same project.',
          )}
        </p>
      )}
      {goal === 'external-petitioner' && (
        <p className="company-plan-boundary">
          {t(
            '这条路线重点核对外部申请主体、真实工作安排，以及代理人情形下的授权、合同和行程；是否适用由律师或合格专业人士结合事实判断。',
            'This path focuses on the outside petitioner, actual work arrangements, and—when an agent is used—authorization, contracts, and itinerary. Applicability requires case-specific professional review.',
          )}
        </p>
      )}

      <div className="company-plan-progress">
        <div>
          <strong>
            {goal === 'undecided'
              ? t(
                  '先选择目标，再生成对应计划',
                  'Choose a goal to build the right plan',
                )
              : t(
                  `${done} / ${plan.length} 项已完成`,
                  `${done} of ${plan.length} steps completed`,
                )}
          </strong>
          <small>
            {t(
              '计划会加入可编辑任务；每项可记录负责人、日期、费用、来源和完成凭证。',
              'The plan creates editable tasks with ownership, dates, costs, sources, and completion records.',
            )}
          </small>
        </div>
        <Button disabled={busy || goal === 'undecided'} onClick={onGenerate}>
          {t('生成或补齐公司计划', 'Build or complete company plan')}
          <ArrowRight size={16} />
        </Button>
      </div>

      {goal !== 'undecided' && (
        <div className="company-plan-steps">
          {plan.map((item) => {
            const task = byKey.get(item.key);
            const completed = task?.body.state === 'done';
            return (
              <button
                type="button"
                key={item.key}
                disabled={!task}
                onClick={() => task && onOpenTask(task)}
              >
                <span className={completed ? 'complete' : ''}>
                  {completed ? <Check size={15} /> : <Circle size={13} />}
                </span>
                <b>{item.phase}</b>
                <span>
                  <strong>{t(item.title)}</strong>
                  <small>{t(item.notes)}</small>
                </span>
                <Badge variant="outline">
                  {task
                    ? completed
                      ? t('已完成', 'Done')
                      : t('打开任务', 'Open task')
                    : t('待生成', 'Not added')}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      <div className="company-plan-footer">
        <button type="button" className="text-link" onClick={onOpenTasks}>
          {t(
            '查看全部公司任务与原件',
            'View all company tasks and source files',
          )}
          <ArrowRight size={15} />
        </button>
        <a
          href="https://www.sba.gov/counseling/launch-your-business/"
          target="_blank"
          rel="noreferrer"
        >
          {t('SBA 公司启动官方指引', 'SBA official launch guide')}
          <ExternalLink size={13} />
        </a>
      </div>
    </section>
  );
}
