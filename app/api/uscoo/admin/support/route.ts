import { z } from 'zod';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';
import { updateSupportRequest } from '@/lib/engagement-store';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    const input = z
      .object({
        id: z.string().uuid(),
        status: z.enum(['open', 'answered', 'closed']),
        reply: z.string().trim().max(5000).default(''),
      })
      .strict()
      .parse(await jsonBody(req));
    const result = await updateSupportRequest(req, input);
    return reply({ updated: true, ...result });
  } catch (error) {
    return failure(error);
  }
}
