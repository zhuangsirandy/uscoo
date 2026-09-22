import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
const require = createRequire(import.meta.url),
  wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare } = wranglerRequire('miniflare');
const modulePaths = readdirSync('dist/server', { recursive: true }).filter(
  (p) => /\.m?js$/.test(p) && p !== 'index.js',
);
const mf = new Miniflare({
  modules: [
    { type: 'ESModule', path: resolve('dist/server/index.js') },
    ...modulePaths.map((p) => ({
      type: 'ESModule',
      path: resolve('dist/server', p),
    })),
  ],
  modulesRoot: resolve('dist/server'),
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['DB'],
  r2Buckets: ['BUCKET'],
  bindings: {
    USCOO_ADMIN_USER_IDS: 'synthetic-admin',
    USCOO_SITES_AUTH_TRUSTED: 'true',
  },
  cf: false,
  assets: {
    directory: resolve('dist/client'),
    binding: 'ASSETS',
    routerConfig: {
      has_user_worker: true,
      invoke_user_worker_ahead_of_assets: true,
    },
  },
});
const checks = [];
function ok(name, fn) {
  fn();
  checks.push({ name, passed: true });
  process.stdout.write(`PASS ${name}\n`);
}
const origin = 'https://uscoo.test',
  root = '/api/uscoo/projects',
  accountApi = '/api/uscoo/account';
