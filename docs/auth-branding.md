# Authentication branding

Updated 2026-09-20.

## Google OAuth

Project: `padelboard-509210`. App name: Padelboard.
Homepage: https://padelboard.padellabs.tech/
Logo: `public/images/brand/padelboard-mark.png` (240px square).
Basic identity scopes: email, profile, openid.
The app is in Testing. Brand verification has not been submitted.
A custom Supabase auth domain has not been activated; its add-on requires billing approval. Keep the existing OAuth callback working until any replacement domain is fully configured.

## Supabase emails

Project: `vrflgmknycmlnafshimq`.
Updated the two templates used by the app's passwordless flow in Authentication → Emails:

- Confirm sign up: subject `Welcome to Padelboard — your sign-in code`; headline `Welcome to the court.`
- Magic link or OTP: subject `Your Padelboard sign-in code`; headline `Back for another match?`

Both use inline-styled presentation tables, a yellow wordmark header, cream content, a prominent `{{ .Token }}` code, and Help & guides / Padel Labs footer links. Preserve the token variable and code-based instructions when editing; the app verifies the emailed code without navigating away from the current match setup. These templates do not use confirmation links.

Templates were saved and checked in the Supabase preview. No test email was sent. The project still uses Supabase's built-in email service; Sweego DNS setup alone does not enable SMTP delivery. SMTP credentials and a sender address must be configured separately.

No OAuth or SMTP secrets belong in this repository.
