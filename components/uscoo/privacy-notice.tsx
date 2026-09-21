'use client';

import { ArrowLeft, Leaf, Mail, ShieldCheck } from 'lucide-react';
import { LanguageSwitch, useI18n } from './language';

export default function PrivacyNotice() {
  const { t } = useI18n();
  return (
    <div className="founder-app privacy-page">
      <header className="account-header">
        <a href="/" className="marketing-brand">
          <Leaf /> <strong>USCOO</strong>
          <span>{t('隐私说明', 'Privacy notice')}</span>
        </a>
        <LanguageSwitch />
      </header>
      <main className="privacy-main">
        <a href="/" className="privacy-back">
          <ArrowLeft />
          {t('返回首页', 'Back to home')}
        </a>
        <section className="privacy-title">
          <ShieldCheck />
          <p className="founder-eyebrow">
            {t('清楚、克制地收集信息', 'Clear and limited data collection')}
          </p>
          <h1>{t('USCOO 隐私说明', 'USCOO privacy notice')}</h1>
          <p>
            {t('更新日期：2026 年 9 月 9 日', 'Updated: September 9, 2026')}
          </p>
        </section>
        <div className="privacy-sections">
          <section>
            <h2>{t('初步评估前', 'Before you save an assessment')}</h2>
            <p>
              {t(
                '你的回答先保留在当前设备。系统会记录“开始评估、完成三问、查看结果、点击保存”等匿名步骤，用于判断页面是否顺畅；这些事件不包含你的回答正文、护照或身份证件。',
                'Your answers first remain on your device. USCOO records anonymous steps such as starting, completing, viewing results and opening save so we can improve the flow. These events do not contain answer text, passport data or identity documents.',
              )}
            </p>
          </section>
          <section>
            <h2>
              {t('注册与主动保存后', 'After registration and explicit saving')}
            </h2>
            <p>
              {t(
                '首次安全登录会自动建立账号，并带入登录服务提供的账号标识、邮箱和可用的姓名。只有你确认保存后，初步评估内容、项目名称和后续申请材料才会进入按账号隔离的私有项目。登录后，同一设备此前的匿名评估步骤可能与该账号关联，用于统计从评估到保存的完整路径。',
                'Your first secure sign-in creates an account using the account identifier, email and available name provided by the sign-in service. Assessment content, project names and later application materials enter an account-isolated private project only after you confirm saving. After sign-in, earlier anonymous steps from the same device may be linked to the account to measure the path from assessment to saving.',
              )}
            </p>
          </section>
          <section>
            <h2>
              {t('你主动提供的资料', 'Information you choose to provide')}
            </h2>
            <p>
              {t(
                '你可以自愿补充所在地区、公司或项目、创业阶段和偏好联系方式，并选择是否接收产品更新。帮助与留言会保存问题、回复邮箱和处理状态。申请邮件报告或获得客服邮件回复时，收件地址和相应内容会交由邮件服务商 Resend 处理，并保存发送状态用于失败排查。请不要在客服留言中发送护照号、完整身份证件或不必要的敏感信息。',
                'You may voluntarily add your region, company or project, founder stage, preferred contact method and product-update preference. Support messages store the question, reply email and response status. Requested assessment emails and support replies send the recipient address and relevant content to our email provider, Resend. Delivery status is retained to investigate failures. Do not send passport numbers, full identity documents or unnecessary sensitive information in support messages.',
              )}
            </p>
          </section>
          <section>
            <h2>{t('分享、导出与删除', 'Sharing, export and deletion')}</h2>
            <p>
              {t(
                '律师分享链接只在你主动创建后生效，并受所选章节、有效期和撤销状态控制。项目导出、分享或删除均需要你在对应项目中确认。',
                'Counsel links work only after you create them and are limited by the selected sections, expiration and revocation status. Exporting, sharing or deleting a project requires your confirmation inside that project.',
              )}
            </p>
          </section>
          <section>
            <h2>{t('联系与数据请求', 'Contact and data requests')}</h2>
            <p>
              {t(
                '如需查询、更正或删除账号相关信息，请使用注册邮箱联系 coo@uscoo.ai。为保护资料，USCOO 可能需要先核实账号归属。',
                'To request access, correction or deletion of account information, contact coo@uscoo.ai from your registered email. USCOO may verify account ownership before acting on the request.',
              )}
            </p>
            <a href="mailto:coo@uscoo.ai">
              <Mail />
              coo@uscoo.ai
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