async function call(
  path,
  method = 'GET',
  body,
  user = 'synthetic-user-a',
  headers = {},
) {
  const h = { cookie: 'uscoo_language=zh', ...headers };
  if (user) {
    h['oai-authenticated-user-id'] = user;
    h['oai-authenticated-user-email'] = `${user}@example.invalid`;
  }
  if (method !== 'GET') h.origin = origin;
  let payload = body;
  if (body instanceof FormData) {
    const uploadRequest = new Request(origin + path, { method, body });
    h['content-type'] = uploadRequest.headers.get('content-type');
    payload = await uploadRequest.arrayBuffer();
  }
  if (body && !(body instanceof FormData)) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const r = await mf.dispatchFetch(origin + path, {
    method,
    headers: h,
    body: payload,
  });
  const bytes = new Uint8Array(await r.arrayBuffer());
  let data;
  try {
    data = JSON.parse(strFromU8(bytes));
  } catch {
    data = null;
  }
  return { status: r.status, data, bytes, headers: r.headers };
}
try {
  const database = await mf.getD1Database('DB');
  for (const migration of readdirSync('drizzle')
    .filter((file) => file.endsWith('.sql'))
    .sort()) {
    for (const sql of readFileSync(`drizzle/${migration}`, 'utf8').split(
      '--> statement-breakpoint',
    ))
      if (sql.trim()) await database.prepare(sql).run();
  }
  const seededAt = new Date().toISOString();
  await database
    .prepare(
      "INSERT INTO accounts (user_id,email,display_name,access_status,access_granted_at,access_source,referral_code,referred_by_user_id,reward_credits,activation_token,created,updated) VALUES (?,?,?,'active',?,'seed','UCINVITE99',NULL,0,'',?,?)",
    )
    .bind(
      'synthetic-inviter',
      'synthetic-inviter@example.invalid',
      'Synthetic inviter',
      seededAt,
      seededAt,
      seededAt,
    )
    .run();
  let r = await call(root, 'GET', null, null);
  ok('Unauthenticated API denies access', () => assert.equal(r.status, 401));
  r = await call(accountApi, 'GET', null, null);
  ok('Account endpoint also requires sign-in', () =>
    assert.equal(r.status, 401),
  );
  r = await call(accountApi, 'GET', null, null, {
    'oai-authenticated-user-id': 'forged-only-id',
  });
  ok('Incomplete client-supplied identity is rejected', () =>
    assert.equal(r.status, 401),
  );
  r = await call(accountApi);
  ok('New signed-in account starts pending an invitation', () => {
    assert.equal(r.status, 200);
    assert.equal(r.data.account.accessStatus, 'pending');
    assert.match(r.data.account.referralCode, /^UC[A-Z0-9]{8}$/);
  });
  const pendingProjectId = crypto.randomUUID();
  r = await call(
    root,
    'POST',
    {
      title: 'SYNTHETIC pending-access preparation',
      requestId: pendingProjectId,
    },
    'synthetic-user-pending',
  );
  ok('Invitation is required when a user chooses to save a project', () => {
    assert.equal(r.status, 403);
    assert(r.data.error.includes('邀请码'));
  });
  r = await call(accountApi + '/redeem', 'POST', { code: 'UCINVITE99' });
  ok(
    'A valid referral code activates access and awards welcome credits',
    () => {
      assert.equal(r.status, 200, JSON.stringify(r.data));
      assert.equal(r.data.account.accessStatus, 'active');
      assert.equal(r.data.account.rewardCredits, 10);
    },
  );
  r = await call(accountApi, 'GET', null, 'synthetic-inviter');
  ok('The inviter receives one durable reward', () => {
    assert.equal(r.data.account.rewardCredits, 20);
    assert.equal(r.data.account.invitedCount, 1);
  });
  await call(accountApi + '/redeem', 'POST', { code: 'UCINVITE99' });
  r = await call(accountApi, 'GET', null, 'synthetic-inviter');
  ok('Redeeming again is idempotent and cannot duplicate rewards', () => {
    assert.equal(r.data.account.rewardCredits, 20);
    assert.equal(r.data.account.invitedCount, 1);
  });
  r = await call(
    accountApi,
    'PATCH',
    {
      countryRegion: 'Shanghai, China',
      companyName: 'Synthetic Labs',
      founderStage: 'building',
      contactChannel: 'wechat',
      contactValue: 'synthetic-wechat',
      updatesOptIn: true,
    },
    'synthetic-user-a',
  );
  ok(
    'Signed-in users can voluntarily save contact and founder-stage details',
    () => {
      assert.equal(r.status, 200, JSON.stringify(r.data));
      assert.equal(r.data.account.profile.companyName, 'Synthetic Labs');
      assert.equal(r.data.account.profile.updatesOptIn, true);
    },
  );
  const analyticsVisitor = crypto.randomUUID();
  r = await call(
    '/api/uscoo/analytics',
    'POST',
    {
      visitorId: analyticsVisitor,
      eventType: 'assessment_started',
      language: 'zh',
      referrer: '',
      utmSource: 'xiaohongshu',
      utmMedium: 'social',
      utmCampaign: 'launch',
    },
    null,
  );
  ok('Anonymous assessment analytics record only funnel metadata', () =>
    assert.equal(r.status, 201),
  );
  let analyticsRow = await database
    .prepare('SELECT * FROM assessment_events WHERE visitor_id=?')
    .bind(analyticsVisitor)
    .first();
  ok(
    'Anonymous assessment event has no account identity or answer text',
    () => {
      assert.equal(analyticsRow.user_id, null);
      assert.equal(analyticsRow.event_type, 'assessment_started');
      assert.equal(Object.hasOwn(analyticsRow, 'message'), false);
    },
  );
  r = await call(
    '/api/uscoo/analytics',
    'POST',
    {
      visitorId: analyticsVisitor,
      eventType: 'result_viewed',
      language: 'zh',
      referrer: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
    },
    'synthetic-analytics-user',
  );
  analyticsRow = await database
    .prepare(
      "SELECT user_id FROM assessment_events WHERE visitor_id=? AND event_type='assessment_started'",
    )
    .bind(analyticsVisitor)
    .first();
  ok(
    'A later sign-in links the same device funnel to the registered account',
    () => {
      assert.equal(r.status, 201);
      assert.equal(analyticsRow.user_id, 'synthetic-analytics-user');
    },
  );
  const leadVisitor = crypto.randomUUID();
  r = await call(
    '/api/uscoo/leads',
    'POST',
    {
      visitorId: leadVisitor,
      name: 'Mainland founder',
      email: 'founder@example.com',
      wechat: 'founder-wechat',
      location: 'CN',
      timing: 'six-months',
      company: 'planning',
      applicationPath: 'self',
      hasChatgpt: 'no',
      wantsInterview: true,
      language: 'zh',
      assessment: {
        currentWork: 'AI startup',
        standoutStory: 'Built a product',
        answers: { critical: 'yes' },
      },
      website: '',
    },
    null,
  );
  const leadRow = await database
    .prepare('SELECT * FROM assessment_leads WHERE visitor_id=?')
    .bind(leadVisitor)
    .first();
  ok(
    'Anonymous users can retain email and assessment demand without ChatGPT sign-in',
    () => {
      assert.equal(r.status, 201, JSON.stringify(r.data));
      assert.equal(leadRow.email, 'founder@example.com');
      assert.equal(leadRow.location, 'CN');
      assert.equal(leadRow.has_chatgpt, 'no');
    },
  );
  const anonymousSupportVisitor = crypto.randomUUID();
  r = await call(
    '/api/uscoo/support',
    'POST',
    {
      visitorId: anonymousSupportVisitor,
      name: 'Synthetic visitor',
      email: 'visitor@example.invalid',
      category: 'technical',
      message: 'The synthetic visitor needs help with the assessment.',
      language: 'en',
      website: '',
    },
    null,
  );
  ok('Anonymous visitors can submit an online support request', () =>
    assert.equal(r.status, 201, JSON.stringify(r.data)),
  );
  r = await call('/api/uscoo/support', 'GET', null, null);
  ok('Anonymous visitors cannot list support records', () =>
    assert.equal(r.status, 401),
  );
  r = await call(
    '/api/uscoo/support',
    'POST',
    {
      visitorId: crypto.randomUUID(),
      name: '',
      email: '',
      category: 'account',
      message: 'Please explain the invitation flow for my account.',
      language: 'en',
      website: '',
    },
    'synthetic-user-a',
  );
  const signedSupportId = r.data.request.id;
  ok('Signed-in support requests use the verified account email', () => {
    assert.equal(r.status, 201);
    assert.equal(r.data.request.email, 'synthetic-user-a@example.invalid');
  });
  r = await call(
    '/api/uscoo/admin/support',
    'PATCH',
    { id: signedSupportId, status: 'answered', reply: 'Synthetic reply.' },
    'synthetic-user-a',
  );
  ok('Non-admin users cannot answer support requests', () =>
    assert.equal(r.status, 403),
  );
  r = await call(
    '/api/uscoo/admin/support',
    'PATCH',
    { id: signedSupportId, status: 'answered', reply: 'Synthetic reply.' },
    'synthetic-admin',
  );
  ok('The configured owner can answer and close the support loop', () =>
    assert.equal(r.status, 200, JSON.stringify(r.data)),
  );
  r = await call('/api/uscoo/support', 'GET', null, 'synthetic-user-a');
  ok('Signed-in users can read the reply in their account history', () => {
    const ticket = r.data.requests.find((item) => item.id === signedSupportId);
    assert.equal(ticket.status, 'answered');
    assert.equal(ticket.reply, 'Synthetic reply.');
  });
  r = await call(
    root,
    'POST',
    { title: 'Synthetic case', requestId: crypto.randomUUID() },
    'synthetic-user-a',
    { origin: 'https://evil.test' },
  ); // explicit origin below
  const bad = await mf.dispatchFetch(origin + root, {
    method: 'POST',
    headers: {
      'oai-authenticated-user-id': 'synthetic-user-a',
      'oai-authenticated-user-email': 'synthetic-user-a@example.invalid',
      'Content-Type': 'application/json',
      origin: 'https://evil.test',
    },
    body: JSON.stringify({ title: 'x', requestId: crypto.randomUUID() }),
  });
  ok('Cross-origin mutation blocked', () => assert.equal(bad.status, 403));
  const home = await call('/', 'GET', null, null);
  ok(
    'Public cover page explains pain points, value and the system entry',
    () => {
      const html = strFromU8(home.bytes);
      assert.equal(home.status, 200);
      assert(html.includes('变成 USCIS 看得懂的证据'));
      assert(html.includes('免费开始'));
      assert(html.includes('不用先有美国公司'));
      assert(html.includes('首次获批期限按实际工作或活动确定'));
      assert(html.includes('coo@uscoo.ai'));
      assert(html.includes('注册 / 登录'));
      assert(!html.includes('进入核心工作台需邀请码'));
      assert(!html.includes('先建立判断'));
      assert(!html.includes('不会在入口前置销售'));
      assert(!html.includes('不把线索数量冒充资格结论'));
      assert(html.includes('href="/beta?view=assessment"'));
    },
  );
  r = await call('/robots.txt', 'GET', null, null);
  ok('Search crawlers can find public pages but not private workspaces', () => {
    const body = strFromU8(r.bytes);
    assert.equal(r.status, 200);
    assert(body.includes('Sitemap: https://www.uscoo.ai/sitemap.xml'));
    assert(body.includes('Disallow: /prepare'));
  });
  r = await call('/sitemap.xml', 'GET', null, null);
  ok(
    'Sitemap uses the custom domain and exposes Chinese and English entries',
    () => {
      const body = strFromU8(r.bytes);
      assert.equal(r.status, 200);
      assert(body.includes('https://www.uscoo.ai/'));
      assert(body.includes('https://www.uscoo.ai/zh'));
    },
  );
  const intro = await call('/beta', 'GET', null, null);
  ok('Overview is readable without application sign-in', () => {
    assert.equal(intro.status, 200);
    assert(strFromU8(intro.bytes).includes('一页看完整条路'));
    assert(strFromU8(intro.bytes).includes('怎么继续'));
    assert(strFromU8(intro.bytes).includes('USCOO 协助你从'));
    assert(!strFromU8(intro.bytes).includes('它不是绿卡'));
  });
  const enIntro = await call('/beta', 'GET', null, null, { cookie: '' });
  ok('English is default and Chinese preference changes SSR language', () => {
    assert(strFromU8(enIntro.bytes).includes('lang="en"'));
    assert(strFromU8(enIntro.bytes).includes('Tell your story'));
    assert(strFromU8(intro.bytes).includes('lang="zh-CN"'));
    assert(strFromU8(intro.bytes).includes('初步评估'));
  });
  r = await call('/beta?view=result', 'GET', null, null);
  ok('Result URL clearly returns an incomplete user to the assessment', () => {
    assert.equal(r.status, 200);
    assert(strFromU8(r.bytes).includes('这一步需要前面的三问'));
  });
  r = await call('/beta?view=assessment', 'GET', null, null);
  ok('Assessment begins with four practical planning choices', () => {
    assert(strFromU8(r.bytes).includes('你希望什么时候开始，又准备怎样申请'));
    assert(!strFromU8(r.bytes).includes('你的姓名（受益人'));
    assert(!strFromU8(r.bytes).includes('顺便说说你的赴美计划（可跳过）'));
    const source = readFileSync(
      'components/uscoo/assessment-conversation.tsx',
      'utf8',
    );
    assert(source.includes('哪一段是你最有把握说'));
    assert(source.includes('期望多久获得申请结果'));
    assert(source.includes('当前所在国家或地区'));
    assert(source.includes('你目前倾向哪种申请方式'));
    assert(source.includes('按经历点选'));
    assert(source.includes('使用简历'));
    assert(source.includes('使用 LinkedIn'));
  });
  const ts = require('typescript');
  const feeJS = ts.transpileModule(
    readFileSync('lib/fee-estimate.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const { estimateFees } = await import(
    'data:text/javascript;base64,' + Buffer.from(feeJS).toString('base64')
  );
  ok(
    'Fee estimator handles employer classes, premium, consular and unknown ranges',
    () => {
      assert.deepEqual(
        estimateFees({
          employer: 'small',
          premium: true,
          route: 'consular',
          services: 0,
        }).total,
        [4000, 4000],
      );
      assert.deepEqual(
        estimateFees({
          employer: 'regular',
          premium: true,
          route: 'consular',
          services: 0,
        }).total,
        [4825, 4825],
      );
      assert.deepEqual(
        estimateFees({
          employer: 'nonprofit',
          premium: false,
          route: 'us',
          services: 100.25,
        }).total,
        [630.25, 630.25],
      );
      assert.deepEqual(
        estimateFees({
          employer: 'unknown',
          premium: false,
          route: 'unknown',
          services: -10,
        }).total,
        [530, 1860],
      );
    },
  );
  const invalidKey = crypto.randomUUID();
  const intake = {
    answers: { critical: 'yes', awards: 'unsure' },
    method: 'resume',
    currentWork: 'SYNTHETIC founder building scheduling software',
    standoutStory:
      'SYNTHETIC rebuilt the product and improved retention with board records available.',
    sourceText:
      'SYNTHETIC resume. Founder of a test company. No verified evidence.',
    sourceName: 'SYNTHETIC-resume.txt',
    beneficiaryName: 'SYNTHETIC BENEFICIARY INTAKE',
    petitionerName: 'SYNTHETIC PETITIONER INTAKE',
    company: 'planning',
    field: 'Software',
    timing: 'exploring',
    consent: true,
  };
  r = await call(root, 'POST', {
    title: 'SYNTHETIC invalid intake',
    requestId: invalidKey,
    intake: { ...intake, consent: false },
  });
  ok('Intake requires explicit save consent and creates no partial case', () =>
    assert.equal(r.status, 400),
  );
  r = await call(`${root}/${invalidKey}`);
  assert.equal(r.status, 404);
  r = await call(root, 'POST', {
    title: 'SYNTHETIC invalid intake',
    requestId: invalidKey,
    intake: { ...intake, answers: { imaginary: 'yes' } },
  });
  ok('Intake rejects unknown criterion keys', () =>
    assert.equal(r.status, 400),
  );
  r = await call(root, 'POST', {
    title: 'SYNTHETIC invalid intake',
    requestId: invalidKey,
    intake: { ...intake, linkedin: 'https://example.invalid/in/impersonation' },
  });
  ok('LinkedIn provenance accepts only an actual LinkedIn profile URL', () =>
    assert.equal(r.status, 400),
  );
  const intakeKey = crypto.randomUUID(),
    intakeBody = {
      title: 'SYNTHETIC beginner preparation',
      requestId: intakeKey,
      intake,
    };
  r = await call(root, 'POST', intakeBody);
  assert.equal(r.status, 201, JSON.stringify(r.data));
  r = await call(`${root}/${intakeKey}`);
  ok(
    'Intake saves atomically as unverified leads, never criterion confirmation',
    () => {
      assert.equal(r.data.project.profile.field, 'Software');
      assert.equal(r.data.project.profile.name, intake.beneficiaryName);
      assert.equal(r.data.project.profile.company, intake.petitionerName);
      assert(
        r.data.records.some((x) => x.kind === 'intake' && !x.body.confirmed),
      );
      const source = r.data.records.find((x) => x.kind === 'evidence');
      assert.equal(source.body.status, 'lead');
      assert.equal(source.body.confirmed, false);
      assert.equal(source.body.modelAllowed, false);
      assert.deepEqual(source.body.criteria, []);
      assert.equal(source.body.file, undefined);
      assert(r.data.records.some((x) => x.kind === 'task'));
    },
  );
  r = await call(root, 'POST', intakeBody);
  assert.equal(r.data.project.id, intakeKey);
  r = await call(`${root}/${intakeKey}`);
  ok('Retrying intake does not duplicate project or sources', () => {
    assert.equal(r.data.records.filter((x) => x.kind === 'intake').length, 1);
    assert.equal(r.data.records.filter((x) => x.kind === 'evidence').length, 1);
  });
  const savedIntake = r.data;
  const revisedIntake = {
    ...intake,
    desiredApproval: '2027-01-15',
    arrivalDate: '2027-02-01',
    workStartDate: '2027-02-10',
    location: 'CN',
    workPlan: 'SYNTHETIC build and sell a scheduling product',
    sourceText: 'SYNTHETIC revised resume — still unverified.',
  };
  r = await call(`${root}/${intakeKey}/intake`, 'POST', {
    revision: savedIntake.project.revision,
    intake: { ...revisedIntake, arrivalDate: '2027-02-30' },
  });
  ok('Impossible dates are rejected without mutating saved intake', () =>
    assert.equal(r.status, 400),
  );
  r = await call(`${root}/${intakeKey}/intake`, 'POST', {
    revision: savedIntake.project.revision,
    intake: revisedIntake,
  });
  ok(
    'Saved assessment can be updated without creating a second project',
    () => {
      assert.equal(r.status, 200, JSON.stringify(r.data));
      assert.equal(r.data.project.id, intakeKey);
    },
  );
  r = await call(`${root}/${intakeKey}`);
  ok(
    'Intake target dates and changed resume are durable, historical and unverified',
    () => {
      assert.equal(r.data.project.profile.desiredApproval, '2027-01-15');
      assert.equal(r.data.project.profile.arrivalDate, '2027-02-01');
      assert.equal(r.data.project.profile.start, '2027-02-10');
      assert.equal(r.data.project.profile.duties, revisedIntake.workPlan);
      assert.equal(r.data.records.filter((x) => x.kind === 'intake').length, 1);
      const revised = r.data.records.find(
        (x) => x.body.excerpt === revisedIntake.sourceText,
      );
      assert(
        revised &&
          revised.body.confirmed === false &&
          revised.body.status === 'lead',
      );
      assert(r.data.records.some((x) => x.body.excerpt === intake.sourceText));
    },
  );
  const shareRevision = r.data.project.revision;
  r = await call(`${root}/${intakeKey}/intake`, 'POST', {
    revision: savedIntake.project.revision,
    intake: revisedIntake,
  });
  ok('Stale assessment updates are rejected', () =>
    assert.equal(r.status, 409),
  );
  r = await call(`${root}/${intakeKey}/lawyer-shares`, 'POST', {
    revision: shareRevision,
    sections: [0, 7],
    days: 7,
    confirmed: false,
  });
  ok('Lawyer share requires explicit confirmation', () =>
    assert.equal(r.status, 400),
  );
  r = await call(
    `${root}/${intakeKey}/lawyer-shares`,
    'POST',
    { revision: shareRevision, sections: [0, 7], days: 7, confirmed: true },
    'synthetic-user-b',
  );
  ok('Other users cannot create lawyer shares for this case', () =>
    assert.equal(r.status, 404),
  );
  r = await call(`${root}/${intakeKey}/lawyer-shares`, 'POST', {
    revision: shareRevision,
    sections: [0, 7],
    days: 7,
    confirmed: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const counselShare = r.data;
  const storedShare = await database
    .prepare('SELECT snapshot,token_hash FROM shares WHERE id=?')
    .bind(counselShare.id)
    .first();
  const shareData = JSON.parse(storedShare.snapshot);
  ok(
    'Lawyer share includes only selected bilingual sections and no original-file controls',
    () => {
      assert.deepEqual(
        shareData.sections.map((x) => x.number),
        [1, 8],
      );
      assert.deepEqual(
        shareData.sectionsEn.map((x) => x.number),
        [1, 8],
      );
      assert(!storedShare.snapshot.includes('sourceId'));
      assert(!storedShare.snapshot.includes('hasFile'));
      assert(!counselShare.url.includes(storedShare.token_hash));
    },
  );
  r = await call(counselShare.url, 'GET', null, null, { cookie: '' });
  ok(
    'Shared counsel snapshot renders English without exposing original downloads',
    () => {
      assert.equal(r.status, 200);
      const html = strFromU8(r.bytes);
      assert(html.includes('Counsel brief'));
      assert(!html.includes('/files/'));
      assert(
        !html.replace(/<script[\s\S]*?<\/script>/g, '').includes('申请主体'),
      );
    },
  );
  r = await call(
    `${root}/${intakeKey}/shares/${counselShare.id}`,
    'DELETE',
    undefined,
    'synthetic-user-b',
  );
  assert.equal(r.status, 404);
  r = await call(`${root}/${intakeKey}/shares/${counselShare.id}`, 'DELETE');
  assert.equal(r.status, 200);
  r = await call(counselShare.url, 'GET', null, null, { cookie: '' });
  ok('Revoked lawyer links no longer return case content', () => {
    assert(strFromU8(r.bytes).includes('This share is no longer available.'));
    assert(!strFromU8(r.bytes).includes(revisedIntake.workPlan));
  });
  r = await call(`${root}/${intakeKey}/lawyer-brief?lang=en`);
  ok(
    'English lawyer DOCX preserves eight-section structure and target dates',
    () => {
      assert.equal(r.status, 200);
      const xml = strFromU8(unzipSync(r.bytes)['word/document.xml']);
      assert(xml.includes('2027-01-15'));
      assert(xml.includes('Software'));
      assert(!xml.includes('一页摘要'));
    },
  );
  r = await call(`${root}/${intakeKey}/lawyer-brief`);
  ok('Eight-section lawyer DOCX retains unverified source status', () => {
    assert.equal(r.status, 200);
    const xml = strFromU8(unzipSync(r.bytes)['word/document.xml']);
    assert(xml.includes('1. 一页摘要'));
    assert(xml.includes('8. 留给律师的问题'));
    assert(xml.includes('SYNTHETIC-resume.txt'));
    assert(xml.includes('线索，待核实'));
    assert(xml.includes('未上传原件'));
  });
  r = await call(
    `${root}/${intakeKey}/lawyer-brief`,
    'GET',
    null,
    'synthetic-user-b',
  );
  ok('Lawyer download remains owner-only', () => assert.equal(r.status, 404));
  r = await call(`/prepare?project=${intakeKey}`);
  ok('Existing preparation workspace remains available after intake', () => {
    const html = strFromU8(r.bytes).replace(/<script[\s\S]*?<\/script>/g, '');
    assert.equal(r.status, 200);
    assert(html.includes('O-1A 杰出人才申请工作台'));
    assert(html.includes('>总览<'));
    assert(!html.includes('class="founder-progress"'));
  });
  ok(
    'Workspace uses one concise navigation and keeps Agent help optional',
    () => {
      const workspace = readFileSync('components/uscoo/workspace.tsx', 'utf8');
      const progress = readFileSync(
        'components/uscoo/project-progress-overview.tsx',
        'utf8',
      );
      const optionalAgent = readFileSync(
        'components/uscoo/agent-assist-entry.tsx',
        'utf8',
      );
      assert(progress.includes('项目进度'));
      assert(progress.includes('这一步完成了'));
      assert(!progress.includes('已记录'));
      assert(!progress.includes('workflow records completed'));
      assert(workspace.includes('你的杰出能力证明文书'));
      assert(workspace.includes('申请公司与赴美工作文书'));
      assert(!workspace.includes('ApplicationCoreMap'));
      assert(!workspace.includes('AgentServiceModel'));
      assert(workspace.includes("profile.preparationMode === 'diy'"));
      assert(optionalAgent.includes('查看本步骤 Agent 服务'));
      assert(optionalAgent.includes('未确认支付不会扣除积分'));
      const reviewDialog = readFileSync(
        'components/uscoo/journey-review-dialog.tsx',
        'utf8',
      );
      assert(reviewDialog.includes('回看前期路径'));
      assert(reviewDialog.includes('重新选择申请方式'));
      assert(reviewDialog.includes('/beta?view=assessment'));
      assert(reviewDialog.includes('/pre-review'));
      assert(reviewDialog.includes('/lawyer'));
    },
  );
  r = await call('/lawyer', 'GET', null, null);
  ok(
    'Application-method page presents self-filing and optional law-firm branches',
    () => {
      assert.equal(r.status, 200);
      assert(strFromU8(r.bytes).includes('自主申请，还是委托律所'));
      assert(strFromU8(r.bytes).includes('两种申请准备方式'));
      assert(strFromU8(r.bytes).includes('只有选择律所后'));
      assert(!strFromU8(r.bytes).includes('申请积分'));
      const choice = readFileSync(
        'components/uscoo/preparation-choice.tsx',
        'utf8',
      );
      assert(choice.includes("fetch(base, { cache: 'no-store' })"));
      assert(choice.includes('onData(next)'));
      assert(choice.includes("t('正在切换…', 'Switching…')"));
    },
  );
  ok('Public summary and saved full report have distinct value', () => {
    const entry = readFileSync('components/uscoo/founder-entry.tsx', 'utf8');
    assert(entry.includes('downloadSnapshot'));
    assert(entry.includes('downloadFullReport'));
    assert(entry.includes('下载当前结果摘要'));
    assert(entry.includes('保存结果并获取完整报告'));
    assert(entry.includes('姓名或称呼（必填）'));
  });
  for (const route of [
    '/beta',
    '/beta?view=assessment',
    '/beta?view=result',
    '/pre-review',
    '/lawyer',
  ]) {
    const page = await call(route, 'GET', null, null);
    const html = strFromU8(page.bytes).replace(
      /<script[\s\S]*?<\/script>/g,
      '',
    );
    ok(
      `Navigation shell stays accessible and returns to the cover page: ${route}`,
      () => {
        assert.equal(page.status, 200);
        assert(/href="\/"[^>]*class="founder-brand"/.test(html));
        assert(html.includes('href="/pre-review"'));
        assert(html.includes('href="/lawyer"'));
        assert(html.includes('href="/prepare"'));
      },
    );
  }
  r = await call('/prepare', 'GET', null, 'synthetic-user-a', { cookie: '' });
  ok('Formal workspace switches to workspace-only navigation', () => {
    const html = strFromU8(r.bytes).replace(/<script[\s\S]*?<\/script>/g, '');
    assert.equal(r.status, 200);
    assert(
      /aria-label="(?:申请工作台分区|Application workspace sections)"/.test(
        html,
      ),
    );
    assert(/>总览<|>Overview</.test(html));
    assert(/公司与工作安排|Company &amp; work/.test(html));
    assert(/递交与跟进|File &amp; follow up/.test(html));
    assert(!html.includes('class="founder-progress"'));
    assert(!html.includes('USCIS 材料预审清单'));
    assert(!html.includes('USCOO Agent 服务'));
    assert(/回看前期路径|Review guided steps/.test(html));
  });
  r = await call('/prepare', 'GET', null, 'synthetic-user-pending');
  ok(
    'Pending accounts see the invitation gate instead of workspace data',
    () => {
      const html = strFromU8(r.bytes).replace(/<script[\s\S]*?<\/script>/g, '');
      assert.equal(r.status, 200);
      assert(/核心工作台准入|Core workspace access/.test(html));
      assert(!html.includes('aria-label="申请工作台分区"'));
    },
  );
  r = await call('/account');
  ok(
    'Account center exposes access, private projects and referral rewards',
    () => {
      const html = strFromU8(r.bytes);
      assert.equal(r.status, 200);
      assert(html.includes('我的 USCOO 账号'));
      assert(html.includes('核心工作台权限'));
      assert(html.includes('内测申请积分'));
    },
  );
  r = await call('/join?ref=UCINVITE99', 'GET', null, null);
  ok('Referral link preserves the invite through ChatGPT sign-in', () => {
    const html = strFromU8(r.bytes);
    assert.equal(r.status, 200);
    assert(html.includes('登录并接受邀请'));
    assert(html.includes('return_to'));
    assert(html.includes('UCINVITE99'));
  });
  ok('Workspace keeps fees at the bottom of dual-track preparation', () => {
    const workspace = readFileSync('components/uscoo/workspace.tsx', 'utf8');
    const prepareStart = workspace.indexOf("step === 'prepare'");
    const draftStart = workspace.indexOf("step === 'draft'", prepareStart);
    const prepareSource = workspace.slice(prepareStart, draftStart);
    assert(prepareSource.indexOf('{t(evidenceTable())}') >= 0);
    assert(
      prepareSource.indexOf('<FeeCalculator />') >
        prepareSource.indexOf('{t(evidenceTable())}'),
    );
    const css = readFileSync('app/globals.css', 'utf8');
    assert(/\.next-action\s*\{[^}]*background:\s*#285d43/s.test(css));
  });
  r = await call('/pre-review', 'GET', null, null, { cookie: '' });
  ok(
    'Pre-review is a standalone USCIS checklist with handoff and workspace exits',
    () => {
      const html = strFromU8(r.bytes);
      assert(html.includes('USCIS criteria'));
      assert(html.includes('Next: choose an application method'));
      assert(html.includes('Original Contributions'));
      assert(!html.includes('review-sections'));
    },
  );
  r = await call('/beta', 'GET', null, null, { cookie: '' });
  ok(
    'Overview explains petitioner inside the platform and distinguishes government charges',
    () => {
      const html = strFromU8(r.bytes);
      assert(html.includes('id="petitioner"'));
      assert(html.includes('not USCOO platform service fees'));
      assert(html.includes('Company and personal evidence tracks'));
      assert(html.includes('3 categories available'));
      assert(html.includes('How to continue'));
    },
  );
  let modeCase = (await call(`${root}/${intakeKey}`)).data;
  r = await call(`${root}/${intakeKey}/profile`, 'POST', {
    revision: modeCase.project.revision,
    profile: { ...modeCase.project.profile, preparationMode: 'counsel' },
  });
  assert.equal(r.status, 200);
  modeCase = (await call(`${root}/${intakeKey}`)).data;
  ok(
    'Counsel branch persists on the existing project and preserves its records',
    () => {
      assert.equal(modeCase.project.profile.preparationMode, 'counsel');
      assert.equal(modeCase.project.profile.name, intake.beneficiaryName);
      assert(modeCase.records.some((x) => x.kind === 'intake'));
    },
  );
  r = await call(`${root}/${intakeKey}/profile`, 'POST', {
    revision: modeCase.project.revision,
    profile: { ...modeCase.project.profile, preparationMode: 'diy' },
  });
  assert.equal(r.status, 200);
  modeCase = (await call(`${root}/${intakeKey}`)).data;
  ok(
    'User can switch to DIY without changing projects or discarding evidence',
    () => {
      assert.equal(modeCase.project.profile.preparationMode, 'diy');
      assert(modeCase.records.some((x) => x.kind === 'evidence'));
    },
  );
  r = await call(`${root}/${intakeKey}/company-plan`, 'POST', {
    revision: modeCase.project.revision,
    goal: 'company-only',
    entityType: 'llc',
    formationState: 'California',
    formationStatus: 'choosing',
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  modeCase = (await call(`${root}/${intakeKey}`)).data;
  ok(
    'Company-only path creates an editable formation-to-operations plan',
    () => {
      assert.equal(modeCase.project.profile.companyGoal, 'company-only');
      assert.equal(modeCase.project.profile.entityType, 'llc');
      assert.equal(modeCase.project.profile.formationState, 'California');
      const keys = modeCase.records
        .filter((x) => x.kind === 'task')
        .map((x) => x.body.planKey);
      assert(keys.includes('company-formation'));
      assert(keys.includes('company-operations'));
      assert(!keys.includes('petitioner-i129'));
    },
  );
  const companyPlanCount = modeCase.records.filter(
    (x) => x.kind === 'task' && x.body.planKey,
  ).length;
  r = await call(`${root}/${intakeKey}/company-plan`, 'POST', {
    revision: modeCase.project.revision,
    goal: 'company-only',
    entityType: 'llc',
    formationState: 'California',
    formationStatus: 'choosing',
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  modeCase = (await call(`${root}/${intakeKey}`)).data;
  ok('Regenerating the company plan does not duplicate its tasks', () => {
    assert.equal(r.data.added, 0);
    assert.equal(
      modeCase.records.filter((x) => x.kind === 'task' && x.body.planKey)
        .length,
      companyPlanCount,
    );
  });
  const createKey = crypto.randomUUID();
  r = await call(root, 'POST', {
    title: 'SYNTHETIC USCOO QA',
    requestId: createKey,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const id = r.data.project.id,
    base = `${root}/${id}`;
  r = await call(root, 'POST', {
    title: 'SYNTHETIC USCOO QA',
    requestId: createKey,
  });
  ok('Create idempotency preserves one project', () =>
    assert.equal(r.data.project.id, id),
  );
  const get = async () => {
    const x = await call(base);
    assert.equal(x.status, 200, JSON.stringify(x.data));
    return x.data;
  };
  let c = await get();
  ok(
    'T01 New case starts with evidence tasks and adds company tasks from one canonical plan',
    () => {
      assert(!c.records.some((x) => x.body.track === 'company'));
      assert(c.records.some((x) => x.body.track === 'evidence'));
    },
  );
  r = await call(base, 'GET', null, 'synthetic-user-b');
  ok('T24 Cross-user case read returns 404', () => assert.equal(r.status, 404));
  const rev = c.project.revision;
  const profile = {
    name: 'SYNTHETIC BENEFICIARY',
    company: 'SYNTHETIC COMPANY',
    field: 'Software',
    role: 'Founder',
    duties: 'Build a scheduling product',
    start: '2026-10-01',
    end: '2027-10-01',
    workplace: 'Remote',
    pay: '100000 USD per year',
    premium: false,
    modelConsent: false,
  };
  r = await call(base + '/profile', 'POST', { revision: rev, profile });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await call(base + '/profile', 'POST', {
    revision: rev,
    profile: { ...profile, name: 'STALE' },
  });
  ok('Concurrent stale profile update rejected', () =>
    assert.equal(r.status, 409),
  );
  c = await get();
  ok('Rejected write did not overwrite facts', () =>
    assert.equal(c.project.profile.name, 'SYNTHETIC BENEFICIARY'),
  );
  async function record(kind, body, recordId) {
    c = await get();
    return call(base + '/records', 'POST', {
      revision: c.project.revision,
      kind,
      body,
      id: recordId,
    });
  }
  r = await record('event', {
    title: 'Synthetic team achievement',
    date: '2025',
    role: 'Contributor',
    action: 'Built an interface',
    result: 'A team delivered a release',
    team: 'Teammates built the backend',
    confirmed: true,
    hypothesis: true,
    sourceIds: [],
    criteria: ['critical'],
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const eventId = r.data.id;
  c = await get();
  ok('T05/T06 Hypothesis is never confirmed as fact', () =>
    assert.equal(c.records.find((x) => x.id === eventId).body.confirmed, false),
  );
  r = await record('evidence', {
    title: 'Unclear scan',
    excerpt: '',
    status: 'reviewed',
    confirmed: true,
    page: '1',
    sourceIds: [],
  });
  ok('T10 Empty scan cannot be marked reviewed', () =>
    assert.equal(r.status, 422),
  );
  const source = {
    title: 'Synthetic employer statement',
    issuer: 'Synthetic signatory',
    date: '2025-01-01',
    page: 'Page 1, paragraph 2',
    excerpt:
      'SYNTHETIC BENEFICIARY built a scheduling product. Remuneration was 100000 USD per year.',
    criteria: ['critical', 'salary'],
    status: 'reviewed',
    confirmed: true,
    authenticity: 'unverified',
    independence: 'related',
    translation: 'not-needed',
    language: '英文',
    modelAllowed: false,
    sourceIds: [],
  };
  r = await record('evidence', source);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const sid = r.data.id;
  r = await record('event', {
    title: 'Foreign source',
    sourceIds: ['outside-project-id'],
  });
  ok('T24 Cross-project source references blocked', () =>
    assert.equal(r.status, 422),
  );
  r = await record('evidence', {
    ...source,
    title: 'Unknown field',
    shareEverything: true,
  });
  ok('T25 Unknown data fields rejected by schema', () =>
    assert.equal(r.status, 400),
  );
  c = await get();
  r = await call(base + '/draft', 'POST', {
    revision: c.project.revision,
    type: 'lawyer',
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const did = r.data.id;
  c = await get();
  const doc = c.records.find((x) => x.id === did);
  ok('T06 Hypothesis excluded from generated narrative', () =>
    assert(!doc.body.content.includes('Built an interface')),
  );
  ok('T04 Eight criteria in preparation output', () =>
    assert(
      doc.body.content.includes('Membership') &&
        doc.body.content.includes('Scholarly articles'),
    ),
  );
  r = await record('document', {
    ...doc.body,
    stale: undefined,
    state: 'canonical',
    confirmed: true,
    reviewedFacts: true,
  });
  ok('T12 Incomplete placeholder draft cannot be canonical', () =>
    assert.equal(r.status, 422),
  );
  r = await call('/beta');
  ok('Beginner entry renders overview before project creation', () => {
    assert.equal(r.status, 200);
    assert(strFromU8(r.bytes).includes('USCOO'));
    assert(strFromU8(r.bytes).includes('先看懂 O-1A'));
    assert(strFromU8(r.bytes).includes('初步评估'));
    assert(strFromU8(r.bytes).includes('15 个工作日'));
    assert(!strFromU8(r.bytes).includes('先把你已经做过的事放到一起'));
  });
  const canonical = {
    title: 'Synthetic reviewed facts',
    type: 'work',
    content:
      'Synthetic reviewed fact: remuneration was 100000 USD per year. Source checked.',
    state: 'canonical',
    confirmed: true,
    reviewedFacts: true,
    sourceIds: [sid],
  };
  r = await record(
    'document',
    { ...canonical, content: 'Invented revenue: 999999999 USD.' },
    did,
  );
  ok('T12 Unsupported numeric claim blocked from canonical output', () =>
    assert.equal(r.status, 422),
  );
  r = await record('document', canonical, did);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  c = await get();
  r = await call(base + '/profile', 'POST', {
    revision: c.project.revision,
    profile: { ...c.project.profile, preparationMode: 'counsel' },
  });
  assert.equal(r.status, 200);
  c = await get();
  ok(
    'Changing preparation mode alone preserves current reviewed documents',
    () => assert(!c.records.find((x) => x.id === did).body.stale),
  );
  r = await record(
    'evidence',
    { ...source, excerpt: source.excerpt + ' A new date requires review.' },
    sid,
  );
  assert.equal(r.status, 200, JSON.stringify(r.data));
  c = await get();
  ok('T11/T18 Evidence change invalidates canonical document', () =>
    assert(c.records.find((x) => x.id === did).body.stale),
  );
  r = await call(base + `/records/${sid}/history`);
  ok('Prior source version retained', () =>
    assert.equal(r.data.versions[0].body.excerpt, source.excerpt),
  );
  c = await get();
  r = await call(base + '/freeze', 'POST', {
    revision: c.project.revision,
    confirmed: true,
  });
  ok('T17 Missing filing checks block freeze', () =>
    assert.equal(r.status, 422),
  );
  r = await record('filing', {
    title: 'Printed pages',
    event: 'prepared',
    date: '2026-09-07',
    confirmed: true,
    sourceIds: [sid],
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  c = await get();
  ok('T20 Print record stays prepared', () =>
    assert.equal(
      c.records.find((x) => x.id === r.data.id).body.event,
      'prepared',
    ),
  );
  r = await record('filing', {
    title: 'Not actually mailed',
    event: 'dispatched',
    date: '2026-09-07',
    confirmed: true,
    sourceIds: [],
  });
  ok('T20 Dispatch requires packet and proof', () =>
    assert.equal(r.status, 422),
  );
  r = await record('filing', {
    title: 'Synthetic consular request',
    event: '221g',
    date: '2026-09-07',
    notes: 'Synthetic notification',
    sourceIds: [sid],
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  c = await get();
  ok('T23 Consular 221g remains separate event', () =>
    assert.equal(c.records.find((x) => x.id === r.data.id).body.event, '221g'),
  );
  r = await record('filing', {
    title: 'Synthetic RFE',
    event: 'rfe',
    date: '2026-09-07',
    deadline: '2026-10-01',
    deadlineConfirmed: false,
    sourceIds: [sid],
  });
  ok('T22 Unconfirmed notice deadline blocked', () =>
    assert.equal(r.status, 422),
  );
  const fd = new FormData();
  fd.append(
    'file',
    new File(['Synthetic private attachment'], 'synthetic.txt', {
      type: 'text/plain',
    }),
  );
  c = await get();
  fd.append('revision', String(c.project.revision));
  r = await call(base + '/upload', 'POST', fd);
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const fid = r.data.recordId;
  r = await call(base + `/files/${fid}`, 'GET', null, 'synthetic-user-b');
  ok('T24 Original file protected from another user', () =>
    assert.equal(r.status, 404),
  );
  r = await call(base + `/files/${fid}`);
  ok('T29 Uploaded bytes survive separate request', () =>
    assert.equal(strFromU8(r.bytes), 'Synthetic private attachment'),
  );
  c = await get();
  r = await call(base + '/agent', 'POST', {
    requestKey: crypto.randomUUID(),
    message: 'Review',
  });
  ok('Model absent gives honest unavailable state', () =>
    assert.equal(r.status, 503),
  );
  c = await get();
  r = await call(base + '/shares', 'POST', {
    revision: c.project.revision,
    confirmed: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const shareId = r.data.id;
  const share = await database
    .prepare('SELECT * FROM shares WHERE id=?')
    .bind(shareId)
    .first();
  ok('T25 Anonymous snapshot excludes facts and identifiers', () => {
    assert(!share.snapshot.includes('SYNTHETIC'));
    assert(!share.snapshot.includes('100000'));
    assert.deepEqual(Object.keys(JSON.parse(share.snapshot)).sort(), [
      'company',
      'created',
      'evidence',
    ]);
  });
  r = await call(base + `/shares/${shareId}`, 'DELETE');
  assert.equal(r.status, 200);
  const revoked = await database
    .prepare('SELECT revoked FROM shares WHERE id=?')
    .bind(shareId)
    .first();
  ok('T25 Revocation persisted', () => assert.equal(revoked.revoked, 1));
  r = await call(base + '/export');
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const zip = unzipSync(r.bytes);
  ok('T30 Export contains DOCX, original, source list, manifest, data', () => {
    assert(zip['01-lawyer-brief.docx']);
    assert(zip['02-case-data.json']);
    assert(zip['04-manifest.json']);
    assert(Object.keys(zip).some((x) => x.startsWith('originals/')));
    const docx = unzipSync(zip['01-lawyer-brief.docx']);
    assert(strFromU8(docx['word/document.xml']).includes('SYNTHETIC'));
  });
  r = await record('document', canonical, did);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const today = new Date().toISOString().slice(0, 10);
  for (const gate of [
    'composition',
    'consistency',
    'forms',
    'signatures',
    'fees',
    'address',
    'processing',
  ]) {
    r = await record('gate', {
      gate,
      confirmed: true,
      note: 'Synthetic review evidence for this isolated test only.',
      reviewedOn: today,
      sourceIds: [sid],
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
  c = await get();
  r = await call(base + '/freeze', 'POST', {
    revision: c.project.revision,
    confirmed: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const packetId = r.data.id;
  c = await get();
  const frozen = c.records.find((x) => x.id === packetId).body.snapshotHash;
  r = await call(base + '/profile', 'POST', {
    revision: c.project.revision,
    profile: { ...profile, start: '2026-11-01' },
  });
  assert.equal(r.status, 200);
  c = await get();
  ok('T18/T19 Frozen snapshot preserved after changes', () =>
    assert.equal(
      c.records.find((x) => x.id === packetId).body.snapshotHash,
      frozen,
    ),
  );
  ok('T19 Facts changed invalidate all gates', () =>
    assert(
      c.records
        .filter((x) => x.kind === 'gate')
        .every((x) => !x.body.confirmed),
    ),
  );
  r = await record('gate', {
    gate: 'forms',
    confirmed: true,
    note: 'Synthetic outdated check evidence.',
    reviewedOn: '2020-01-01',
    sourceIds: [sid],
  });
  ok('T21 Cross-day checks cannot be approved', () =>
    assert.equal(r.status, 422),
  );
  r = await call(base + `/packets/${packetId}`);
  ok('Frozen packet exports actual retained content', () =>
    assert.equal(r.status, 200, JSON.stringify(r.data)),
  );
  r = await record('filing', {
    title: 'Synthetic dispatch',
    event: 'dispatched',
    date: today,
    packetId,
    sourceIds: [sid],
    confirmed: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const dispatchId = r.data.id;
  r = await record(
    'filing',
    {
      title: 'Overwrite dispatch',
      event: 'dispatched',
      date: today,
      packetId,
      sourceIds: [sid],
      confirmed: true,
    },
    dispatchId,
  );
  ok('Filed/dispatch facts cannot be overwritten', () =>
    assert.equal(r.status, 422),
  );
  mkdirSync('docs', { recursive: true });
  writeFileSync(
    'docs/integration-results.json',
    JSON.stringify(
      {
        created: new Date().toISOString(),
        scope:
          'Isolated Worker, synthetic identities/data; no production user records',
        checks,
      },
      null,
      2,
    ),
  );
  process.stdout.write(`\n${checks.length} integration checks passed.\n`);
} finally {
  await mf.dispose();
}
