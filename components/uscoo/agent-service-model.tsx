'use client';

import { Bot, Coins, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/lib/case-domain';
import { useI18n } from './language';

export default function AgentServiceModel({
  modelAvailable,
  preparationMode,
  completedRuns,
}: {
  modelAvailable: boolean;
  preparationMode?: Profile['preparationMode'];
  completedRuns: number;
}) {
  const { t } = useI18n();
  return (
    <section className="agent-service-model">
      <div className="agent-service-heading">
        <div>
          <p className="eyebrow">
            {t('USCOO Agent 服务', 'USCOO Agent service')}
          </p>
          <h2>
            {t(
              '先用工作台把资料组织好，再按需启动 Agent。',
              'Organize the case first, then start Agent work only when useful.',
            )}
          </h2>
          <p>
            {t(
              '你购买的是范围和交付物明确的申请工作，而不是无法预测结果的对话。每次运行前都能看到材料范围、预计申请点数和输出。',
              'You purchase application work with a defined scope and deliverable, not an open-ended conversation. Before each run, you see the selected records, estimated application credits and output.',
            )}
          </p>
        </div>
        <Badge variant="outline">
          {modelAvailable
            ? t('限量测试中', 'Limited testing')
            : t(
                '当前未接入模型 · 不产生调用费',
                'Model not connected · no model call charges',
              )}
        </Badge>
      </div>

      <div className="agent-service-levels">
        <article>
          <div>
            <LockKeyhole size={20} />
            <span>{t('基础工作台', 'Core workspace')}</span>
          </div>
          <h3>{t('不消耗 Agent 申请点数', 'No Agent credits used')}</h3>
          <p>
            {t(
              '了解项目、初评、清单、任务、材料上传、人工状态记录、费用估算和导出不需要模型自动运行。',
              'Project education, assessment, checklists, tasks, uploads, manual status tracking, fee estimates and exports do not trigger model runs.',
            )}
          </p>
        </article>
        <article>
          <div>
            <Bot size={20} />
            <span>{t('付费 Agent 工作单元', 'Paid Agent work units')}</span>
          </div>
          <h3>
            {t(
              '核验、修改建议与封装前检查',
              'Verification, revision feedback and pre-package review',
            )}
          </h3>
          <p>
            {t(
              '每次运行先显示处理范围、输入材料、预计申请点数和输出；由用户确认后执行，超额续跑默认关闭。',
              'Before each run, show its scope, selected records, estimated application credits and output. The user confirms first, and automatic overage is off by default.',
            )}
          </p>
        </article>
        <article>
          <div>
            <Coins size={20} />
            <span>{t('里程碑服务包', 'Milestone bundles')}</span>
          </div>
          <h3>
            {t(
              '按交付成果购买，而不是直接购买原始 token',
              'Buy defined deliverables, not raw model tokens',
            )}
          </h3>
          <p>
            {t(
              '可按“单份证据预审、单项标准材料包、全案一致性检查、递交前封装检查”出售；申请点数用于控制次数和成本。',
              'Offer evidence review, criterion packs, full-case consistency review and pre-filing package review. Application credits control usage and cost.',
            )}
          </p>
        </article>
      </div>

      <div className="agent-service-rule">
        <ShieldCheck size={20} />
        <p>
          <strong>
            {preparationMode === 'diy'
              ? t('当前路径：DIY + USCOO', 'Current path: DIY + USCOO')
              : preparationMode === 'counsel'
                ? t(
                    '当前路径：律所协作',
                    'Current path: law firm collaboration',
                  )
                : t('尚未选择申请方式', 'Application method not selected')}
          </strong>
          <span>
            {t(
              `已保存 ${completedRuns} 次 Agent 尝试记录。任何模型输出都需用户核对；系统不会自动签署、付款或递交。`,
              `${completedRuns} Agent run records saved. Every model output requires user review; USCOO does not automatically sign, pay or file.`,
            )}
          </span>
        </p>
      </div>
    </section>
  );
}
