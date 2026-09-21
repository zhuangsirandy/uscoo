import { z } from 'zod';
import { redeemInviteCode } from '@/lib/account-store';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const body = z
      .object({ code: z.string().trim().min(1).max(40) })
      .strict()
      .parse(await jsonBody(req));
    return reply({ account: await redeemInviteCode(req, body.code) });
  } catch (error) {
    return failure(error);
  }
}
