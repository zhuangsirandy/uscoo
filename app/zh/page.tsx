import type { Metadata } from 'next';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import ForcedLanguage from '@/components/uscoo/forced-language';
import MarketingHome from '@/components/uscoo/marketing-home';
import SeoJsonLd from '@/components/uscoo/seo-json-ld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'USCOO｜创始人 O-1A 杰出人才申请与美国创业工作台',
  description:
    '面向创始人和创业者的 O-1A 申请系统：初步评估杰出经历，对标美国移民局标准，准备美国申请公司、个人证据、文书、递交与跟进。',
  alternates: {
    canonical: '/zh',
    languages: { 'en-US': '/', 'zh-CN': '/zh', 'x-default': '/' },
  },
  openGraph: {
    locale: 'zh_CN',
    url: '/zh',
  },
};

export default async function ChineseHome() {
  const user = await getChatGPTUser();
  return (
    <ForcedLanguage language="zh">
      <SeoJsonLd />
      <MarketingHome signedIn={!!user} userName={user?.displayName || ''} />
    </ForcedLanguage>
  );
}
