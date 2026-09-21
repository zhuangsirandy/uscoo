import {
  createSupportRequest,
  getSupportRequestsForUser,
  supportInputSchema,
} from '@/lib/engagement-store';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    return reply({ requests: await getSupportRequestsForUser(req) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = supportInputSchema.parse(await jsonBody(req));
    return reply({ request: await createSupportRequest(req, input) }, 201);
  } catch (error) {
    return failure(error);
  }
}
