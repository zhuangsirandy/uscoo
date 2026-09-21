import {
  getAccountSummary,
  INVITER_REWARD_CREDITS,
  NEW_MEMBER_REWARD_CREDITS,
  updateAccountProfile,
} from '@/lib/account-store';
import { z } from 'zod';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const account = await getAccountSummary(req);
    return reply({
      account,
      rewards: {
        inviter: INVITER_REWARD_CREDITS,
        newMember: NEW_MEMBER_REWARD_CREDITS,
      },
      referralUrl: `${new URL(req.url).origin}/join?ref=${encodeURIComponent(account.referralCode)}`,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    const profile = z
      .object({
        countryRegion: z.string().trim().max(120).default(''),
        companyName: z.string().trim().max(200).default(''),
        founderStage: z
          .enum(['exploring', 'building', 'operating', ''])
          .default(''),
        contactChannel: z
          .enum(['email', 'wechat', 'whatsapp', 'other', ''])
          .default(''),
        contactValue: z.string().trim().max(200).default(''),
        updatesOptIn: z.boolean().default(false),
      })
      .strict()
      .parse(await jsonBody(req));
    return reply({ account: await updateAccountProfile(req, profile) });
  } catch (error) {
    return failure(error);
  }
}
