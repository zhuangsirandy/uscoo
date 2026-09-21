'use client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Choice } from './case-editor';
import { useI18n } from './language';
import { COMPANY_LABEL, TIMING_LABEL } from '@/lib/founder-intake';
export type Intent = {
  desiredApproval: string;
  arrivalDate: string;
  workStartDate: string;
  location: string;
  workPlan: string;
};
export function IntentForm({
  value,
  onChange,
  company,
  setCompany,
  approvalWindow,
  setApprovalWindow,
  field,
  setField,
}: {
  value: Intent;
  onChange: (v: Intent) => void;
  company?: keyof typeof COMPANY_LABEL;
  setCompany?: (v: keyof typeof COMPANY_LABEL) => void;
  approvalWindow?: keyof typeof TIMING_LABEL | '';
  setApprovalWindow?: (v: keyof typeof TIMING_LABEL) => void;
  field?: string;
  setField?: (v: string) => void;
}) {
  const { t } = useI18n();
  const set = (key: keyof Intent, text: string) =>
    onChange({ ...value, [key]: text });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="intent-form">
      <div>
        <p className="founder-eyebrow">
          {t('先说清楚你的实际需求', 'Start with your actual needs')}
        </p>
        <h2>
          {t(
            '希望什么时候获批，去美国做什么？',
            'When do you hope to be approved, and what will you do in the U.S.?',
          )}
        </h2>
        <p>
          {t(
            setApprovalWindow
              ? '请明确选择一个期望时间范围；有具体目标日期时再填写日期。获批、取得签证、入境和开始工作是不同节点。'
              : '不确定的日期可以留空。获批、取得签证、入境和开始工作是不同节点，后续会分别安排。',
            setApprovalWindow
              ? 'Choose an expected decision window. Add exact dates when you have them. Petition approval, visa issuance, entry, and work authorization are separate milestones.'
              : 'Leave uncertain dates blank. Petition approval, visa issuance, entry, and work authorization are separate milestones.',
          )}
        </p>
      </div>
      <div className="intent-grid">
        {setApprovalWindow && (
          <fieldset className="intent-required">
            <legend>
              {t(
                '期望多久获得申请结果',
                'Expected petition decision window',
              )}
              <span>{t('必答', 'Required')}</span>
            </legend>
            <RadioGroup
              value={approvalWindow || ''}
              onValueChange={(v) =>
                setApprovalWindow(v as keyof typeof TIMING_LABEL)
              }
            >
              {Object.entries(TIMING_LABEL).map(([id, label]) => (
                <label key={id} data-selected={approvalWindow === id}>
                  <RadioGroupItem value={id} />
                  {t(label)}
                </label>
              ))}
            </RadioGroup>
          </fieldset>
        )}
        {setField && (
          <label>
            {t('希望继续从事的专业领域', 'Field of proposed work')}
            <Input
              maxLength={120}
              value={field || ''}
              onChange={(e) => setField(e.target.value)}
              placeholder={t(
                '例如：企业软件、生命科学、品牌经营',
                'For example: enterprise software, life sciences, or brand operations',
              )}
            />
          </label>
        )}
        <label>
          {t('目前所在地', 'Current location')}
          <Choice
            value={value.location}
            onChange={(v) => set('location', v)}
            options={[
              ['unknown', t('暂不确定 / 稍后填写', 'Not specified')],
              ['US', t('美国', 'United States')],
              ['CN', t('中国大陆', 'Mainland China')],
              ['other', t('其他国家或地区', 'Another country or region')],
            ]}
          />
        </label>
        {setCompany && (
          <label>
            {t('有无申请公司', 'Petitioning company')}
            <Choice
              value={company || 'unknown'}
              onChange={(v) => setCompany(v as keyof typeof COMPANY_LABEL)}
              options={Object.entries(COMPANY_LABEL).map(([id, name]) => [
                id,
                t(name),
              ])}
            />
          </label>
        )}
        {[
          [
            'desiredApproval',
            t(
              '希望申请获批日期',
              'Target petition approval date',
            ),
          ],
          [
            'arrivalDate',
            t('预计赴美日期', 'Target U.S. arrival date'),
          ],
          [
            'workStartDate',
            t('希望开始工作日期', 'Target work start date'),
          ],
        ].map(([id, name]) => (
          <label key={id}>
            {name}
            <Input
              type="date"
              value={value[id as keyof Intent]}
              onChange={(e) => set(id as keyof Intent, e.target.value)}
              aria-label={name}
            />
          </label>
        ))}
      </div>
      <label>
        {t('赴美具体计划', 'Proposed U.S. work')}
        <Textarea
          value={value.workPlan}
          maxLength={2000}
          onChange={(e) => set('workPlan', e.target.value)}
          rows={3}
          placeholder={t(
            '例如：在美国经营什么业务、担任什么角色、未来一年准备完成哪些工作。',
            'For example: your U.S. business, role, and the work you plan to carry out over the next year.',
          )}
        />
      </label>
      {[value.desiredApproval, value.arrivalDate, value.workStartDate].some(
        (d) => d && d < today,
      ) && (
        <p className="intent-note" role="status">
          {t(
            '有日期早于今天。若这是历史记录可以保留；若是新的目标，请更新后再安排准备工作。',
            'A date is in the past. Keep it for a historical record, or update it if this is a new target.',
          )}
        </p>
      )}
      {value.workStartDate &&
        value.desiredApproval &&
        value.workStartDate < value.desiredApproval && (
          <p className="intent-note">
            {t(
              '工作开始日早于希望获批日。请核对现有工作授权与办理路径，避免把计划日期当作已获工作许可。',
              'The work start date precedes your target approval. Check your existing work authorization and processing route before relying on this schedule.',
            )}
          </p>
        )}
      <small>
        {t(
          '这些日期用于准备计划，不代表系统承诺获批、签证签发或可以开始工作。',
          'These dates guide preparation; they do not guarantee approval, visa issuance, or permission to work.',
        )}
      </small>
    </section>
  );
}
