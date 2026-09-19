# Cloudflare deployment

Padelboard runs on Cloudflare Workers with the OpenNext adapter. Supabase remains the database, Auth and Realtime backend.

## Commands

- `npm ci`
- `npm test`
- `npm run build:cloudflare`
- `npm run preview:cloudflare` to test the Worker locally
- `npx opennextjs-cloudflare deploy` to publish an already-built Worker

Build-time environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` and `OPENAI_API_KEY` (the homepage checks availability). Local builds load the ignored `.env.local` file. For hosted builds, set these through encrypted build variables.

Runtime secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `OPENAI_BOARD_MODEL`. Configure with `wrangler secret put NAME` or the Cloudflare dashboard. Never commit their values. The service key and OpenAI key must remain server-only.

Supabase Auth includes the production `/auth/callback` and `/auth/callback?match=*` URLs alongside localhost. Google OAuth remains disabled until credentials are configured.

The legacy Railway configuration is retained for rollback. Cloudflare does not execute the old Vercel cron configuration. Draft cleanup is inactive unless a scheduler and `CRON_SECRET` are explicitly configured; the endpoint rejects all requests without a configured secret.
