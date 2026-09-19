# Enable Google sign-in for Padelboard

The app already supports Google OAuth through Supabase with PKCE. Email OTP remains available. The Google button becomes enabled automatically when Supabase reports the provider enabled.

1. In https://console.cloud.google.com/ create or select your Padelboard project.
2. Open **Google Auth Platform → Branding**. Set the app name, support email and developer contact. Configure **Audience** as External (unless this is restricted to your Workspace organization). While testing, add your own Google account as a test user. Request only the basic OpenID/email/profile scopes.
3. Under **Clients**, create an OAuth client of type **Web application**. Add `http://localhost:3003` as an authorized JavaScript origin.
4. Set the authorized redirect URI to exactly:
   `https://vrflgmknycmlnafshimq.supabase.co/auth/v1/callback`
5. Copy the client ID and client secret into **Supabase → Authentication → Sign In / Providers → Google**, enable Google and save. Do not put the secret in browser code, Git, or chat.
6. In **Supabase → Authentication → URL Configuration**, keep the local redirect allowlist entries:
   - `http://localhost:3003/auth/callback`
   - `http://localhost:3003/auth/callback?match=*`
7. Refresh Padelboard, create a board, and choose Continue with Google. New users should see the short profile/avatar step; existing users can open controls. The saved draft token remains in the same browser while Google redirects.

For production, add the actual Padelboard origin and its /auth/callback URLs to Google/Supabase and complete Google's production branding requirements. Do not use a guessed production domain.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-google
