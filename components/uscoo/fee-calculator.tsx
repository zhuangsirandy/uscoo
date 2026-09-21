'use client';
import { Calculator, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Choice } from './case-editor';
import { Input } from '@/components/ui/input';
import { useI18n, useDraftState } from './language';
import { estimateFees, FEE_SOURCES, type FeeInput } from '@/lib/fee-estimate';
export default function FeeCalculator() {
  const { t } = useI18n();
  const [employer, setEmployer] = useDraftState<FeeInput['employer']>(
      'feeEmployer',
      'unknown',
    ),
    [premium, setPremium] = useDraftState('feePremium', false),
    [route, setRoute] = useDraftState<FeeInput['route']>('feeRoute', 'unknown');
  const [legal, setLegal] = useDraftState('feeLegal', ''),
    [translation, setTranslation] = useDraftState('feeTranslation', ''),
    [other, setOther] = useDraftState('feeOther', '');
  const extra = [legal, translation, other].reduce(
    (sum, s) =>
      sum + (Number.isFinite(Number(s)) && Number(s) > 0 ? Number(s) : 0),
    0,
  );
  const fees = estimateFees({ employer, premium, route, services: extra });
  const money = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  const range = (v: [number, number]) =>
    v[0] === v[1] ? money(v[0]) : `${money(v[0])} – ${money(v[1])}`;
  return (
    <section className="fee-calculator" id="fees">
      <div className="fee-heading">
        <Calculator size={23} />
        <div>
          <h2>{t('政府官方行政费用估算', 'Government filing fee estimate')}</h2>
          <p>
            {t(
              '按一位 O-1A 受益人、一次纸质申请估算。选择条件后即时更新；不在这里付款。',
              'Estimate for one O-1A beneficiary and one paper petition. Change the options to update the estimate. No payment is collected here.',
            )}
          </p>
        </div>
      </div>
      <p className="fee-disclosure">
        {t(
          '以下 I-129、I-907 和适用的领馆费用是政府行政费用，不是 USCOO 平台服务费。第三方服务预算由你另行填写，与政府费用分开列示。',
          'I-129, I-907 and applicable consular charges below are government administrative fees, not USCOO platform service fees. Any third-party service budget you enter is listed separately.',
        )}
      </p>
      <details className="term-guide">
        <summary>{t('这些费用名称是什么意思？', 'What do these fee names mean?')}</summary>
        <dl>
          <dt>I-129</dt><dd>{t('美国公司或代理人为你提出工作身份申请使用的表格。', 'The form a U.S. employer or agent uses to petition for your work classification.')}</dd>
          <dt>{t('庇护项目附加费', 'Asylum Program Fee')}</dt><dd>{t('这是适用于相关雇主申请的行政附加费，名称并不意味着你在申请庇护。是否减免取决于雇主类别。', 'An administrative charge on applicable employer petitions. Its name does not mean you are applying for asylum. Reductions and exemptions depend on the employer category.')}</dd>
          <dt>I-907</dt><dd>{t('自愿选择的加急申请。本估算采用 2026 年 3 月 1 日起 O-1 适用的 $2,965；加急不保证批准。', 'An optional premium-processing request. This estimate uses $2,965 for O-1 requests effective March 1, 2026. Premium processing does not guarantee approval.')}</dd>
          <dt>MRV</dt><dd>{t('在领馆申请签证时可能需要的签证申请费，和美国境内的工作申请费分开。', 'A visa application fee for consular processing, separate from the U.S. worker petition fee.')}</dd>
        </dl>
      </details>
      <div className="fee-layout">
        <div className="fee-inputs">
          <label>
            {t('申请公司类型', 'Petitioning employer')}
            <Choice
              label={t('申请公司类型', 'Petitioning employer')}
              value={employer}
              onChange={(v) => setEmployer(v as typeof employer)}
              options={[
                ['unknown', t('尚不确定，先看范围', 'Not sure — show a range')],
                [
                  'small',
                  t(
                    '小型雇主：美国全职等值雇员不超过 25 人',
                    'Small employer: 25 or fewer U.S. FTE employees',
                  ),
                ],
                [
                  'regular',
                  t(
                    '其他雇主：超过 25 人',
                    'Other employer: more than 25 U.S. FTE employees',
                  ),
                ],
                [
                  'nonprofit',
                  t(
                    '符合规定的非营利组织',
                    'Qualifying nonprofit organization',
                  ),
                ],
              ]}
            />
            <small>
              {t(
                '人数计算需包含关联公司及子公司；非营利资格需另行核实。',
                'Include affiliates and subsidiaries in the employee count. Nonprofit eligibility must be confirmed.',
              )}
            </small>
          </label>
          <label>
            {t(
              '是否加急 / Premium Processing',
              'Premium processing — Form I-907',
            )}
            <Choice
              label={t('加急办理', 'Premium processing')}
              value={premium ? 'yes' : 'no'}
              onChange={(v) => setPremium(v === 'yes')}
              options={[
                ['no', t('暂不加急', 'Standard processing')],
                ['yes', t('申请加急', 'Request premium processing')],
              ]}
            />
          </label>
          <label>
            {t('预计办理路径', 'Expected processing route')}
            <Choice
              label={t('预计办理路径', 'Expected processing route')}
              value={route}
              onChange={(v) => setRoute(v as typeof route)}
              options={[
                ['unknown', t('尚未确定', 'Not decided')],
                [
                  'us',
                  t(
                    '在美变更或延长身份 / Change or Extension of Status',
                    'Change or extension of status in the U.S.',
                  ),
                ],
                [
                  'consular',
                  t(
                    '境外申请签证 / Consular Processing',
                    'Consular processing abroad',
                  ),
                ],
              ]}
            />
          </label>
          <details className="service-budget">
            <summary>
              <span>
                <strong>
                  {t(
                    '第三方服务预算（可选）',
                    'Third-party service budget (optional)',
                  )}
                </strong>
                <small>
                  {t(
                    '展开填写律师、翻译及其他服务预算',
                    'Expand to add legal, translation and other service estimates',
                  )}
                </small>
              </span>
              <span>
                {extra > 0
                  ? t(`已填写 ${money(extra)}`, `${money(extra)} entered`)
                  : t('3 类费用可填写', '3 categories available')}
                <ChevronDown size={16} />
              </span>
            </summary>
            {[
              [t('律师预算', 'Legal services'), legal, setLegal],
              [t('翻译预算', 'Translation'), translation, setTranslation],
              [t('其他预算', 'Other costs'), other, setOther],
            ].map(([name, value, set]: any) => (
              <label key={name}>
                {name} · USD
                <Input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={t('未填表示未计入', 'Blank = not included')}
                />
              </label>
            ))}
          </details>
        </div>
        <div className="fee-result" aria-live="polite">
          <span>
            {t('政府费用小计 · USD', 'Government fees subtotal · USD')}
          </span>
          <strong>{range(fees.government)}</strong>
          <p>
            {t(
              '未确定的条件显示为范围。第三方预算留空时不计入。',
              'Uncertain inputs produce a range. Blank service estimates are excluded.',
            )}
          </p>
          <dl>
            {[
              [
                t('工作申请费 · I-129 (O)', 'Worker petition · I-129 (O)'),
                fees.base,
              ],
              [
                t('庇护项目附加费 · Asylum Program Fee', 'Asylum Program Fee'),
                fees.asylum,
              ],
              [
                t('加急申请 · I-907', 'Premium processing · I-907'),
                fees.premium,
              ],
              [
                t('领馆签证申请费 · MRV', 'Consular visa application · MRV'),
                fees.visa,
              ],
            ].map(([name, amount]) => (
              <div key={name as string}>
                <dt>{name as string}</dt>
                <dd>{range(amount as [number, number])}</dd>
              </div>
            ))}
            <div>
              <dt>{t('自行填写的服务预算', 'Your service estimates')}</dt>
              <dd>{money(extra)}</dd>
            </div>
            {extra > 0 && (
              <div>
                <dt>
                  {t(
                    '政府费用与自填服务预算合计',
                    'Government fees + your service budget',
                  )}
                </dt>
                <dd>{range(fees.total)}</dd>
              </div>
            )}
          </dl>
          <small>
            {t(
              '不含家属申请、公司设立与运营、可能适用的额外签证费或互惠费，以及尚未填写的服务费。加急只缩短适用审理环节，不保证批准。',
              'Excludes dependent applications, company setup and operations, any additional visa or reciprocity fees, and services not entered above. Premium processing does not guarantee approval.',
            )}
          </small>
        </div>
      </div>
      <div className="fee-sources">
        <span>
          {t(
            '估算依据核对：2026-09-08；递交时再确认适用费用。',
            'Reference check: September 8, 2026. Recheck the applicable fees before filing.',
          )}
        </span>
        {Object.entries(FEE_SOURCES).map(([id, href]) => (
          <a key={id} href={href} target="_blank" rel="noreferrer">
            {id === 'base'
              ? 'I-129 / Asylum Program Fee'
              : id === 'premium'
                ? 'I-907'
                : 'Visa / MRV'}
            <ArrowUpRight size={12} />
          </a>
        ))}
      </div>
    </section>
  );
}
