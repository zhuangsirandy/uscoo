import { db, HttpError, identity, now, uid } from './case-store';

export const INVITER_REWARD_CREDITS = 20;
export const NEW_MEMBER_REWARD_CREDITS = 10;

export type AccountSummary = {
  userId: string;
  email: string;
  displayName: string;
  accessStatus: 'pending' | 'active';
  accessGrantedAt: string | null;
  accessSource: string | null;
  referralCode: string;
  rewardCredits: number;
  projectCount: number;
  invitedCount: number;
  profile: AccountProfile;
  created: string;
};

export type AccountProfile = {
  countryRegion: string;
  companyName: string;
  founderStage: 'exploring' | 'building' | 'operating' | '';
  contactChannel: 'email' | 'wechat' | 'whatsapp' | 'other' | '';
  contactValue: string;
  updatesOptIn: boolean;
};

export const EMPTY_ACCOUNT_PROFILE: AccountProfile = {
  countryRegion: '',
  companyName: '',
  founderStage: '',
  contactChannel: '',
  contactValue: '',
  updatesOptIn: false,
};

type AccountRow = {
  user_id: string;
  email: string;
  display_name: string;
  access_status: 'pending' | 'active';
  access_granted_at: string | null;
  access_source: string | null;
  referral_code: string;
  reward_credits: number;
  profile: string;
  created: string;
};

export function parseAccountProfile(value: string): AccountProfile {
  try {
    const profile = JSON.parse(value || '{}');
    return {
      countryRegion:
        typeof profile.countryRegion === 'string'
          ? profile.countryRegion.slice(0, 120)
          : '',
      companyName:
        typeof profile.companyName === 'string'
          ? profile.companyName.slice(0, 200)
          : '',
      founderStage: ['exploring', 'building', 'operating'].includes(
        profile.founderStage,
      )
        ? profile.founderStage
        : '',
      contactChannel: ['email', 'wechat', 'whatsapp', 'other'].includes(
        profile.contactChannel,
      )
        ? profile.contactChannel
        : '',
      contactValue:
        typeof profile.contactValue === 'string'
          ? profile.contactValue.slice(0, 200)
          : '',
      updatesOptIn: profile.updatesOptIn === true,
    } as AccountProfile;
  } catch {
    return { ...EMPTY_ACCOUNT_PROFILE };
  }
}

function requestProfile(req: Request) {
  const email = (req.headers.get('oai-authenticated-user-email') || '').slice(
    0,
    320,
  );
  const encodedName = req.headers.get('oai-authenticated-user-full-name');
  let displayName = email;
  if (
    encodedName &&
    req.headers.get('oai-authenticated-user-full-name-encoding') ===
      'percent-encoded-utf-8'
  ) {
    try {
      displayName = decodeURIComponent(encodedName);
    } catch {
      displayName = email;
    }
  }
  return { email, displayName: displayName.slice(0, 200) };
}

function makeReferralCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `UC${Array.from(bytes, (x) => alphabet[x % alphabet.length]).join('')}`;
}

export function normalizeInviteCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

async function accountRow(userId: string) {
  return db()
    .prepare('SELECT * FROM accounts WHERE user_id=?')
    .bind(userId)
    .first<AccountRow>();
}

export async function ensureAccount(
  userId: string,
  email = '',
  displayName = email,
) {
  let account = await accountRow(userId);
  const time = now();

  if (!account) {
    const projectCount = await db()
      .prepare('SELECT COUNT(*) AS n FROM projects WHERE owner=?')
      .bind(userId)
      .first<{ n: number }>();
    const legacyAccess = Number(projectCount?.n || 0) > 0;

    for (let attempt = 0; attempt < 4 && !account; attempt += 1) {
      await db()
        .prepare(
          "INSERT OR IGNORE INTO accounts (user_id,email,display_name,access_status,access_granted_at,access_source,referral_code,referred_by_user_id,reward_credits,activation_token,created,updated) VALUES (?,?,?,?,?,?,?,NULL,0,'',?,?)",
        )
        .bind(
          userId,
          email,
          displayName,
          legacyAccess ? 'active' : 'pending',
          legacyAccess ? time : null,
          legacyAccess ? 'existing-project' : null,
          makeReferralCode(),
          time,
          time,
        )
        .run();
      account = await accountRow(userId);
    }
    if (!account) throw new HttpError(503, '账号暂时无法建立，请稍后重试。');
  } else if (account.email !== email || account.display_name !== displayName) {
    await db()
      .prepare(
        'UPDATE accounts SET email=?,display_name=?,updated=? WHERE user_id=?',
      )
      .bind(email, displayName, time, userId)
      .run();
    account = (await accountRow(userId))!;
  }

  return account;
}

export async function ensureAccountForRequest(req: Request) {
  const userId = identity(req);
  const { email, displayName } = requestProfile(req);
  return ensureAccount(userId, email, displayName);
}

