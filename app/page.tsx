import MarketingHome from '@/components/uscoo/marketing-home';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import SeoJsonLd from '@/components/uscoo/seo-json-ld';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <>
      <SeoJsonLd />
      <MarketingHome signedIn={!!user} userName={user?.displayName || ''} />
    </>
  );
}
