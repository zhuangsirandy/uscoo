'use client';

import { ArrowRight, CheckCircle2, FileText, Route } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from './language';

export default function JourneyReviewDialog({
  open,
  onOpenChange,
  projectId,
  preparationMode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  preparationMode?: 'diy' | 'counsel';
}) {
  const { t } = useI18n();
  const project = projectId ? encodeURIComponent(projectId) : '';
  const stages = [
    [
      '01',
      '先看懂',
      '重新查看 O-1A、申请公司、政府费用与完整路径。',
      'About O-1A',
      'Review O-1A, the petitioner, government fees and the complete path.',
      '/beta',
    ],
    [
      '02',
      '说说你的经历',
      '修改当前工作、杰出经历、公司现状与时间目标。',
      'Tell your story',
      'Update your current work, defining achievement, company status and timing.',
      `/beta?view=assessment${project ? `&case=${project}` : ''}`,
    ],
    [
      '03',
      '看看你手上有什么',
      '回看当前方向、已有记录和下一步建议。',
      'See what you have',
      'Review current directions, existing records and next actions.',
      `/beta?view=result${project ? `&case=${project}` : ''}`,
    ],
    [
      '04',
      '还差什么',
      '按 USCIS 标准重新检查公司、赴美工作与个人证明。',
      'What is missing',
      'Recheck the petitioner, proposed work and personal evidence against USCIS criteria.',
      `/pre-review${project ? `?project=${project}` : ''}`,
    ],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="journey-review-dialog max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{t('回看前期路径', 'Review guided steps')}</DialogTitle>
          <DialogDescription>
            {t(
              '正式准备后仍可返回前期步骤修改信息。已有材料、任务和版本不会因此删除。',
              'You can revisit and update earlier steps during formal preparation. Existing evidence, tasks and versions are not deleted.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="journey-review-list">
          {stages.map(([number, zhTitle, zhNote, enTitle, enNote, href]) => (
            <a key={number} href={href}>
              <b>{number}</b>
              <span>
                <strong>{t(zhTitle, enTitle)}</strong>
                <small>{t(zhNote, enNote)}</small>
              </span>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
        <section className="journey-method-return">
          <div className="journey-method-icon">
            <Route />
          </div>
          <div>
            <span>{t('当前申请方式', 'Current application method')}</span>
            <h3>
              {preparationMode === 'counsel'
                ? t('委托律所', 'Law firm collaboration')
                : preparationMode === 'diy'
                  ? t('自主申请', 'Self-filing')
                  : t('尚未选择', 'Not selected')}
            </h3>
            <p>
              {t(
                '律所不是必经环节。你可以回到第 5 步重新比较、选择或切换方式；所有方式继续使用同一份项目记录。',
                'A law firm is optional. Return to step 5 to compare, choose or switch methods; both continue using the same project record.',
              )}
            </p>
          </div>
          <a
            className="founder-button"
            href={`/lawyer${project ? `?project=${project}` : ''}`}
          >
            <FileText size={16} />
            {t('重新选择申请方式', 'Review application method')}
          </a>
        </section>
        <p className="journey-review-note">
          <CheckCircle2 size={15} />
          {t(
            '修改前期事实后，相关文书会标记为待复核，避免旧版本被误当作最终材料。',
            'When earlier facts change, related drafts are marked for review so an old version is not mistaken for final material.',
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