export async function getAccountSummaryForIdentity(
  userId: string,
  email = '',
  displayName = email,
): Promise<AccountSummary> {
  const account = await ensureAccount(userId, email, displayName);
  return accountSummary(account);
}

export async function getAccountSummary(req: Request): Promise<AccountSummary> {
  const account = await ensureAccountForRequest(req);
  return accountSummary(account);
}

async function accountSummary(account: AccountRow): Promise<AccountSummary> {
  const [projects, invitations] = await Promise.all([
    db()
      .prepare('SELECT COUNT(*) AS n FROM projects WHERE owner=?')
      .bind(account.user_id)
      .first<{ n: number }>(),
    db()
      .prepare(
        "SELECT COUNT(*) AS n FROM reward_events WHERE user_id=? AND kind='referral-inviter'",
      )
      .bind(account.user_id)
      .first<{ n: number }>(),
  ]);
  return {
    userId: account.user_id,
    email: account.email,
    displayName: account.display_name || account.email,
    accessStatus: account.access_status,
    accessGrantedAt: account.access_granted_at,
    accessSource: account.access_source,
    referralCode: account.referral_code,
    rewardCredits: Number(account.reward_credits || 0),
    projectCount: Number(projects?.n || 0),
    invitedCount: Number(invitations?.n || 0),
    profile: parseAccountProfile(account.profile),
    created: account.created,
  };
}

export async function updateAccountProfile(
  req: Request,
  profile: AccountProfile,
): Promise<AccountSummary> {
  const account = await ensureAccountForRequest(req);
  const time = now();
  await db()
    .prepare('UPDATE accounts SET profile=?,updated=? WHERE user_id=?')
    .bind(JSON.stringify(profile), time, account.user_id)
    .run();
  return getAccountSummary(req);
}

export async function requireWorkspaceAccess(req: Request) {
  const account = await ensureAccountForRequest(req);
  if (account.access_status !== 'active')
    throw new HttpError(403, '进入申请工作台前，请先使用邀请码开通访问权限。');
  return account;
}

export async function redeemInviteCode(req: Request, rawCode: string) {
  const code = normalizeInviteCode(rawCode);
  if (!/^[A-Z0-9]{8,20}$/.test(code))
    throw new HttpError(422, '请输入有效的邀请码。');

  const account = await ensureAccountForRequest(req);
  if (account.access_status === 'active') return getAccountSummary(req);
  if (account.referral_code === code)
    throw new HttpError(422, '不能使用自己的邀请代码。');

  const inviter = await db()
    .prepare(
      "SELECT user_id FROM accounts WHERE referral_code=? AND access_status='active'",
    )
    .bind(code)
    .first<{ user_id: string }>();
  if (!inviter)
    throw new HttpError(404, '邀请码无效或尚未启用，请向邀请人核对。');

  const time = now();
  const token = uid();
  const results = await db().batch([
    db()
      .prepare(
        "UPDATE accounts SET access_status='active',access_granted_at=?,access_source='referral',referred_by_user_id=?,reward_credits=reward_credits+?,activation_token=?,updated=? WHERE user_id=? AND access_status='pending'",
      )
      .bind(
        time,
        inviter.user_id,
        NEW_MEMBER_REWARD_CREDITS,
        token,
        time,
        account.user_id,
      ),
    db()
      .prepare(
        'UPDATE accounts SET reward_credits=reward_credits+?,updated=? WHERE user_id=? AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND activation_token=?)',
      )
      .bind(
        INVITER_REWARD_CREDITS,
        time,
        inviter.user_id,
        account.user_id,
        token,
      ),
    db()
      .prepare(
        "INSERT OR IGNORE INTO reward_events (id,user_id,kind,credits,related_user_id,idempotency_key,created) SELECT ?,?,'referral-new-member',?,?,?,? FROM accounts WHERE user_id=? AND activation_token=?",
      )
      .bind(
        uid(),
        account.user_id,
        NEW_MEMBER_REWARD_CREDITS,
        inviter.user_id,
        `referral-new-member:${account.user_id}`,
        time,
        account.user_id,
        token,
      ),
    db()
      .prepare(
        "INSERT OR IGNORE INTO reward_events (id,user_id,kind,credits,related_user_id,idempotency_key,created) SELECT ?,?,'referral-inviter',?,?,?,? FROM accounts WHERE user_id=? AND activation_token=?",
      )
      .bind(
        uid(),
        inviter.user_id,
        INVITER_REWARD_CREDITS,
        account.user_id,
        `referral-inviter:${account.user_id}`,
        time,
        account.user_id,
        token,
      ),
    db()
      .prepare(
        "UPDATE accounts SET activation_token='' WHERE user_id=? AND activation_token=?",
      )
      .bind(account.user_id, token),
  ]);
  if (!results[0].meta.changes) {
    const latest = await accountRow(account.user_id);
    if (latest?.access_status !== 'active')
      throw new HttpError(409, '邀请码状态已变化，请刷新后重试。');
  }
  return getAccountSummary(req);
}
