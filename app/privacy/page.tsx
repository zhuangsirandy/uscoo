import type { Metadata } from 'next';
import PrivacyNotice from '@/components/uscoo/privacy-notice';

export const metadata: Metadata = {
  title: '隐私说明 · Privacy | USCOO',
  description: '了解 USCOO 如何处理初步评估、账号、申请项目与在线问答信息。',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <PrivacyNotice />;
}
