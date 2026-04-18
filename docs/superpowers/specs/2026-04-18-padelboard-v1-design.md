# Padelboard v1 — Design

**Date:** 2026-04-18
**Status:** Design approved, ready for implementation plan
**Owner:** PadelLabs (padellabs.tech)
**Scope:** v1 free-forever MVP

## Summary

Padelboard is a padel-native streaming scoreboard: a browser-source overlay for OBS/Streamlabs/vMix/YoloBox plus a phone-friendly operator control UI, with real padel scoring rules built in (golden point, super-tiebreak, doubles serve indicator).

The product differentiates from OBScoreboard — the market leader — on three axes:

1. **Padel-native.** OBScoreboard tells padel users to pick the tennis scoreboard. We ship a scoring engine that knows golden point, super-tiebreak, and doubles serve rotation from day one.
2. **Free forever.** Core features never move behind a paywall. Pro tier stacks on features like sponsors, lower thirds, multi-court, and data integration — but the scoreboard for a club match is always free.
3. **Lead funnel for PadelLabs.** Every published overlay captures `email + name + role`, producing qualified leads (players, clubs, organizers, federations) for the parent platform.

v1 targets amateur/club streamers running single matches on YouTube. Phase B opens up tournament production; Phase C unlocks federation-grade broadcasts by integrating `padelapi.org` data.

## Goals

- One person creates a working scoreboard in under 60 seconds.
- Operator-to-overlay latency under 300ms p95.
- Golden point and super-tiebreak scoring logic correct in every edge case (covered by unit tests).
- Auth wall captures `email + name + role` at the publish step, not at page load.
- Same codebase ships Phase B and Phase C without a rewrite.
- Visual language is modern, warm, minimal — light theme with lime-green accent (PadelNachos palette).

## Non-goals

- Video streaming or ingest. We are an overlay, not a streaming platform.
- Mobile native apps. A responsive PWA is enough.
- Tournament brackets, progression, or bracket-generation. Phase B.
- Player photos, rankings, head-to-head, official tournament data. Phase C.
- Public API. No versioned surface worth maintaining before Phase C.
- Paid tier / Stripe integration. Not until there are Phase B features worth paywalling.
- Localization. English only for v1. Spanish/Portuguese in Phase B.
- Multi-operator editing with conflict resolution. Last-write-wins is fine for v1 (single-operator expected).

## Target users

| Phase | User | Shipping priority |
|---|---|---|
| A (v1) | **Club / amateur streamer** — one person, one camera, streaming a club match on YouTube with OBS or a phone app | v1 (this doc) |
| B (v1.x) | **Small tournament production team** — running multiple courts with sponsors, operators, CSV team lists | Post-launch |
| C (v2) | **Semi-pro / federation broadcasts** — needs real player data, rankings, tournament presets | Lead-capture payoff |

v1 is built in a way that Phases B and C extend the same foundation. Specifically: the scoring engine is framework-agnostic and config-pluggable; the data model already has `teams` / `overlay` / `config` as separate JSONB columns so new features don't reshape schemas; the overlay template gallery is built from day one with locked Pro entries visible.

## User story (v1 golden path)

As a club streamer, I open `padelboard.padellabs.tech` on my laptop, build a scoreboard for my match in under 60 seconds, and before I copy the OBS URL I hand over email, name, and role. I then control the score live from my phone while I stream. The overlay updates on OBS within 300ms of each tap.

## Scoring engine

A pure TypeScript state machine — no framework, testable in isolation. Lives in `src/lib/padel-scoring.ts`.

### State shape

```ts
type MatchConfig = {
  format: 'bo3' | 'bo5' | 'pro-set' | 'single-set'
  goldenPoint: boolean       // 40-40 → next point wins
  superTiebreak: boolean     // first-to-10 replaces final set
  setTiebreakAt: 6 | 'none'  // 7-point tiebreak at 6-6
}

type Points = 0 | 15 | 30 | 40 | 'Adv'

type MatchState = {
  config: MatchConfig
  sets: { a: number; b: number }[]        // games per set, per team
  currentGame: { a: Points; b: Points }
  servingTeam: 'a' | 'b'
  servingPlayer: 0 | 1 | 2 | 3            // rotates every game
  phase: 'playing' | 'tiebreak' | 'super-tiebreak' | 'finished'
  winner: 'a' | 'b' | null
  endReason: 'completed' | 'retired' | 'walkover' | null
}
```

### Operator actions

All reducers are pure `(state, action) => state`:

