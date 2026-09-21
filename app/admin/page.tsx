import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import AdminDashboard from '@/components/uscoo/admin-dashboard';
import { getAdminDashboard, isAdminUser } from '@/lib/engagement-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'USCOO 运营后台',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  if (!isAdminUser(user.id)) notFound();
  return <AdminDashboard data={(await getAdminDashboard()) as any} />;
}
