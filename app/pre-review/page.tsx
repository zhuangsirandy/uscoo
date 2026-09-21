import PreReview from '@/components/uscoo/pre-review';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getChatGPTUser(),
    q = await searchParams;
  return (
    <PreReview
      signedIn={!!user}
      initialProjectId={typeof q.project === 'string' ? q.project : undefined}
    />
  );
}
