import {
  analyticsInputSchema,
  recordAssessmentEvent,
} from '@/lib/engagement-store';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = analyticsInputSchema.parse(await jsonBody(req));
    await recordAssessmentEvent(req, input);
    return reply({ recorded: true }, 201);
  } catch (error) {
    return failure(error);
  }
}
