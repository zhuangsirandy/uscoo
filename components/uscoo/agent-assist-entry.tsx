'use client';

import { useState } from 'react';
import { ArrowRight, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from './language';

const SERVICES = {
  evidence: {
    title: ['证据材料核验', 'Evidence review'],
    description: [
      '检查已选材料与杰出经历、个人贡献和 USCIS 标准之间的对应关系。',
      'Review how selected sources support achievements, personal contribution, and the relevant USCIS criteria.',
    ],
    deliverable: [
      '输出逐份核验意见、缺口和下一步补强建议，由你逐项确认。',
      'Receive source-by-source findings, gaps, and strengthening suggestions for your review.',
    ],
  },
  draft: {
    title: ['文书修改与一致性检查', 'Document revision and consistency review'],
    description: [
      '检查选定文书与已确认事实、证据引用以及公司工作安排是否一致。',
      'Check selected drafts against confirmed facts, source citations, and petitioner work arrangements.',
    ],
    deliverable: [
      '输出可定位到原文的修改建议与冲突清单，不会自动替你定稿。',
      'Receive source-linked revision suggestions and a conflict list; nothing is finalized automatically.',
    ],
  },
  filing: {
    title: ['递交前组卷检查', 'Pre-filing package review'],
    description: [
      '核对最终材料目录、关键字段、版本、签字项和递交前七项检查。',
      'Review the final index, core facts, versions, signature items, and seven pre-filing gates.',
    ],
    deliverable: [
      '输出递交前待处理事项；正式签署、付款和递交仍由你或受托方完成。',
      'Receive a pre-filing action list; signing, payment, and filing remain with you or your authorized representative.',
    ],
  },
} as const;

export default function AgentAssistEntry({
  stage,
}: {
  stage: keyof typeof SERVICES;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'scope' | 'credits'>('scope');
  const service = SERVICES[stage];

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setPhase('scope');
  }

  return (
    <>
      <section className="agent-assist-entry" data-agent-stage={stage}>
        <span className="agent-assist-icon" aria-hidden="true">
          <Sparkles size={19} />
        </span>
        <div>
          <small>
            {t(
              '自主申请 · 可选 Agent 协助',
              'Self-filing · optional Agent help',
            )}
          </small>
          <strong>{t(service.title[0], service.title[1])}</strong>
          <p>
            {t(
              '继续自主准备不受影响。只有你主动选择 Agent 协助后，才会显示本步骤的服务范围、所需申请积分与支付确认。',
              'You can continue self-filing without interruption. Scope, application credits, and payment confirmation appear only if you actively select Agent help.',
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          {t('查看本步骤 Agent 服务', 'View Agent service for this step')}
          <ArrowRight size={15} />
        </Button>
      </section>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="agent-assist-dialog sm:max-w-[650px]">
          {phase === 'scope' ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t(service.title[0], service.title[1])}
                </DialogTitle>
                <DialogDescription>
                  {t(service.description[0], service.description[1])}
                </DialogDescription>
              </DialogHeader>
              <div className="agent-assist-scope">
                <div>
                  <ShieldCheck size={18} />
                  <span>
                    <strong>{t('本次交付', 'Deliverable')}</strong>
                    <small>
                      {t(service.deliverable[0], service.deliverable[1])}
                    </small>
                  </span>
                </div>
                <div>
                  <CreditCard size={18} />
                  <span>
                    <strong>{t('使用规则', 'How activation works')}</strong>
                    <small>
                      {t(
                        '先选择处理材料，再显示所需申请积分和价格；由你确认支付，支付成功后才解锁处理。',
                        'Select the materials first, then review the required application credits and price. Processing unlocks only after you confirm payment.',
                      )}
                    </small>
                  </span>
                </div>
              </div>
              <p className="agent-assist-safety">
                {t(
                  '未确认支付不会扣除积分、不会运行服务，也不会自动签署、付款或递交。',
                  'No credits are deducted and no service runs before payment confirmation. Nothing is signed, paid, or filed automatically.',
                )}
              </p>
              <div className="agent-assist-actions">
                <Button variant="ghost" onClick={() => changeOpen(false)}>
                  {t('暂不使用，继续自主准备', 'Not now; continue self-filing')}
                </Button>
                <Button onClick={() => setPhase('credits')}>
                  {t('查看所需申请积分', 'Review required credits')}
                  <ArrowRight size={15} />
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('确认积分与支付', 'Credits and payment')}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    '正式开放后，系统会按你选定的材料范围显示所需申请积分、可用余额和应付金额，再由你确认。',
                    'At launch, the system will show required application credits, available balance, and the amount due for the selected materials before you confirm.',
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="agent-credit-preview">
                <div>
                  <span>{t('所选服务', 'Selected service')}</span>
                  <strong>{t(service.title[0], service.title[1])}</strong>
                </div>
                <div>
                  <span>
                    {t('所需申请积分', 'Application credits required')}
                  </span>
                  <strong>
                    {t('选择材料后计算', 'Calculated after material selection')}
                  </strong>
                </div>
                <div>
                  <span>{t('应付金额', 'Amount due')}</span>
                  <strong>{t('支付前确认', 'Confirmed before payment')}</strong>
                </div>
              </div>
              <p className="agent-assist-safety">
                {t(
                  '当前内测版尚未开放支付，因此不会产生费用或运行付费服务。',
                  'Payments are not open in this private beta, so no charge or paid service will run.',
                )}
              </p>
              <div className="agent-assist-actions">
                <Button variant="ghost" onClick={() => setPhase('scope')}>
                  {t('返回服务说明', 'Back to service details')}
                </Button>
                <Button disabled>
                  {t('支付通道开放后可用', 'Available when payments open')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
