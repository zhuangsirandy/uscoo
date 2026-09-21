import FounderEntry from '@/components/uscoo/founder-entry';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function BetaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  if (typeof q.project === 'string') {
    const params = new URLSearchParams({ project: q.project });
    if (typeof q.step === 'string') params.set('step', q.step);
    redirect(`/prepare?${params}`);
  }
  const user = await getChatGPTUser();
  return (
    <FounderEntry
      signedIn={!!user}
      initialStage={
        q.view === 'result'
          ? 'result'
          : q.view === 'assessment'
            ? 'assessment'
            : 'overview'
      }
    />
  );
}
