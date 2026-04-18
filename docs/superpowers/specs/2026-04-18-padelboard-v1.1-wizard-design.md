# Padelboard v1.1 — Onboarding Wizard Design

**Date:** 2026-04-18
**Status:** Design approved, ready for implementation plan
**Depends on:** [v1 design](./2026-04-18-padelboard-v1-design.md)
**Scope:** Replace the single-screen match builder with a 3-step onboarding wizard. Add 3 broadcast-quality templates. Add AI-powered palette customization from tournament logos.

## Summary

v1's single-screen builder works but doesn't sell the product. First-time users need to understand what they're making, not just fill out a form. v1.1 replaces the builder with a 3-step wizard — **Template → Players → Format** — with a persistent live preview that gives users broadcast-quality feedback at every step.

Three template families ship (Broadcast / Classic / Premier), all free. The old Minimal Chip template is deprecated. Users can upload a tournament logo to drive AI palette recommendations (Claude Vision), then fine-tune per-slot colors if needed. The logo also displays on the overlay itself, giving tournaments instant branding without design work.

The wizard replaces v1's `/m/:code` builder view. Same URL, same draft-token auth, same publish flow, same auth wall. Only the UI changes.

## Goals

- First-time user reaches "Get my OBS link" in under 90 seconds with a scoreboard they'd feel proud to stream.
- Preview is always visible — the user sees exactly what the stream viewer will see, live-updating with every input.
- Three new templates look like real broadcasts (WPT / FIP / Premier-tier visual quality).
- Tournament organizers can brand the board to their event with one logo upload, no design skill required.
- Power users keep every v1 capability — scoring engine, rules toggles, retirement/walkover, phone-operator UI — nothing is regressed.
- The wizard is state-preserving: close the tab, come back, resume exactly where you left off.

## Non-goals

- Video background behind the preview (CSS stadium court for v1.1; real video is v1.2+).
- Multi-operator editing during setup (still single-operator, last-write-wins).
- Real player / team autocomplete from padelapi.org (Phase C feature, deferred).
- Advanced OAuth sign-in (Google / Apple) (Phase B).
- Per-step progress persistence across devices — v1.1 is localStorage-only (same as v1).
- Animation customization (users pick a template, not individual animations).
- Video preview of the running match — still a static mock until publish.

## Target user

Same as v1 — the amateur / club streamer running an OBS stream for a single padel match. v1.1 adds better support for the "organizer streaming a tournament" persona by making branding fast and visible.

## Architecture overview

### Wizard shell

Three-column layout at the `/m/:code` draft route:

```
┌──────────┬───────────────────────────┬──────────────────┐
│  RAIL    │     MAIN (active step)    │   LIVE PREVIEW   │
│  240px   │     flex 1                │   420px          │
│          │                           │                  │
│  Steps   │  One concept per screen:  │  Stadium court   │
│   1 ✓    │   - Template              │  background      │
│   2 ●    │   - Players               │  + overlay       │
│   3      │   - Match format          │  rendering       │
│          │                           │                  │
│  Draft · │                           │  Overlay URL     │
│  autosaved                           │  Badge(s)        │
└──────────┴───────────────────────────┴──────────────────┘
            ┌─────────────────────────────────────────────┐
            │  Back ←          autosaves       → Continue │
            └─────────────────────────────────────────────┘
```

- **Rail**: Stripe-style task list, 3 items with numbered/check icons. Clicking a completed step jumps back to it. Cannot skip ahead to an uncompleted step.
- **Main**: Only the active step's content. Changes on navigation via Framer Motion slide transition.
- **Preview**: Persistent. Content inside updates as user interacts.
- **Footer**: Spans main + preview. Back / Continue buttons anchored.

### Step transitions

**Framer Motion `AnimatePresence` with directional slide.** Store direction in state (`1` for forward, `-1` for back) so the exit animation mirrors the enter:

```ts
const [[step, direction], setStep] = useState<[number, number]>([1, 1])

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={step}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ ease: 'anticipate', duration: 0.35 }}
  >
    {renderStep(step)}
  </motion.div>
</AnimatePresence>
```

Duration is 350ms — fast enough to feel responsive, slow enough to signal progress.

### State management

- **Source of truth**: existing `matches` row in Supabase (unchanged — we reuse the v1 model).
- **Client state**: `useDraftMatch` hook (already exists). Add `currentStep` state local to the wizard.
- **Persistence**:
  - Draft content (teams, config, overlay) — debounced PATCH to `/api/matches/[id]` (v1 behavior, unchanged).
  - Current step — URL query param `?step=1|2|3`. Reading `?step` on mount restores the user's position.
  - Fallback — `localStorage[padelboard:lastStep:{matchId}] = step` as a safety net if URL param is stripped (e.g. magic-link redirect strips query).

