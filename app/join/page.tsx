import JoinInvite from '@/components/uscoo/join-invite';
import { chatGPTSignInPath, getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const code = typeof query.ref === 'string' ? query.ref : '';
  const returnTo = `/join${code ? `?ref=${encodeURIComponent(code)}` : ''}`;
  const user = await getChatGPTUser();
  return (
    <JoinInvite
      signedIn={!!user}
      initialCode={code}
      signInPath={chatGPTSignInPath(returnTo)}
    />
  );
}
