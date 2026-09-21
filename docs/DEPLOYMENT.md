# Deployment

## Recommended target: ChatGPT Sites

The v0.1 runtime is designed for Sites because it uses Sites authentication, D1, R2, and hosted runtime values.

1. Create a separate Sites project for your deployment.
2. Copy the new project ID into `.openai/hosting.json`; keep the binding names `DB` and `BUCKET` unless you also update the code.
3. Configure runtime values in the host settings, not in source control.
4. Apply the SQL files in `drizzle/` to the deployment's D1 database in filename order.
5. Build and test before publishing:

   ```bash
   pnpm install --frozen-lockfile
   pnpm lint
   pnpm build
   pnpm test
   ```

6. Test sign-in, a new case, file upload/download, share-link expiry, cross-user denial, and admin denial before inviting users.

The checked-in project ID is deliberately a placeholder and cannot affect `uscoo.ai`.

## Runtime values

Set only the integrations you use. See `.env.example` for names. Keep model and email values blank to run without those services.

## Domain and SEO

This snapshot retains the canonical `www.uscoo.ai` metadata as part of the original product. Fork operators must change `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `components/uscoo/seo-json-ld.tsx`, and `proxy.ts` to their own domain before public deployment.

## Non-Sites hosting

Non-Sites hosting is not a drop-in operation in v0.1. A port must provide:

- a trusted identity provider and server-side header/session verification;
- SQL storage compatible with the existing data-access layer;
- private object storage with authorized downloads;
- migration and backup procedures; and
- regression tests for cross-tenant access.

Never accept `oai-authenticated-user-*` headers directly from the public internet.
