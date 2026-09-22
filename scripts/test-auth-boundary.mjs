import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare } = wranglerRequire('miniflare');
const modules = [
  { type: 'ESModule', path: resolve('dist/server/index.js') },
  ...readdirSync('dist/server', { recursive: true })
    .filter((p) => /\.m?js$/.test(p) && p !== 'index.js')
    .map((p) => ({ type: 'ESModule', path: resolve('dist/server', p) })),
];

const mf = new Miniflare({
  modules,
  modulesRoot: resolve('dist/server'),
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['DB'],
  r2Buckets: ['BUCKET'],
  // Deliberately omit USCOO_SITES_AUTH_TRUSTED.
  bindings: {},
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

const origin = 'https://uscoo-auth-boundary.test';

try {
  const publicPage = await mf.dispatchFetch(origin + '/', { method: 'GET' });
  assert.equal(publicPage.status, 200);
  console.log('PASS Public pages remain anonymous without Sites auth');

  const forgedIdentity = await mf.dispatchFetch(
    origin + '/api/uscoo/projects',
    {
      method: 'GET',
      headers: {
        'oai-authenticated-user-id': 'forged-user',
        'oai-authenticated-user-email': 'forged@example.invalid',
      },
    },
  );
  assert.equal(forgedIdentity.status, 503);
  console.log(
    'PASS Forged identity headers are rejected without trusted Sites auth',
  );
} finally {
  await mf.dispose();
}
