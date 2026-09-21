import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    title: text('title').notNull(),
    profile: text('profile').notNull().default('{}'),
    revision: integer('revision').notNull().default(0),
    mutation: text('mutation').notNull().default(''),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [index('idx_projects_owner').on(t.owner)],
);
export const records = sqliteTable(
  'records',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    body: text('body').notNull(),
    version: integer('version').notNull().default(1),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [index('idx_records_project_kind').on(t.projectId, t.kind)],
);
export const audit = sqliteTable(
  'audit',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    recordId: text('record_id'),
    revision: integer('revision').notNull(),
    created: text('created').notNull(),
  },
  (t) => [index('idx_audit_project_created').on(t.projectId, t.created)],
);
export const jobs = sqliteTable(
  'jobs',
  {
    // Agent attempts remain durable even when the provider is unavailable.
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    requestKey: text('request_key').notNull(),
    kind: text('kind').notNull(),
    state: text('state').notNull(),
    result: text('result'),
    error: text('error'),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [
    uniqueIndex('idx_jobs_idempotency').on(t.projectId, t.requestKey),
    index('idx_jobs_project').on(t.projectId),
  ],
);
export const shares = sqliteTable(
  'shares',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    snapshot: text('snapshot').notNull(),
    expires: text('expires').notNull(),
    revoked: integer('revoked').notNull().default(0),
    created: text('created').notNull(),
  },
  (t) => [uniqueIndex('idx_shares_token').on(t.tokenHash)],
);
export const recordVersions = sqliteTable(
  'record_versions',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    recordId: text('record_id').notNull(),
    version: integer('version').notNull(),
    body: text('body').notNull(),
    created: text('created').notNull(),
  },
  (t) => [index('idx_versions_record').on(t.projectId, t.recordId)],
);

export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('user_id').primaryKey(),
    email: text('email').notNull().default(''),
    displayName: text('display_name').notNull().default(''),
    accessStatus: text('access_status').notNull().default('pending'),
    accessGrantedAt: text('access_granted_at'),
    accessSource: text('access_source'),
    referralCode: text('referral_code').notNull(),
    referredByUserId: text('referred_by_user_id'),
    rewardCredits: integer('reward_credits').notNull().default(0),
    activationToken: text('activation_token').notNull().default(''),
    profile: text('profile').notNull().default('{}'),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [
    uniqueIndex('idx_accounts_referral_code').on(t.referralCode),
    index('idx_accounts_referred_by').on(t.referredByUserId),
  ],
);

export const assessmentEvents = sqliteTable(
  'assessment_events',
  {
    id: text('id').primaryKey(),
    visitorId: text('visitor_id').notNull(),
    userId: text('user_id').references(() => accounts.userId, {
      onDelete: 'set null',
    }),
    eventType: text('event_type').notNull(),
    eventKey: text('event_key').notNull(),
    language: text('language').notNull().default(''),
    referrer: text('referrer').notNull().default(''),
    utmSource: text('utm_source').notNull().default(''),
    utmMedium: text('utm_medium').notNull().default(''),
    utmCampaign: text('utm_campaign').notNull().default(''),
    created: text('created').notNull(),
  },
  (t) => [
    uniqueIndex('idx_assessment_events_event_key').on(t.eventKey),
    index('idx_assessment_events_type_created').on(t.eventType, t.created),
    index('idx_assessment_events_user_created').on(t.userId, t.created),
    index('idx_assessment_events_visitor').on(t.visitorId),
  ],
);

export const assessmentLeads = sqliteTable(
  'assessment_leads',
  {
    id: text('id').primaryKey(),
    visitorId: text('visitor_id').notNull(),
    userId: text('user_id').references(() => accounts.userId, { onDelete: 'set null' }),
    name: text('name').notNull().default(''),
    email: text('email').notNull(),
    wechat: text('wechat').notNull().default(''),
    location: text('location').notNull().default(''),
    timing: text('timing').notNull().default(''),
    company: text('company').notNull().default(''),
    applicationPath: text('application_path').notNull().default(''),
    hasChatgpt: text('has_chatgpt').notNull().default('unknown'),
    wantsInterview: integer('wants_interview').notNull().default(0),
    language: text('language').notNull().default(''),
    assessment: text('assessment').notNull().default('{}'),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [
    index('idx_assessment_leads_created').on(t.created),
    index('idx_assessment_leads_email').on(t.email),
    index('idx_assessment_leads_visitor').on(t.visitorId),
  ],
);

export const supportRequests = sqliteTable(
  'support_requests',
  {
    id: text('id').primaryKey(),
    visitorId: text('visitor_id').notNull().default(''),
    userId: text('user_id').references(() => accounts.userId, {
      onDelete: 'set null',
    }),
    name: text('name').notNull().default(''),
    email: text('email').notNull().default(''),
    category: text('category').notNull(),
    message: text('message').notNull(),
    language: text('language').notNull().default(''),
    status: text('status').notNull().default('open'),
    reply: text('reply').notNull().default(''),
    created: text('created').notNull(),
    updated: text('updated').notNull(),
  },
  (t) => [
    index('idx_support_requests_status_created').on(t.status, t.created),
    index('idx_support_requests_user_created').on(t.userId, t.created),
    index('idx_support_requests_visitor_created').on(t.visitorId, t.created),
  ],
);

export const rewardEvents = sqliteTable(
  'reward_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => accounts.userId, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    credits: integer('credits').notNull(),
    relatedUserId: text('related_user_id'),
    idempotencyKey: text('idempotency_key').notNull(),
    created: text('created').notNull(),
  },
  (t) => [
    uniqueIndex('idx_reward_events_idempotency').on(t.idempotencyKey),
    index('idx_reward_events_user_created').on(t.userId, t.created),
  ],
);

export const emailOutbox = sqliteTable('email_outbox', {
  id: text('id').primaryKey(),
  messageKey: text('message_key').notNull(),
  kind: text('kind').notNull(),
  referenceId: text('reference_id').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  replyTo: text('reply_to').notNull(),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  providerId: text('provider_id').notNull().default(''),
  error: text('error').notNull().default(''),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
}, t => [uniqueIndex('idx_email_message_key').on(t.messageKey), index('idx_email_status_created').on(t.status, t.created)]);
