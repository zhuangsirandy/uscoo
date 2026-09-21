import WorkspaceAccessGate from '@/components/uscoo/workspace-access-gate';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getAccountSummaryForIdentity } from '@/lib/account-store';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getChatGPTUser(),
    q = await searchParams;
  const account = user
    ? await getAccountSummaryForIdentity(user.id, user.email, user.displayName)
    : null;
  return (
    <WorkspaceAccessGate
      signedIn={!!user}
      initialProjectId={typeof q.project === 'string' ? q.project : undefined}
      userName={user?.displayName || ''}
      initialInviteCode={typeof q.invite === 'string' ? q.invite : undefined}
      initialAccessStatus={account?.accessStatus}
    />
  );
}
