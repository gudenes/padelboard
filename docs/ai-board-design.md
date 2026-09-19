# Brand-inspired boards

Open Custom → Design with AI. Supply a public website or a PNG/JPG/WebP logo (maximum 2 MB), generate, review the suggested board, then choose Use this look. Fine-tune opens with the generated values. Those values use the existing customDesign/customColors save path and the shared overlay renderer. Uploaded logos are resized to compact rasters and stored with customDesign for the saved overlay. Website generation attempts to recover a raster logo from the public page, including CSS background logos; unavailable logos do not block design generation. Fine-tune → Logo & header can replace, resize or hide the logo and toggle the entire first row.

## Configuration

Copy the relevant values from `.env.example` into `.env.local`, set a server-only `OPENAI_API_KEY`, and restart the dev server. Never paste keys into chat or use a NEXT_PUBLIC prefix. Default model is `gpt-5.4-nano`; `OPENAI_BOARD_MODEL` can override it with a model supporting image inputs, web search and strict structured output. No SDK dependency is required; the server calls the Responses API over HTTPS.

Logo requests send a base64 raster image to OpenAI. Website requests first read public HTML and inline brand color tokens directly. HTTPS only, public IPv4 DNS validation, pinned connection addresses, redirect revalidation, an 8-second timeout and a 1 MB response limit protect the reader. Raster logo downloads use the same checks, share the 8-second read deadline and have a 250 KB limit. No scripts execute or cookies are sent. If direct reading fails, OpenAI-hosted search restricted to the supplied domain is used. Suggestions use retrieved content and available tokens, not a pixel-exact screenshot. Results need either a directly retrieved source or same-domain search evidence; source links appear with successful results. Input URLs have query strings and fragments removed.

Requests use `store: false`. This does not imply zero provider retention; OpenAI's applicable data policy still applies. Raw website content and AI inputs are not logged or saved to the database. The chosen compact logo is part of the saved overlay design. API keys and provider error payloads stay server-side.

## Bounds and deployment

The route validates raster signatures and size, limits streamed JSON bodies, validates structured outputs, repairs text contrast, separates point backgrounds from set/player cells and clamps layout values. Custom point and set numbers use an explicit score size rather than growing with preview width. It has a 65-second provider timeout (after the bounded website read) and per-process limits of 3 requests/client/minute, 20 total/minute and 3 in flight. These in-memory limits are not a distributed production quota. Before public deployment, configure a Cloudflare rate-limit rule for POST `/api/board-design` and a project spend limit in OpenAI; trusted proxy headers must be overwritten by the hosting edge. The existing legacy `/api/palette` Claude integration remains separate.

Automated route tests mock OpenAI and cover both success paths, missing credentials, rejected source evidence, invalid inputs, contrast repair and provider failure. A real website generation for maresmepadelclub.com succeeded locally on 2026-09-19 using gpt-5.4-nano and retrieved blue brand tokens. Reader tests cover non-public addresses and text/token extraction; CHECK_BRAND_SITE=1 enables the live-site regression check.

Official references:
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/tools-web-search
