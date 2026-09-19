# PadelBoard database connection

Connected on 2026-09-19 to the existing Supabase project **PadelBoard**, reference `vrflgmknycmlnafshimq` (eu-west-1).

Local credentials are stored in ignored `.env.local` with mode 0600. The service key is server-only. The Supabase CLI link under `supabase/.temp/` is also ignored. No Railway deployment settings were changed.

Applied migrations:
- `20260418000000_initial_schema.sql`: profiles, matches, match_events, realtime and timestamps.
- `20260418000001_rls_policies.sql`: initial access policies.
- `20260418000002_storage.sql`: logo assets bucket.
- `20260919000000_protect_drafts.sql`: anonymous reads only for published/finished matches without edit tokens; corresponding event restrictions; draft logo uploads via the authorized server API.

The match and overlay pages no longer serialize draft edit tokens to clients. Draft overlays are not public. The realtime hook re-fetches current state when replication is ready, including after reconnect.

Verified against the actual database:
- Draft create, PATCH and read-back of doubles, custom design and Star Point configuration.
- Invalid edit tokens rejected; anonymous users cannot select drafts.
- Rendered match page does not expose its draft token; unpublished overlay returns 404.
- Point action updates state and writes match_events.
- A synthetic published overlay loads; anonymous Realtime receives its score update.
- All temporary test matches and events were removed.
- Local browser shows Save & continue enabled. No login emails were sent.

Manual check: `node scripts/check-database.mjs`. It writes one temporary match into the configured database and removes that exact match in finally; run only with authorization for that test write. It uses the local dev server at port 3003. Realtime test waits for PostgreSQL subscription readiness before writing.

Remaining separate validation: email delivery, Supabase Auth redirect allow-list for localhost:3003 and the intended production hostname, and the full authenticated publication journey. Production hosting/deployment and OpenAI credentials were not changed.

## Local authentication redirect (2026-09-19)

The remote auth config still pointed at localhost:3000 with an empty redirect allowlist. Updated Site URL to http://localhost:3003/auth/callback and added the exact callback plus its ?match=* variant. Existing email templates already use ConfirmationURL. A temporary no-email admin-generated signup link confirmed the requested callback and match ID survive; the temporary account was removed. Old links must be replaced with a new sign-in request.

SignIn stores a one-hour pending match ID cookie as a fallback if the return URL loses its match query. Callback errors go to a visible login error rather than the homepage. PKCE links must still open in the browser that requested them so it retains the verifier and draft token.

## Email code sign-in (2026-09-19)

Replaced link-based sign-in in the new workspace with email OTP entry. Both signup confirmation and magic-link templates now show Token only, with no consumable login link. The existing project settings are preserved: eight digits and 3600-second validity. Client verification uses verifyOtp({email, token, type: 'email'}), then the authenticated callback returns to the original match. A 60-second resend cooldown and explicit invalid-code/network errors are shown.

Verified an eight-digit code against the actual auth service with a temporary generated test identity and a PKCE client, without sending email or printing credentials. Session creation succeeded; signed out and removed the temporary user. The earlier generic callback message could label missing browser state as expiry; it now says the link could not be verified. The exact cause of the user's failed individual link was not established.