- `pointFor(team)` — award a point; cascades through game/set/match progression
- `undo()` — unbounded within a match
- `setGoldenPoint(bool)` — toggle mid-match (applies to future deuces only)
- `setFormat(fmt)` — mid-match format change (rare, but legal)
- `markRetirement(team)` — opponent wins; state transitions to `finished` with `endReason: 'retired'`
- `markWalkover(team)` — as above, `endReason: 'walkover'`
- `correctScore(patch)` — arbitrary manual fix for operator typos

### Correctness guarantees (enforced by Vitest)

- Deuce and advantage collapse correctly under both classic and golden-point rules.
- Tiebreak serve rotation is A-BB-AA-BB-AA… with side changes every 6 points.
- Super-tiebreak ends at 10+ with a 2-point lead, not before.
- Set count respects format (`bo3` = first to 2; `bo5` = first to 3; `pro-set` = first to 9 games with min-2 lead; `single-set` = first to 6 games with min-2 lead or 7-6 tiebreak).
- Doubles serve rotation handles the edge case where the serving pair side-switches on the changeover game.
- Undo restores the exact previous state, including `servingPlayer` and `phase`.

Every rule above has a named test in `src/lib/__tests__/padel-scoring.test.ts`.

## Overlay

### v1 template: Minimal Chip

Corner-anchored, compact, broadcast-modern.

```
┌────────────────────────────────┐
│ ● Galán / Lebrón     6 3   40 │   green dot = serving team
│   Coello / Tapia     4 6   30 │
└────────────────────────────────┘
```

**Always visible:** team names, per-set games, current-game points, serve dot on serving team.

**Toggles (default on, hideable per match):** match duration timer, tournament + round label, country codes, team color swatches (2-stripe), team logos.

**State-driven badges (appear automatically):**

- `BREAK POINT` — when receiving team is one point from winning the game
- `SET POINT` — when either team is one point from winning the current set
- `MATCH POINT` — when either team is one point from winning the match
- `GOLDEN POINT` — when score is 40-40 and golden-point is on
- `TIEBREAK` — while in 6-6 tiebreak
- `SUPER TIEBREAK` — while in super-tiebreak set
- `CHANGEOVER` — brief transient badge between games with odd totals
- `RET` / `W.O.` — when marked by operator

### Template browser

A modal gallery for picking the overlay style. Built into v1 even though only one template ships in the free tier, because:

1. It's the correct long-term UX pattern — scales to 10+ templates later.
2. Visible locked Pro templates plant upgrade tension from day one.
3. It sets the contract: template = display renderer, independent from scoring engine.

### Template catalog for v1

| Template | Tier | Ships in v1? |
|---|---|---|
| Minimal Chip | Free | Yes |
| Broadcast Bar | Pro | Locked (visible, not selectable) |
| Split Badge | Pro | Locked (visible, not selectable) |

Pro templates show a lime `Pro` badge on the card. Clicking them opens a "Coming soon" state (upgrade CTA will land with pricing).

### Overlay rendering constraints

OBS browser sources are Chromium. The overlay must:

- Be a single HTML page with transparent background.
- Use `requestAnimationFrame` only for the match timer; everything else re-renders on state change.
- Ship with embedded fonts (no webfont FOUT).
- Render at 1920×1080 with `overflow: hidden`; operators scale freely in OBS.
- Recover gracefully from Realtime disconnects — refetch current state on reconnect, no ghost frames.

## Architecture

### Three surfaces, one source of truth

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  /m/:id          │      │  Supabase        │      │  /overlay/:id    │
│  operator app    │ ───▶ │  matches table   │ ───▶ │  OBS browser     │
│  phone-first     │ write│  (state JSONB)   │ sub  │  source          │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        ▲                          ▲                        │
        └── Realtime ──────────────┴────────────────────────┘
             (postgres_changes on state column)
