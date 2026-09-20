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

- Confirm sign up: subject `Welcome to Padelboard — your sign-in code`; headline `Your court. Your colors. Your first match.`
- Magic link or OTP: subject `Your Padelboard sign-in code`; headline `More padel. Less fuss.`

Both use inline-styled presentation tables, a full #f9ff43 yellow background, #10110c heavy text, pink #ffb8d5 badges, a black scoreboard-style panel with a prominent yellow `{{ .Token }}` code, and Help & guides / Padel Labs footer links. Preserve the token variable and code-based instructions when editing; the app verifies the emailed code without navigating away from the current match setup. These templates do not use confirmation links.

Templates were saved and checked in the Supabase preview. No test email was sent. The project still uses Supabase's built-in email service; Sweego DNS setup alone does not enable SMTP delivery. SMTP credentials and a sender address must be configured separately.

No OAuth or SMTP secrets belong in this repository.

Editor note: replace the entire Monaco document using Select All + paste. Do not set only the editor textarea value; that can retain parts of the previous template. Full copied source was checked against the intended HTML for both templates.