### Navigation model

- **Forward**: blocked until current step is valid. Validity per step:
  - Step 1: a template is selected (defaults to `broadcast`, so always valid)
  - Step 2: at minimum Team A name is filled (prepopulated, always valid)
  - Step 3: a format is selected (defaulted to `bo3`, always valid)
  - So: **forward is never blocked in practice** — defaults make every step valid on entry.
- **Back**: always available (except step 1).
- **Jump**: click any completed step in the rail → jumps back to it with back-slide animation. Cannot jump forward to uncompleted steps.
- **Exit**: user can close the tab at any time. Returning to the same URL restores state via URL + Supabase draft row.

## Step 1 — Pick a template

### Template catalog (v1.1 ships 3 templates, all free)

| Template | Inspiration | Description |
|---|---|---|
| **Broadcast** | WPT (World Padel Tour) | Bold 3-column layout: team rows \| games column \| points accent. Most visible on stream. |
| **Classic** | FIP (International Padel Federation) | Denser: adds match timer and tournament label strip. Best for tournament broadcasts. |
| **Premier** | Premier Padel | Dark background + gold accents. Minimal, premium feel. |

**Minimal Chip** (v1's only template) is deprecated. Existing matches keep rendering with Minimal Chip; new matches cannot select it. Removed from the template browser gallery entirely. The renderer is kept in the codebase for backwards compatibility.

### Template data model

Each template is a TypeScript module exporting:

```ts
// src/lib/templates/broadcast.ts
export const broadcastTemplate: Template = {
  id: 'broadcast',
  name: 'Broadcast',
  description: 'Bold 3-column layout. Highest visibility.',
  defaults: {
    colors: {
      playerRow: { bg: '#0a3d91', text: '#ffffff' },
      gamesCol: { bg: '#ffffff', text: '#0a3d91' },
      scoreAccent: { bg: '#ffcf2e', text: '#0a3d91' },
      serverDot: { color: '#ffcf2e' },
      statusBadge: { bg: '#c4d82e', text: '#1a1d1a' },
      divider: { color: 'rgba(255,255,255,0.15)' },
    },
  },
  slots: [
    { key: 'playerRow', label: 'Player rows', fields: ['bg', 'text'] },
    { key: 'gamesCol',  label: 'Games column', fields: ['bg', 'text'] },
    { key: 'scoreAccent', label: 'Score accent', fields: ['bg', 'text'] },
    { key: 'serverDot', label: 'Server dot', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
    { key: 'divider', label: 'Dividers', fields: ['color'] },
  ],
  Renderer: BroadcastRenderer, // React component
}
```

All 3 templates follow this shape. A template registry (`src/lib/templates/index.ts`) exports `getTemplate(id)` for lookup.

### Step 1 UI

Main area:
- Step label ("Step 1 of 3"), heading "Pick a template", short lede
- Vertical list of 3 template cards (90px preview thumbnail + name + description)
- Selected card: lime border + 3px lime ring + subtle tint
- Clicking a card updates the preview panel to render that template
- Below the grid: **"Customize colors"** row → opens the Color Customizer modal

### Color Customizer Modal

Opens from "Customize colors" button. Shown over the wizard with a backlit overlay.

#### Layout (top to bottom)
1. **Header** — title "Customize colors", subtitle with active template name, close button (×)
2. **Mini preview** — a wide aspect-ratio preview showing the scoreboard with current colors applied
3. **AI palette section** — logo upload area + generated palette + one-click apply
4. **Per-slot fine-tune section** — grid of slot cards, each exposing the colors that slot allows
5. **Footer** — "Replay animation" link, Cancel / Save changes buttons

#### Logo upload + AI palette

**Upload:**
- Drag-and-drop zone OR file picker
- Accepts PNG / JPG / WebP / SVG, max 2MB
- Uploads via POST `/api/logo` → stores to Supabase Storage `assets/` bucket → returns public URL
- The URL is saved to `matches.overlay.tournamentLogoUrl`

**AI palette call:**
- POST `/api/palette` with `{ logoUrl, templateId }`
- Server calls Claude API (vision) with prompt:
  ```
  You are a brand design assistant. Analyze the attached tournament logo
  and recommend a color palette for a padel scoreboard overlay using the
  {templateId} template. The template exposes these slots: {slot list}.
  Return JSON: { palette: { primary, accent, textOnPrimary, textOnAccent },
  slotAssignments: { playerRow: { bg: ..., text: ... }, ... },
  reasoning: "..." }.
  ```
- Response time: target <3 seconds
- Server validates JSON shape, returns to client
- Client previews the palette (swatches + reasoning line), user clicks **Apply palette** to commit

**Fallback:** if Claude API errors (network / rate limit), fall back to client-side `colorthief` extraction — return the top 4 dominant colors with a note "Auto-extracted — AI unavailable right now."

#### Per-slot controls

Grid of slot cards (6 cards for Broadcast template's slot count). Each card:
- Slot label (e.g. "Player rows")
- One or two color swatches (Bg / Text) depending on `fields`
- Click a swatch → opens a native `<input type="color">` picker
- Preview updates immediately on color change

**Reset to template defaults** — at the top-right of the section. Clears all overrides back to the template's `defaults.colors`.

**Replay animation** — re-renders the mini preview's entry animation. Lets user see how colors animate in.

#### Data persistence
- `matches.overlay.customColors` becomes a structured map keyed by slot (not a single `accent` value as in v1):
  ```json
  {
    "playerRow": { "bg": "#0a3d91", "text": "#ffffff" },
    "gamesCol":  { "bg": "#ffffff", "text": "#0a3d91" },
    "scoreAccent": { "bg": "#ffcf2e", "text": "#0a3d91" },
    ...
  }
  ```
- `matches.overlay.tournamentLogoUrl` — the uploaded logo URL
- Unset slots fall back to template defaults at render time

## Step 2 — Players

Same form structure as v1's TeamCard, but:

- **Two team cards** (A and B) stacked
- **Placeholders**, not pre-filled values:
  - Team name placeholder: "Team A" / "Team B"
  - Player 1/2 placeholder: "Player 1" / "Player 2"
- **No color picker** per team — template handles all colors, v1's per-team color field is removed from `teams.a.color`
- **No logo upload** per team — team logos are a v1.2 feature
- Preview updates live: the team row in the preview re-renders on each input change

### Removed from v1
- `teams.a.color` / `teams.b.color` — removed from the type. Rendering falls back to template's per-team default colors (Broadcast: blue for A, red for B; Classic: both navy blue but with an accent stripe distinguishing; Premier: both dark with gold differentiation).

### Kept from v1
- Team name, 2 player name fields per team
- Optional country code (deprioritized — not in the v1.1 UI, but the field stays in the data model for Phase C)

## Step 3 — Match format

Main area:
- Format chip picker (horizontal row)
- Rules toggle list below

### Format options (v1.1)

| Chip | Behavior | Tooltip copy |
|---|---|---|
| **Best of 3** (default) | `format: 'bo3'` | "First team to win 2 sets wins the match. Standard for most club and tournament matches." |
| **Single set** | `format: 'single-set'` | "First team to 6 games (with 2-game lead) wins. Fast format — great for short streams." |
| **Pro set** | `format: 'pro-set'` | "First team to 9 games (with 2-game lead) wins. One long set, no best-of structure." |

**Removed:** `Best of 5` — still supported by the scoring engine but hidden from the UI. Hardcoded defaults + tournaments where BO5 is needed will re-add it in Phase B.

### Rules (toggles)

| Toggle | Default | Tooltip copy |
|---|---|---|
| **Golden point** | ON | "At 40-40 the receiving team chooses which side to receive from. The next point wins the game — no advantage." |
| **Super-tiebreak in final set** | ON | "Replaces the final set with a first-to-10 tiebreak (win by 2). Common on amateur tours and some pro events." |
| **Tiebreak at 6-6** | ON | "When a set reaches 6-6, play a standard 7-point tiebreak (win by 2) to close it." |

All three tooltips use a hover-triggered `(i)` icon that expands into a 220-240px wide dark tooltip with a downward caret.

### Live preview

In addition to the existing scoreboard render, the preview stage shows **format badges** in its top-right when the corresponding toggles are on:
- `Best of 3` / `Single set` / `Pro set`
- `Golden point`
- `Super TB`

Each badge uses the template's `statusBadge` slot colors. Badges animate in with a short scale-up (150ms).

### CTA

Step 3 changes the footer Continue button to **"Get my OBS link →"**. Clicking triggers the existing v1 publish flow (AuthWallModal if not signed in; direct publish if signed in — a patch we'll add).

## Data model changes

Extending `matches.overlay` JSONB:

```ts
export interface OverlayJson {
  template: 'broadcast' | 'classic' | 'premier'   // new templates; 'minimal' deprecated
  showTimer: boolean
  showTournament: boolean
  tournamentName?: string
  round?: string
  tournamentLogoUrl?: string                       // NEW — uploaded logo, also drives AI palette

  // BREAKING: was { accent: string }. Now a per-slot map. Migration plan below.
  customColors: {
    [slotKey: string]: { [field: string]: string }
  }

  scale: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
```

### Migration from v1's overlay JSON

**Existing matches:**
- `customColors.accent` (string) → renderer reads this and applies as an accent override if present.
- `template: 'minimal'` → keep rendering with MinimalChip component.
- A one-time migration script is NOT needed. Data stays as-is; renderers handle both shapes.

**New matches created in v1.1:**
- `template` defaults to `'broadcast'`
- `customColors` is `{}` by default (template defaults used)
- `tournamentLogoUrl` is optional

## Template + overlay rendering

One `OverlayRenderer` entry point:

```tsx
// src/components/overlay/OverlayRenderer.tsx
export function OverlayRenderer({ row }: { row: MatchRow }) {
  const template = getTemplate(row.overlay.template)
  if (!template) return <MinimalChip row={row} /> // backwards-compat for legacy 'minimal'
  const colors = mergeColors(template.defaults.colors, row.overlay.customColors)
  return <template.Renderer row={row} colors={colors} />
}
```

Each template's renderer is a regular React component that takes the merged colors and returns JSX. No runtime compilation. Each template is ~80-150 lines of React.

## Visual design

### Layout tokens (reuse v1 palette, no changes)
Cream background `#f4f5f0`, white surface, lime accent `#c4d82e`, dark text `#1a1d1a`, muted `#6b7169`. 18/24px radii. System sans.

### New wizard-specific components
- `Wizard` (shell)
- `WizardRail` (left rail)
- `WizardPreview` (right panel)
- `WizardFooter` (shared back/continue)
- `TemplateCard`
- `ColorCustomizerModal`
- `SlotCard`
- `LogoUploadZone`
- `FormatChip` (chip + tooltip)
- `RuleToggle` (toggle + tooltip)
- `StageCourt` (stylized stadium background)

### Court stage (preview background)

Pure CSS stadium court for v1.1:
- Vertical gradient: dark (crowd) top → blue (court) middle → deep blue bottom
- Speckled texture at top suggesting crowd
- Perspective white lines below suggesting court
- Sponsor strip mid-height
- Glass wall glows at left/right

Swappable: the component is `<StageCourt>`, accepts `background` prop. In a v1.2 polish pass we can swap for a hosted image or short video without touching the wizard.

## Dependencies added

| Package | Purpose | Approx size |
|---|---|---|
| `motion` (or `framer-motion`) | Step transitions | 60kb gzipped |
| `colorthief` | Client-side palette fallback | 7kb |
| `@anthropic-ai/sdk` (server-only) | Claude API for logo palette | 25kb (server bundle) |

No other new deps.

## New server routes

- `POST /api/logo` — upload logo to Supabase Storage, return `{ url }`. Body: multipart form data or base64. Auth: draft-token or session.
- `POST /api/palette` — request AI palette from logo URL. Body: `{ logoUrl, templateId }`. Returns `{ palette, slotAssignments, reasoning }`. Auth: draft-token or session. Rate-limited: 10/minute per client IP.

## Phase plan

This doc is **Phase A of v1.1**. Scope bucketing:

### v1.1 (this spec)
- Wizard shell + 3-step navigation
- 3 new templates (Broadcast / Classic / Premier)
- Color customizer modal with AI palette
- Tournament logo upload + display on overlay
- Remove BO5 from UI
- Tooltips on format + rules
- Data model migration (per-slot colors + logoUrl)

### v1.2 (later, not in scope)
- Real video / image background for preview stage
- More templates (user feedback driven)
- Sponsor rotation slots
- Lower thirds for announcements
- Multi-court dashboard (Phase B territory)

### v1.3+ (Phase C territory)
- Pull player data from padelapi.org
- Tournament presets (pre-filled Premier/FIP color palettes)
- Head-to-head stats
- Official scoring rule sets

## Open questions

None. Spec is complete; ready for implementation plan.

## Appendix A — What the wizard does NOT change

To reduce risk, v1.1 leaves these v1 systems untouched:

- Scoring engine (`src/lib/padel-scoring.ts`) — unchanged
- `match-log.ts` / `match-flags.ts` — unchanged
- Supabase schema — same tables (`profiles`, `matches`, `match_events`), same RLS
- Supabase Auth / magic link flow — unchanged
- Operator UI (`/m/:code` published state) — unchanged
- Overlay renderer dispatcher — unchanged interface (still takes `MatchRow`, returns JSX)
- API routes for create / patch / action — unchanged
- Dashboard — unchanged (rows show the new templates just like old ones)

The wizard is a UI replacement, not a rewrite.

## Appendix B — Reference designs

The three template visual directions are inspired by these real broadcasts (shared by user during design):
- **Broadcast** → World Padel Tour Málaga Open scoreboard
- **Classic** → FIP Bronze Ijuí scoreboard (with match timer + tournament strip)
- **Premier** → Premier Padel (dark + gold accent)

Trademark note: visual inspiration only. Our templates use original colors, original typography, and neutral names.
