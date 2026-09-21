import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler/package.json'))('miniflare');
let count = 0;
const check = (label, fn) => { fn(); count++; console.log('PASS ' + label); };
const modules = [{type:'ESModule',path:resolve('dist/server/index.js')}, ...readdirSync('dist/server',{recursive:true}).filter(p=>/\.m?js$/.test(p)&&p!=='index.js').map(p=>({type:'ESModule',path:resolve('dist/server',p)}))];
for (const configured of [false, true]) {
  let providerCode = 200, malformed = false;
  const sends = [];
  const mf = new Miniflare({ modules, modulesRoot:resolve('dist/server'), compatibilityDate:'2026-05-15', compatibilityFlags:['nodejs_compat'], d1Databases:['DB'], r2Buckets:['BUCKET'], cf:false,
    bindings:{USCOO_ADMIN_USER_IDS:'mail-admin', ...(configured?{RESEND_API_KEY:'test-only-key', USCOO_EMAIL_FROM:'USCOO <reports@example.invalid>'}:{})},
    outboundService: async request => {
      assert.equal(request.url,'https://api.resend.com/emails');
      sends.push({ body:await request.json(), key:request.headers.get('Idempotency-Key') });
      return Response.json(malformed ? {} : providerCode===200?{id:'mock-provider-id-'+sends.length}:{message:'mock rejection'}, {status:providerCode});
    },
  });
  try {
    const database = await mf.getD1Database('DB');
    for(const file of readdirSync('drizzle').filter(p=>p.endsWith('.sql')).sort()) for(const sql of readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint')) if(sql.trim()) await database.prepare(sql).run();
    async function call(path, body, user = '') {
      const r = await mf.dispatchFetch('https://uscoo.test'+path,{method:'POST',headers:{origin:'https://uscoo.test','content-type':'application/json', ...(user?{'oai-authenticated-user-id':user}:{})},body:JSON.stringify(body)});
      return {status:r.status, body:await r.json()};
    }
    const input = {requestId:crypto.randomUUID(), visitorId:crypto.randomUUID(), name:'Test founder',email:'founder@example.invalid',location:'CN',timing:'six-months',company:'planning',applicationPath:'self',language:'en',assessment:{currentWork:'I founded an AI startup.',standoutStory:'I led product development.',sourceText:'Imported resume facts must remain in the report.',answers:{critical:'yes'}}};
    let r = await call('/api/uscoo/leads',input);
    check(configured?'Provider accepts report':'Missing configuration is explicit',()=>{assert.equal(r.status,201);assert.equal(r.body.lead.emailStatus,configured?'accepted':'blocked');});
    const out = await database.prepare('SELECT * FROM email_outbox').first();
    check('Durable report and recipient, including imported resume',()=>{assert.equal(out.recipient,input.email);assert.match(out.body,/Imported resume facts/);assert.match(out.body,/Eight criteria/);assert.equal(out.status,configured?'accepted':'blocked');});
    await call('/api/uscoo/leads',input);
    check('Retrying a submission does not duplicate leads or accepted mail',()=>{assert.equal(sends.length,configured?1:0);});
    const leadCount = await database.prepare('SELECT COUNT(*) AS n FROM assessment_leads').first();
    check('Single durable lead',()=>assert.equal(leadCount.n,1));
    r = await call('/api/uscoo/admin/email',{id:out.id});
    check('Anonymous users cannot retry mail',()=>assert.equal(r.status,401));
    r = await call('/api/uscoo/admin/email',{id:out.id},'untrusted-user');
    check('Non-admin users cannot retry mail',()=>assert.equal(r.status,403));
    r = await call('/api/uscoo/leads',{...input,requestId:crypto.randomUUID(),email:'bad@@example..com'});
    check('Invalid recipient is rejected before mail dispatch',()=>assert.equal(r.status,400));
    const support={visitorId:crypto.randomUUID(),requestId:crypto.randomUUID(),email:'visitor@example.invalid',category:'technical',message:'Test a support question without sending a real email.',language:'zh'};
    r = await call('/api/uscoo/support',support);
    check('Support save has explicit delivery status',()=>{assert.equal(r.status,201);assert.equal(r.body.request.emailStatus,configured?'accepted':'blocked');});
    if(configured) {
      check('Staff notification uses fixed mailbox and visitor Reply-To',()=>{const m=sends.at(-1).body;assert.deepEqual(m.to,['coo@uscoo.ai']);assert.equal(m.reply_to,support.email);assert.equal(m.from,'USCOO <reports@example.invalid>');assert.ok(sends.at(-1).key);});
      providerCode=422;
      r=await call('/api/uscoo/leads',{...input,requestId:crypto.randomUUID(),visitorId:crypto.randomUUID(),email:'rejected@example.invalid'});
      check('Provider rejection does not lose assessment or report',()=>{assert.equal(r.status,201);assert.equal(r.body.lead.emailStatus,'failed');});
      const rejected=await database.prepare("SELECT id FROM email_outbox WHERE status='failed'").first();
      providerCode=200;
      r=await call('/api/uscoo/admin/email',{id:rejected.id},'mail-admin');
      check('Admin retries an explicitly rejected message',()=>assert.equal(r.body.emailStatus,'accepted'));
      providerCode=503;
      r=await call('/api/uscoo/leads',{...input,requestId:crypto.randomUUID(),visitorId:crypto.randomUUID(),email:'unknown@example.invalid'});
      check('Uncertain provider result is not called delivered',()=>assert.equal(r.body.lead.emailStatus,'unknown'));
      const uncertain=await database.prepare("SELECT id FROM email_outbox WHERE status='unknown'").first();
      const before=sends.length;
      await call('/api/uscoo/admin/email',{id:uncertain.id},'mail-admin');
      check('Uncertain delivery is not blindly resent',()=>assert.equal(sends.length,before));
      providerCode=200; malformed=true;
      r=await call('/api/uscoo/leads',{...input,requestId:crypto.randomUUID(),visitorId:crypto.randomUUID(),email:'malformed@example.invalid'});
      check('Success HTTP status without provider ID is not accepted',()=>assert.equal(r.body.lead.emailStatus,'unknown'));
    }
  } finally { await mf.dispose(); }
}
console.log(`${count} email checks passed with a mock provider; no real emails sent.`);
