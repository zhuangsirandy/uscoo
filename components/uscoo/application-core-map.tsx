'use client';

import {
  ArrowRight,
  Building2,
  FileCheck2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CRITERIA, getGateState, type CaseData } from '@/lib/case-domain';
import { useI18n } from './language';

const BENEFICIARY_CHAIN = [
  ['收集', 'Collect'],
  ['对标', 'Map'],
  ['筛选', 'Screen'],
  ['整理', 'Organize'],
  ['优化', 'Strengthen'],
  ['编排', 'Assemble'],
  ['核对', 'Verify'],
  ['封装', 'Package'],
  ['递交与跟进', 'File & track'],
] as const;

const PETITIONER_CHAIN = [
  ['目标与实体', 'Goal & entity'],
  ['注册与 EIN', 'Formation & EIN'],
  ['治理与授权', 'Governance'],
  ['运营前准备', 'Operations setup'],
  ['工作安排', 'Proposed work'],
  ['I-129 字段', 'I-129 fields'],
  ['对齐与封装', 'Align & package'],
] as const;

export default function ApplicationCoreMap({
  data,
  onNavigate,
}: {
  data: CaseData;
  onNavigate: (step: string) => void;
}) {
  const { t } = useI18n();
  const { profile } = data.project;
  const records = data.records;
  const evidence = records.filter((record) => record.kind === 'evidence');
  const reviewedEvidence = evidence.filter(
    (record) =>
      record.body.status === 'reviewed' &&
      record.body.confirmed &&
      record.body.authenticity === 'checked',
  ).length;
  const companyTasks = records.filter(
    (record) => record.kind === 'task' && record.body.track === 'company',
  );
  const companyDone = companyTasks.filter(
    (record) => record.body.state === 'done',
  ).length;
  const aligned = [
    profile.name,
    profile.company,
    profile.role,
    profile.duties,
    profile.start,
    profile.end,
    profile.pay,
    profile.workplace,
  ].filter(Boolean).length;
  const canonical = records.filter(
    (record) => record.kind === 'document' && record.body.state === 'canonical',
  ).length;
  const gateCount = getGateState(records).filter((gate) => gate.ok).length;

  return (
    <section className="application-core-map">
      <div className="core-map-heading">
        <div>
          <p className="eyebrow">
            {t('USCOO 申请工作链', 'USCOO application workflow')}
          </p>
          <h2>
            {t(
              '一份申请，两类主体，两条线，最终形成同一份可追溯申请包。',
              'One petition, two parties, two preparation tracks, and one traceable final packet.',
            )}
          </h2>
          <p>
            {t(
              '系统把事实、原件、标准、任务、文书版本和递交事件连在一起。每一步都保留来源与状态，发现冲突就回到原始记录处理。',
              'The workspace connects facts, source files, standards, tasks, document versions, and filing events. Every step retains its source and status so conflicts can be resolved against the original record.',
            )}
          </p>
        </div>
        <Badge variant="outline" className="ready">
          <ShieldCheck size={14} />
          {t('资料与状态可追溯', 'Sources and status remain traceable')}
        </Badge>
      </div>

      <div className="core-map-tracks">
        <article>
          <div className="core-track-title">
            <Building2 size={21} />
            <span>
              <small>{t('申请人 / 申请公司', 'Petitioner')}</small>
              <strong>
                {t('公司准备与申请事实线', 'Company and petition facts')}
              </strong>
            </span>
          </div>
          <div className="core-chain">
            {PETITIONER_CHAIN.map(([zh, en], index) => (
              <span key={zh}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                {t(zh, en)}
              </span>
            ))}
          </div>
          <p>
            {t(
              `${companyDone} / ${companyTasks.length} 项公司任务已完成`,
              `${companyDone} of ${companyTasks.length} company tasks completed`,
            )}
          </p>
          <button type="button" onClick={() => onNavigate('profile')}>
            {t('进入申请公司准备', 'Open petitioner preparation')}
            <ArrowRight size={15} />
          </button>
        </article>

        <article>
          <div className="core-track-title">
            <UserRound size={21} />
            <span>
              <small>{t('杰出人才 / 受益人', 'Beneficiary')}</small>
              <strong>
                {t('个人杰出能力证明线', 'Extraordinary ability evidence')}
              </strong>
            </span>
          </div>
          <div className="core-chain beneficiary">
            {BENEFICIARY_CHAIN.map(([zh, en], index) => (
              <span key={zh}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                {t(zh, en)}
              </span>
            ))}
          </div>
          <p>
            {t(
              `${reviewedEvidence} 份材料完成来源核对 · ${CRITERIA.length} 类标准逐项映射`,
              `${reviewedEvidence} sources reviewed · ${CRITERIA.length} criteria mapped individually`,
            )}
          </p>
          <button type="button" onClick={() => onNavigate('story')}>
            {t('进入受益人证明准备', 'Open beneficiary evidence preparation')}
            <ArrowRight size={15} />
          </button>
        </article>
      </div>

      <div className="core-map-merge">
        <FileCheck2 size={22} />
        <div>
          <strong>
            {t(
              '双线对齐与最终封装',
              'Cross-track alignment and final packaging',
            )}
          </strong>
          <p>
            {t(
              '姓名、主体、职位、职责、日期、报酬与工作地点必须在表格、合同、支持信、商业材料和证据引用中保持一致。',
              'Names, petitioner, role, duties, dates, pay, and work locations must stay consistent across forms, agreements, support letters, business records, and evidence references.',
            )}
          </p>
        </div>
        <dl>
          <div>
            <dt>{t('关键字段已填写', 'Core facts completed')}</dt>
            <dd>{aligned} / 8</dd>
          </div>
          <div>
            <dt>{t('已确认定稿', 'Canonical documents')}</dt>
            <dd>{canonical}</dd>
          </div>
          <div>
            <dt>{t('递交当天要核对的 7 项', 'Seven filing-day checks')}</dt>
            <dd>{gateCount} / 7</dd>
          </div>
        </dl>
        <button type="button" onClick={() => onNavigate('draft')}>
          {t('进入编排与核对', 'Open assembly and review')}
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
