import { z } from 'zod';
const short = z.string().trim().max(2000);
const ids = z.array(z.string().max(100)).max(100).default([]);
const common = { title: short.min(1), notes: z.string().max(12000).optional() };
export const profileSchema = z
  .object({
    preparationMode: z.enum(['diy', 'counsel']).optional(),
    companyGoal: z
      .enum([
        'undecided',
        'new-o1a',
        'existing-o1a',
        'company-only',
        'external-petitioner',
      ])
      .optional(),
    entityType: short.optional(),
    formationState: short.optional(),
    formationStatus: z
      .enum(['not-started', 'choosing', 'filed', 'active'])
      .optional(),
    desiredApproval: short.optional(),
    arrivalDate: short.optional(),
    name: short.optional(),
    company: short.optional(),
    companyState: short.optional(),
    location: short.optional(),
    route: z.enum(['consular', 'change', 'extension', 'unknown']).optional(),
    field: short.optional(),
    target: short.optional(),
    status: short.optional(),
    statusUntil: short.optional(),
    role: short.optional(),
    duties: short.optional(),
    start: short.optional(),
    end: short.optional(),
    pay: short.optional(),
    workplace: short.optional(),
    premium: z.boolean().optional(),
    modelConsent: z.boolean().optional(),
  })
  .strict();
export const bodySchemas = {
  event: z
    .object({
      ...common,
      date: short.optional(),
      role: short.optional(),
      action: short.optional(),
      result: short.optional(),
      team: short.optional(),
      hypothesis: z.boolean().default(false),
      confirmed: z.boolean().default(false),
      criteria: z.array(z.string()).max(8).default([]),
      sourceIds: ids,
    })
    .strict(),
  evidence: z
    .object({
      ...common,
      issuer: short.optional(),
      date: short.optional(),
      url: z.string().max(2000).optional(),
      page: short.optional(),
      language: short.optional(),
      independence: z
        .enum(['independent', 'related', 'self', 'unknown'])
        .default('unknown'),
      translation: z
        .enum(['not-needed', 'needed', 'draft', 'certified'])
        .default('needed'),
      excerpt: z.string().max(60000).default(''),
      criteria: z.array(z.string()).max(8).default([]),
      status: z
        .enum(['lead', 'reviewed', 'conflict', 'unsupported', 'withdrawn'])
        .default('lead'),
      authenticity: z
        .enum(['unverified', 'checked', 'concern'])
        .default('unverified'),
      modelAllowed: z.boolean().default(false),
      confirmed: z.boolean().default(false),
      extraction: z
        .enum(['text', 'manual', 'needs-review', 'scan'])
        .default('manual'),
      sourceIds: ids,
    })
    .strict(),
  task: z
    .object({
      ...common,
      track: z.enum(['company', 'evidence']),
      state: z.enum(['todo', 'doing', 'waiting', 'done', 'cancelled']),
      owner: short.optional(),
      due: short.optional(),
      dependsOn: ids,
      cost: short.optional(),
      hours: short.optional(),
      basis: short.optional(),
      url: short.optional(),
      receipt: short.optional(),
      planKey: short.optional(),
      phase: short.optional(),
      sourceIds: ids,
    })
    .strict(),
  document: z
    .object({
      ...common,
      type: z.enum([
        'support',
        'lawyer',
        'work',
        'ss4',
        'i129',
        'recommendation',
        'business',
        'translation',
        'consultation',
        'rfe',
      ]),
      content: z.string().max(80000),
      state: z.enum(['working', 'reviewed', 'canonical']),
      sourceIds: ids,
      reviewedFacts: z.boolean().default(false),
      confirmed: z.boolean().default(false),
    })
    .strict(),
  gate: z
    .object({
      gate: z.enum([
        'composition',
        'consistency',
        'forms',
        'signatures',
        'fees',
        'address',
        'processing',
      ]),
      confirmed: z.boolean(),
      note: short.min(10),
      result: short.optional(),
      source: short.optional(),
      version: short.optional(),
      basis: short.optional(),
      reviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      sourceIds: ids,
    })
    .strict(),
  filing: z
    .object({
      ...common,
      event: z.enum([
        'prepared',
        'dispatched',
        'delivered',
        'received',
        'processing',
        'rfe',
        'noid',
        'approved',
        'denied',
        'returned',
        'interview',
        '221g',
        'visa',
        'entry',
        'i94',
        'work-change',
        'renewal',
      ]),
      date: short.min(1),
      deadline: short.optional(),
      deadlineConfirmed: z.boolean().default(false),
      packetId: short.optional(),
      reference: short.optional(),
      sourceIds: ids,
      confirmed: z.boolean().default(false),
    })
    .strict(),
  comment: z
    .object({
      ...common,
      recordId: short.min(1),
      location: short.optional(),
      role: z.enum(['user', 'professional-notes']),
      state: z.enum(['open', 'resolved']),
      sourceIds: ids,
    })
    .strict(),
  consent: z
    .object({ purpose: z.enum(['research']), granted: z.boolean() })
    .strict(),
};
