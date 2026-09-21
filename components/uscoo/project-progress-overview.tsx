'use client';

import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
import type { CaseData } from '@/lib/case-domain';
import { useI18n } from './language';

export default function ProjectProgressOverview({ data }: { data: CaseData; onNavigate: (step: string) => void }) {
  const { t } = useI18n();
  const { profile } = data.project;
  const records = data.records;
  const events = records.filter((record) => record.kind === 'event');
  const evidence = records.filter((record) => record.kind === 'evidence');
  const tasks = records.filter((record) => record.kind === 'task');
  const documents = records.filter((record) => record.kind === 'document');
  const packets = records.filter((record) => record.kind === 'packet');
  const filing = records.filter((record) => record.kind === 'filing');
  const preReviewed = evidence.length > 0 && evidence.every((record) => record.body.status === 'reviewed' || record.body.status === 'withdrawn');
  const documentsDone = documents.length > 0 && documents.every((record) => record.body.state === 'canonical' && !record.body.stale);
  const stages = [
    ['目标与基本信息', 'Goals and basic information', Boolean(profile.target || profile.name || profile.field), Boolean(profile.target || profile.name || profile.field)],
    ['回顾杰出经历', 'Achievement history', events.length > 0, events.length > 0],
    ['收集个人与公司材料', 'Collect personal and company records', evidence.length > 0, evidence.length > 0],
    ['材料预审与对标', 'Document pre-review and mapping', preReviewed, evidence.length > 0],
    ['确定申请方式', 'Choose application method', Boolean(profile.preparationMode), Boolean(profile.preparationMode)],
    ['文书编排与核对', 'Drafting and review', documentsDone, documents.length > 0],
    ['组卷、递交与跟进', 'Package, file and follow up', packets.length > 0 || filing.length > 0, packets.length > 0 || filing.length > 0],
  ] as const;
  return (
    <section className="project-progress-overview">
      <div className="project-progress-heading">
        <div>
          <p className="eyebrow">{t('项目进度', 'Application progress')}</p>
          <h2>{t('已经做到哪里，接下来还有什么。', 'See where you are and what remains.')}</h2>
        </div>
        {(tasks.length > 0 || evidence.length > 0 || documents.length > 0) && (
          <p className="project-progress-facts">
            {tasks.length > 0 && <span>{tasks.filter((record) => record.body.state === 'done').length}/{tasks.length} {t('项任务完成', 'tasks complete')}</span>}
            {evidence.length > 0 && <span>{evidence.filter((record) => record.body.status === 'reviewed').length}/{evidence.length} {t('份材料核对', 'records reviewed')}</span>}
            {documents.length > 0 && <span>{documents.filter((record) => record.body.state === 'canonical' && !record.body.stale).length}/{documents.length} {t('份文书定稿', 'documents final')}</span>}
          </p>
        )}
      </div>
      <ol className="project-progress-timeline status-only">
        {stages.map(([zh, en, complete, started]) => {
          const status = complete ? 'complete' : started ? 'current' : 'later';
          return (
            <li key={zh} data-state={status}>
              <span>{complete ? <CheckCircle2 size={17} /> : started ? <Clock3 size={17} /> : <Circle size={17} />}</span>
              <div>
                <strong>{t(zh, en)}</strong>
                <small>{complete ? t('这一步完成了', 'Complete') : started ? t('进行中', 'In progress') : t('尚未开始', 'Not started')}</small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
