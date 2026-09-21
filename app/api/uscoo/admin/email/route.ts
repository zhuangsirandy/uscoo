import { z } from 'zod';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';
import { requireAdmin, sendStoredAssessment } from '@/lib/engagement-store';
import { retryMail } from '@/lib/email-store';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin(req);
    const { id, source } = z.object({ id: z.string().uuid(), source: z.enum(['outbox', 'assessment']).default('outbox') }).strict().parse(await jsonBody(req));
    return reply({ emailStatus: source === 'assessment' ? await sendStoredAssessment(id) : await retryMail(id) });
  } catch(error) { return failure(error); }
}
