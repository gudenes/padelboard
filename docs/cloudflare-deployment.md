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

## Production routing

`padelboard.padellabs.tech/*` is routed directly to the `padelboard` Worker. `padelboard.gudenes.workers.dev` is also available for smoke checks. The previous proxied DNS origin and Railway service are retained for rollback; normal app requests are handled by Workers. Removing the Worker route would restore the old origin.

Validated: production build, 141 unit tests, server secrets absent from public assets, Worker health/login/unauthenticated redirects, and a disposable authenticated match exercising score editing, serving, finish/reset and design persistence.

Vercel Git auto-deployments are disabled in `vercel.json`. Website AI design was verified against padellabs.tech. Maresme currently returns an anti-bot HTTP 202 response to Worker fetch; its logo can be uploaded instead.