```

- **Operator URL** `/m/:shortCode` — private, phone-optimized control surface. In draft: builder. In published: control.
- **Overlay URL** `/overlay/:shortCode` — public, transparent background, 1920×1080. Pasted into OBS/vMix.
- **Supabase `matches` row** — full match state in JSONB columns. Every operator action rewrites the row; Supabase Realtime pushes changes to the overlay.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Same as padel-live-scores |
| Hosting | Vercel at `padelboard.padellabs.tech` | Independent deploys, subdomain keeps branding |
| DB + realtime | Supabase (new project) | Postgres + Realtime + Auth + Storage in one |
| Auth | Supabase Auth magic link | Email-only signup, no passwords |
| Storage | Supabase Storage (`assets` bucket) | Team/club logos, logos uploaded during builder |
| Styling | Tailwind CSS 4 | Same as padel-live-scores |
| Client state | Zustand (operator) + vanilla subscription (overlay) | Overlay stays feather-light for OBS |
| Tests | Vitest | Scoring engine unit tests are ship-blocking |

### Why JSONB column state (vs normalized tables)

- **One write per point tap**, one Realtime subscription on the overlay side.
- **No joins** on the hot path.
- Normalized (sets/games/points tables) would require stitching 3-5 Realtime channels on the overlay for no product benefit in v1.
- Analytics is not a v1 concern; when it becomes one, we write a `match_events` table (already planned) that snapshots state after each action.

### Latency budget (p95)

- Input → fetch: ~20ms
- Supabase write: ~80ms
- Realtime fanout: ~100ms
- Render: ~20ms
- **Total: ~220ms** against a 300ms target.

### What we do NOT need for v1

No Pusher relay. No Redis. No Railway service. No custom WebSocket server. No queue. Each gets added later only if something actually hurts.

## Data model

Four tables. RLS on all.

### `profiles`

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('player','club','organizer','federation')),
  created_at timestamptz default now()
);
```

One row per signed-up user. Written on first magic-link callback. This is the lead record.

### `matches`

The main table. One row per match — both anonymous drafts and published matches.

```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,          -- 6-char URL id (/m/ABC123)
  owner_id uuid references profiles(id),    -- null while anonymous draft
  draft_token text,                         -- random token to claim the draft on signup
  status text not null default 'draft'
    check (status in ('draft','published','finished','abandoned')),

  config jsonb not null default '{}'::jsonb,
    -- { format, goldenPoint, superTiebreak, setTiebreakAt }

  state jsonb not null default '{}'::jsonb,
    -- { sets, currentGame, servingTeam, servingPlayer, phase, winner, endReason }

  teams jsonb not null default '{}'::jsonb,
    -- { a: {name, players:[...], color, logoUrl, country}, b: {...} }

  overlay jsonb not null default '{}'::jsonb,
    -- { template:'minimal', showTimer, showTournament, tournamentName, round,
    --   customColors:{accent,bg,text}, scale, position }

  tournament_label text,                    -- denormalized for list views
  published_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on matches (owner_id, created_at desc);
create unique index on matches (short_code);
```

**Why 4 JSONB columns, not 1:** different concerns change at different rates. `state` rewrites on every point tap. `teams` / `overlay` / `config` change rarely. Separating them means the overlay Realtime subscription only re-renders when scoring-relevant state changes, not when a logo uploads.

### `match_events` (append-only)

Every operator action as a row. Enables perfect undo, replay, analytics later. Ships in v1 because server-authoritative event logs are ~10 LOC more and eliminate client-side undo-stack footguns on reloads/disconnects.

```sql
create table match_events (
  id bigserial primary key,
  match_id uuid not null references matches(id) on delete cascade,
  kind text not null,                       -- 'point_a', 'point_b', 'undo', 'correct', ...
  payload jsonb,
  state_after jsonb not null,               -- snapshot for replay
  created_at timestamptz default now()
);

create index on match_events (match_id, id);
```

### `assets` (Supabase Storage, not a table)

Logos uploaded to a public Supabase Storage bucket (`assets/`). Paths stored on `teams.logoUrl` as public URLs. No DB table.

### Draft → published lifecycle

```
[anonymous lands on /]
   → POST /api/matches (creates draft row, no owner_id,
                        returns {id, shortCode, draftToken} — stored in localStorage)
     ↓
[configures + designs]
   → PATCHes draft row (allowed if draftToken matches)
     ↓
[clicks "Get my OBS link"]
   → Auth wall modal (email, name, role)
   → Magic link sent
   → User clicks email → /auth/callback
   → Atomic claim:
       UPDATE matches
       SET owner_id=me, draft_token=null,
           status='published', published_at=now()
       WHERE id=? AND draft_token=?
     ↓
[operator + overlay]
   → /m/:shortCode (operator) and /overlay/:shortCode (OBS)
```

### Draft cleanup

A nightly job deletes `draft` rows older than 7 days with no `owner_id`. Keeps the table lean.

### RLS policies

