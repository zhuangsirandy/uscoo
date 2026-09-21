import AccountCenter from '@/components/uscoo/account-center';
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from '@/app/chatgpt-auth';
import { getAccountSummaryForIdentity } from '@/lib/account-store';
import { isAdminUser } from '@/lib/engagement-store';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getChatGPTUser();
  const account = user
    ? await getAccountSummaryForIdentity(user.id, user.email, user.displayName)
    : null;
  return (
    <AccountCenter
      signedIn={!!user}
      userName={user?.displayName || ''}
      userEmail={user?.email || ''}
      signInPath={chatGPTSignInPath('/account')}
      signOutPath={chatGPTSignOutPath('/')}
      initialAccount={account}
      isAdmin={user ? isAdminUser(user.id) : false}
    />
  );
}
