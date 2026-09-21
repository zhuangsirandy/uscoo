import SharedBrief from '@/components/uscoo/shared-brief';
import { db, hash, uid, now } from '@/lib/case-store';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'USCOO · Shared preparation',
  robots: { index: false, follow: false },
};
export default async function Shared({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let item: any = null;
  try {
    item = await db()
      .prepare(
        'SELECT * FROM shares WHERE token_hash=? AND revoked=0 AND expires>?',
      )
      .bind(await hash(token), now())
      .first();
    if (item)
      await db()
        .prepare(
          "INSERT INTO audit (id,project_id,actor,action,revision,created) VALUES (?,?,'anonymous','匿名进度链接被访问',0,?)",
        )
        .bind(uid(), item.project_id, now())
        .run();
  } catch {}
  if (!item) return <SharedBrief />;
  const s = JSON.parse(item.snapshot);
  return <SharedBrief snapshot={s} expires={item.expires} />;
}