- **Drafts (`owner_id IS NULL`):** read/write allowed if `draft_token` header matches the row's `draft_token`. Scoped to that row only.
- **Published (`owner_id IS NOT NULL`):** `matches` row is readable by anyone (overlay view is public). Write is owner-only. `match_events` insert is owner-only; read is owner-only.
- **Profiles:** read/write is owner-only.

## Operator flow & auth wall

### The 60-second happy path

1. **Land** on `padelboard.padellabs.tech`. One CTA: *Create a scoreboard.*
2. **Build** at `/m/ABC123` (draft, anonymous). Single scrolling form on the left, live preview on the right. Draft persisted on every edit with a `draftToken` in localStorage.
3. **Publish**: click *Get my OBS link* → auth wall modal (email + name + role) → magic-link email → click → back on the page.
4. **Overlay dialog**: modal shows `/overlay/ABC123` + `/m/ABC123`, copy buttons, and a QR code for the control URL.
5. **Control** on phone: giant `+Point A` / `+Point B` buttons, undo, settings drawer.
6. **Finish**: overlay shows winner card. Operator can reset or close.

### Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing — pitch + CTA + how-it-works | Public |
| `/m/:shortCode` | Builder (draft) or operator control (published) | Draft: `draftToken`; Published: owner session |
| `/overlay/:shortCode` | OBS browser source, read-only, transparent | Public |
| `/auth/callback` | Magic-link return; claims draft | Handled by Supabase |
| `/dashboard` | "My matches" — history, resume, archive | Signed-in only |
| `/m/:shortCode/share` | Modal within `/m` — QR + URL copy | Owner only |

Five page files. Everything else is components.

### Builder UI (draft state of `/m/:shortCode`)

Single scrolling form on the left, live preview on the right — no multi-step wizard. Matches the reference tournament-management UI shared during brainstorming but simpler (no stepper).

Sections top to bottom:

1. **Teams & players** — two cards, each with team name, two player inputs, color picker, logo upload.
2. **Match format** — pill chip picker (BO3 / BO5 / Single set / Pro set); toggles for golden point, super-tiebreak, 6-6 tiebreak.
3. **Overlay** — *Browse templates* button opening the gallery modal; accent color picker; size slider; tournament + round inputs; show-timer and show-tournament toggles.

Footer: `Get my OBS link →` CTA. Hint copy left of it.

### Operator UI (published state of `/m/:shortCode`)

Phone-first:

```
┌──────────────────────────┐
│  Galán / Lebrón    6·3·40│   ← live score bar
│  Coello / Tapia    4·6·30│
├──────────────────────────┤
│                          │
│   ┌────────┐  ┌────────┐ │
│   │  +1    │  │  +1    │ │   ← 48pt+ tap zones
│   │ Team A │  │ Team B │ │
│   └────────┘  └────────┘ │
│                          │
│   [  ↶ UNDO  ]           │
│                          │
│   [  ⚙  SETTINGS  ]       │
└──────────────────────────┘
```

Settings drawer (bottom sheet): retirement, walkover, manual score edit, reset match, change config.

### Auth wall details

- **Trigger:** only when user clicks *Get my OBS link*. No gate on page load, no gate on builder.
- **Provider:** Supabase Auth magic link, email-only.
- **Copy:** *"Sign up free to save your scoreboard and get your OBS link. Takes 10 seconds. It stays yours forever."*
- **Fields on first signup:** `email`, `name`, `role` (dropdown: Player / Club / Tournament Organizer / Federation). Stored in `profiles`.
- **Claim mechanism:** on magic-link callback we look up `draftToken` from localStorage and run the atomic `UPDATE`. Works even if the user opens the email on a different device — as long as they return to the originating browser with localStorage intact.
- **Lead flow:** a nightly cron exports new `profiles` rows to the PadelLabs CRM, segmented by role. Federation-role leads get flagged for sales review.

### Edge cases

| Case | Behavior |
|---|---|
| Operator closes phone tab mid-match | Match state is server-authoritative — reopen `/m/:code` to resume. |
| OBS machine goes offline | Overlay reconnects on Realtime resume; refetches current state. |
| Two operators at once | Last-write-wins on the `state` JSONB. v1 does not attempt conflict resolution. |
| Operator taps score while offline | **Defer to v1.1.** Amateur scenario usually has phone signal. v1 shows a reconnect banner. |
| localStorage cleared before publishing | Draft is lost. Accepted tradeoff for zero-signup-to-build. |
| User abandons magic-link signup | Draft survives 7 days in DB, still in localStorage. Retry any time. |

## Visual design

### Palette (locked)

