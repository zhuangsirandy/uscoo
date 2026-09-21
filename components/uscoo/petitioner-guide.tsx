'use client';
import { useI18n } from './language';
export default function PetitionerGuide() {
  const { t } = useI18n();
  return (
    <section className="founder-section petitioner-guide" id="petitioner">
      <div className="petitioner-guide-heading">
        <div>
          <p className="founder-eyebrow">
            {t(
              '申请公司详情 · Petitioner',
              'Petitioning arrangement · Petitioner',
            )}
          </p>
          <h2>
            {t(
              '先认清你属于哪一种申请主体情况。',
              'Identify which petitioning arrangement fits your current situation.',
            )}
          </h2>
          <p>
            {t(
              '你是受益人（Beneficiary）；提出 Form I-129 的美国雇主或符合要求的美国代理人是申请人（Petitioner）。个人证明与申请主体资料分开准备，最后再对齐。',
              'You are the beneficiary. The U.S. employer or qualifying U.S. agent filing Form I-129 is the petitioner. Personal evidence and petitioner records are prepared separately, then aligned.',
            )}
          </p>
        </div>
        <a
          className="founder-source"
          href="https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-3"
          target="_blank"
          rel="noreferrer"
        >
          {t('查看 USCIS 申请人规则', 'Read USCIS petitioner guidance')}
        </a>
      </div>

      <ol className="petitioner-paths">
        <li>
          <span>01</span>
          <div>
            <h3>{t('已有自己的美国公司', 'You already own a U.S. company')}</h3>
            <p>
              {t(
                '核对独立法人、设立记录、治理与签字权限，再落实你的职位、职责、工作期限、地点和报酬。',
                'Verify the separate legal entity, formation records, governance and signing authority, then document your role, duties, work period, locations and compensation.',
              )}
            </p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>{t('准备成立美国公司', 'You plan to form a U.S. company')}</h3>
            <p>
              {t(
                '先确定公司目标、州与实体类型，再按顺序推进注册、EIN、治理、账户、许可和运营前准备。',
                'Clarify the company goal, state and entity type, then work through formation, EIN, governance, accounts, permits and pre-operation setup.',
              )}
            </p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>
              {t(
                '由其他雇主或美国代理人申请',
                'Another employer or U.S. agent will file',
              )}
            </h3>
            <p>
              {t(
                '核对实际雇主、授权关系、合同、服务日期和地点；代理人情形下还要确认适用的完整行程安排。',
                'Verify the actual employer, authorization, contracts, service dates and locations. Agent filings may also require an applicable itinerary.',
              )}
            </p>
          </div>
        </li>
      </ol>

      <div className="petitioner-next">
        <div>
          <strong>
            {t(
              '现在还不能确定属于哪一种？',
              'Not sure which arrangement applies yet?',
            )}
          </strong>
          <p>
            {t(
              '初步评估只需说明现状和计划，USCOO 会把未决问题带入工作台，不要求你现在就完成公司注册。',
              'The initial assessment only asks for your current situation and plan. USCOO carries unresolved questions into the workspace; you do not need to form a company now.',
            )}
          </p>
        </div>
        <a href="/beta?view=assessment">
          {t('在初评中说明我的情况', 'Add my situation in the assessment')}
        </a>
      </div>

      <div className="petitioner-company-only">
        <strong>
          {t(
            '只想先注册美国公司？',
            'Only want to set up a U.S. company for now?',
          )}
        </strong>
        <p>
          {t(
            '公司准备线可以单独使用，覆盖注册到运营前事项；以后再决定是否作为 O-1A 申请公司。公司成立本身不会被当作个人杰出能力证明。',
            'Use the company track on its own for formation through pre-operation setup, then decide later whether the company will serve as an O-1A petitioner. Formation itself is not evidence of personal extraordinary ability.',
          )}
        </p>
        <a href="/prepare?step=profile">
          {t('查看公司准备线', 'Explore the company preparation track')}
        </a>
      </div>
    </section>
  );
}
