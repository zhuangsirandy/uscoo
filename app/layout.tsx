import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/components/uscoo/language';
import SupportWidget from '@/components/uscoo/support-widget';
import { getChatGPTUser } from '@/app/chatgpt-auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.uscoo.ai'),
  title: {
    default: 'USCOO | O-1A 申请系统 · O-1 Visa for Founders',
    template: '%s · USCOO',
  },
  description:
    'USCOO 帮助创始人与创业者评估 O-1A 杰出经历、对标美国移民局标准，并把美国公司、个人证据、文书与递交进度放进同一条申请路径。 O-1 visa preparation for founders building and working in the United States.',
  applicationName: 'USCOO',
  category: 'immigration application preparation software',
  creator: 'USCOO',
  publisher: 'USCOO',
  keywords: [
    'O-1A',
    'O-1 visa',
    'O-1签证',
    '美国创业',
    '创始人',
    '湾区创业',
    'AI创业',
    '美国签证',
    '美国工作',
    '美国移民局',
    'USCIS',
    'founder visa',
    'startup founder',
    'entrepreneur visa USA',
    'AI startup USA',
  ],
  alternates: {
    canonical: '/',
    languages: { 'en-US': '/', 'zh-CN': '/zh', 'x-default': '/' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'USCOO',
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    title: 'USCOO | O-1A application system for founders',
    description:
      'Turn founder achievements into evidence USCIS can understand, then prepare the company, petition record and filing path in one system.',
  },
  twitter: {
    card: 'summary',
    title: 'USCOO | O-1A application system for founders',
    description:
      'Assess achievements, map evidence to USCIS criteria, and prepare the company and O-1A filing in one system.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, user] = await Promise.all([cookies(), getChatGPTUser()]);
  const language =
    cookieStore.get('uscoo_language')?.value === 'zh' ? 'zh' : 'en';
  return (
    <html lang={language === 'zh' ? 'zh-CN' : 'en'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider initialLanguage={language}>
          {children}
          <SupportWidget
            initialEmail={user?.email || ''}
            initialName={user?.fullName || ''}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