- Background: `#f4f5f0` (warm off-white / cream)
- Surface: `#ffffff` with soft shadow, 16-24px radius
- Text: `#1a1d1a` (near-black)
- Muted: `#6b7169`
- Accent: `#c4d82e` (lime — PadelNachos family)
- Accent tint: `#f2f7d5` (for selected chip backgrounds, `Pro` badges)
- Team defaults: `#0a84ff` (A) / `#ff453a` (B) — user-replaceable

### Typography

Inter / SF Pro Display via system stack. Headings 20-28px, body 14px, labels 11-12px uppercase for section headers. Generous line height (1.45+).

### Components

- **Inputs:** 1px `#d6d9ce` border, 10px radius, 11px vertical padding, lime focus ring at 3px.
- **Buttons (primary):** full-rounded pill, lime fill, dark text, subtle lime shadow on hover.
- **Buttons (icon):** 30×30 square, 8px radius, bordered, lime-tint hover.
- **Chips (pill):** 999px radius, 8×14 padding. Active: lime-tint bg + lime border + dark text + 600 weight.
- **Toggle switches:** 34×20 pill, lime when on, grey when off.
- **Badges (overlay state):** lime-tint background, uppercase 11px, letter-spacing 0.1em — for `GOLDEN POINT`, `SET POINT`, `PRO`, `Draft · autosaved`.
- **Cards:** white on cream, 1px border `#e5e7df`, 16-24px radius, soft shadow.

### Feel

Airy, warm, Notion/Linear-ish but friendlier. Generous whitespace. No skeuomorphism.

### Applies identically to Phase B

The tournament-management UI (multi-step wizard, categories, draws) uses the same tokens, same components, same chip/pill/badge vocabulary. v1's UI is a trimmed subset of the same system — nothing gets thrown away.

## Phase plan

### Phase A — v1 free-forever MVP (this doc)

All scope defined above. Build sequence:

1. Scoring engine (pure TS, Vitest-tested)
2. Supabase project + schema + RLS
3. Overlay renderer (`/overlay/:code`)
4. Operator control UI (`/m/:code` published state)
5. Builder UI (`/m/:code` draft state) + live preview
6. Auth wall + draft-claim flow
7. Landing + dashboard + polish
8. Deploy to `padelboard.padellabs.tech`

**Timeline estimate:** ~2-3 focused weeks.

**Ship gate:** golden path survives one real club match streamed to YouTube with OBS.

### Phase B — tournament production (v1.1 – v1.3)

Unlocked by organic traffic. Adds:

- Multi-court dashboard (3-5 matches simultaneously from one account)
- CSV match-list import
- Shared tournament branding across courts
- Sponsor rotation slots
- Lower thirds for announcements
- 2 additional overlay templates (Broadcast Bar, Split Badge)
- Pre-match countdown / warmup timer
- Americano & Mexicano format variants

Note: **Americano & Mexicano change the scoring engine.** The engine must be config-pluggable from day 1 so these drop in cheaply — formally, `MatchConfig.format` is already an open string tagged union.

### Phase C — federation-grade (v2)

The lead-capture payoff. Turns freemium users into federation sales conversations:

- Pull player names / photos / rankings from `padelapi.org` (the PadelLabs data moat)
- Live FIP / Premier Padel rankings on overlay
- Head-to-head stats, career records
- Tournament logos + official presets
- Pro scoring formats and official rule sets

Built when at least one federation is actively negotiating.

## Open questions

None at this time. Spec is complete; ready for implementation plan.

## Appendix A — Free tier guarantee

The following features are guaranteed free forever:

- Scoring engine (golden point, super-tiebreak, 6-6 tiebreak, BO3/BO5/single-set/pro-set)
- Retirement / walkover marking
- Unbounded undo and manual score correction
- Minimal Chip overlay template
- Full team/overlay color customization
- Logo upload
- Match duration timer
- Overlay size / position controls
- Tournament + round label
- OBS browser-source URL + phone operator URL + QR share
- Match history / dashboard

Anything beyond this — new templates, sponsors, lower thirds, multi-court, data integration — may move behind a paid tier in the future. The free core does not.

## Appendix B — Reference material

- OBScoreboard — [obscoreboard.com](https://obscoreboard.com/) — market leader; generic tennis scoreboard reused for padel.
- PadelLabs sibling project: `padel-live-scores` (Next.js 16 + Supabase + Pusher). Shared tech and team.
- PadelNachos visual family: cream + lime + black — establishes the palette for Padelboard.
