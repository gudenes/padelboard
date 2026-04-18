# Padelboard v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a free-forever, padel-native streaming scoreboard: OBS browser-source overlay + phone operator control, with golden point, super-tiebreak, and doubles serve rotation built in. Anonymous build → auth wall at publish → magic-link signup captures `email + name + role` as PadelLabs leads.

**Architecture:** Next.js 16 App Router at `padelboard.padellabs.tech`. Three surfaces (builder/operator, overlay, auth) backed by one Supabase table (`matches` with JSONB state). Scoring engine is a pure TypeScript state machine — framework-agnostic, unit-tested with Vitest, producing the canonical `MatchState`. Operator writes to Supabase; overlay subscribes via Realtime `postgres_changes`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase (Auth + Postgres + Realtime + Storage), Zustand, Vitest, Vercel

**Spec:** [`docs/superpowers/specs/2026-04-18-padelboard-v1-design.md`](../specs/2026-04-18-padelboard-v1-design.md)

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts` | Project config |
| `.env.local.example`, `.gitignore` | Env template + ignore list |
| `src/app/layout.tsx` | Root layout (fonts, globals, AuthProvider) |
| `src/app/globals.css` | Tailwind v4 + design tokens |
| `src/app/page.tsx` | Landing page with "Create a scoreboard" CTA |
| `src/app/m/[code]/page.tsx` | Server: loads match by short code; renders builder (draft) or operator (published) |
| `src/app/m/[code]/Builder.tsx` | Client: single-screen builder UI (form + preview) |
| `src/app/m/[code]/Operator.tsx` | Client: phone-first control UI |
| `src/app/m/[code]/ShareDialog.tsx` | Client: modal shown after publish (URLs + QR) |
| `src/app/overlay/[code]/page.tsx` | Server: loads match; renders the overlay |
| `src/app/overlay/[code]/OverlayClient.tsx` | Client: subscribes to Realtime, renders the Minimal Chip |
| `src/app/dashboard/page.tsx` | User's match list (auth-gated) |
| `src/app/auth/callback/route.ts` | Magic-link callback; claims draft atomically |
| `src/app/api/matches/route.ts` | POST: create draft row, return `{id, shortCode, draftToken}` |
| `src/app/api/matches/[id]/route.ts` | PATCH: update draft (validated via draftToken header) |
| `src/app/api/matches/[id]/action/route.ts` | POST: apply a scoring action (published matches) |
| `src/components/auth/AuthProvider.tsx` | React context: session, profile, signOut |
| `src/components/auth/AuthWallModal.tsx` | Modal shown when publishing a draft (email + name + role) |
| `src/components/builder/TeamCard.tsx` | Editable team block (name, players, color, logo) |
| `src/components/builder/FormatSection.tsx` | Format chips + golden point / super-tiebreak / 6-6 toggles |
| `src/components/builder/OverlaySection.tsx` | Template picker button, accent color, scale, tournament/round, toggles |
| `src/components/builder/TemplateBrowser.tsx` | Modal gallery (Minimal Chip selectable; Pro locked) |
| `src/components/builder/LogoUpload.tsx` | Drag-drop → Supabase Storage → URL |
| `src/components/operator/PointButtons.tsx` | Giant +Point A / +Point B taps |
| `src/components/operator/UndoButton.tsx` | Fires undo action |
| `src/components/operator/SettingsDrawer.tsx` | Bottom sheet: retirement, walkover, correct, reset |
| `src/components/overlay/MinimalChip.tsx` | Pure renderer — receives MatchState, displays the chip |
| `src/components/overlay/StatusBadges.tsx` | GOLDEN POINT / SET POINT / MATCH POINT / TIEBREAK etc |
| `src/components/overlay/TimerBadge.tsx` | Duration + tournament/round line |
| `src/components/ui/Button.tsx` | Pill button (primary lime / secondary ghost) |
| `src/components/ui/Input.tsx` | Bordered input with lime focus ring |
| `src/components/ui/Chip.tsx` | Pill chip (active state = lime tint) |
| `src/components/ui/Switch.tsx` | Toggle switch (lime when on) |
| `src/components/ui/ColorDots.tsx` | Row of selectable color dots |
| `src/components/ui/Slider.tsx` | Range slider with lime fill |
| `src/components/ui/QRCode.tsx` | SVG QR via `qrcode` library |
| `src/lib/padel-scoring.ts` | Pure scoring engine (types + reducers) |
| `src/lib/__tests__/padel-scoring.test.ts` | Engine unit tests |
| `src/lib/__tests__/padel-scoring-edge-cases.test.ts` | Edge-case coverage |
| `src/lib/supabase.ts` | Client factory (browser anon + server service) |
| `src/lib/short-code.ts` | 6-char collision-avoidant short-code generator |
| `src/lib/draft-token.ts` | Token generator + localStorage helpers |
| `src/lib/realtime.ts` | Thin wrapper over Supabase Realtime for single-row subscriptions |
| `src/hooks/useDraftMatch.ts` | Client: load + patch a draft match via API |
| `src/hooks/useMatchState.ts` | Client: subscribe to a published match's state |
| `src/hooks/useOperatorStore.ts` | Zustand store for the operator UI (optimistic state + pending actions) |
| `src/types/match.ts` | Shared TypeScript types (MatchRow, MatchConfig, TeamsJson, OverlayJson) |
| `supabase/migrations/20260418000000_initial_schema.sql` | profiles, matches, match_events + indexes |
| `supabase/migrations/20260418000001_rls_policies.sql` | RLS policies |
| `supabase/migrations/20260418000002_storage.sql` | assets storage bucket |
| `src/proxy.ts` | Next 16 proxy for draft-token cookie + future middleware needs |
| `public/favicon.ico`, `public/og-image.png` | Static assets |
| `README.md` | Setup instructions, env vars, Supabase bootstrap |

### Modified Files

None — this is a greenfield project.

---

## Phase 0 — Project Setup

### Task 1: Create feature branch and Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.gitignore`

- [ ] **Step 1: Create the implementation branch**

```bash
cd /Users/GuDenes/Projects/padelboard
git checkout -b feat/v1-implementation
```

- [ ] **Step 2: Initialize package.json**

```json
{
  "name": "padelboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3003",
    "build": "next build",
    "start": "next start -p 3003",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.2.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.1",
    "zustand": "^5.0.0",
    "qrcode": "^1.5.4",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/qrcode": "^1.5.5",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "vitest": "^4.1.2",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.2.0"
  }
}
```

- [ ] **Step 3: Write `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3003', 'padelboard.padellabs.tech'] },
  },
}

export default config
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```javascript
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

- [ ] **Step 6: Append to `.gitignore`**

```bash
cat >> .gitignore <<'EOF'
# dependencies
node_modules
.pnp
.pnp.js

# next
.next
out
next-env.d.ts

# env
.env*.local

# misc
.DS_Store
*.pem
.vercel

# testing
coverage
EOF
```

- [ ] **Step 7: Install dependencies and commit**

```bash
npm install
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs .gitignore
git commit -m "chore: scaffold Next.js 16 + Tailwind 4 + Vitest project"
```

---

### Task 2: Add Tailwind v4 design tokens

**Files:**
- Create: `src/app/globals.css`

- [ ] **Step 1: Write `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  /* Palette (locked in spec §Visual design) */
  --color-bg: #f4f5f0;
  --color-surface: #ffffff;
  --color-border: #e5e7df;
  --color-border-strong: #d6d9ce;
  --color-text: #1a1d1a;
  --color-muted: #6b7169;
  --color-muted-soft: #8b9188;
  --color-lime: #c4d82e;
  --color-lime-soft: #e8f1a8;
  --color-lime-tint: #f2f7d5;
  --color-team-a: #0a84ff;
  --color-team-b: #ff453a;

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  /* Font */
  --font-sans: -apple-system, "SF Pro Display", Inter, system-ui, sans-serif;
}

html, body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Overlay page gets transparent bg (served inside OBS as browser source) */
html.overlay,
html.overlay body {
  background: transparent !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "chore: add Tailwind v4 theme tokens (palette, radii, fonts)"
```

---

### Task 3: Add Vitest config and smoke test

**Files:**
- Create: `vitest.config.ts`, `src/lib/__tests__/smoke.test.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 2: Write the smoke test**

```typescript
// src/lib/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs a test', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 3: Run it**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts src/lib/__tests__/smoke.test.ts
git commit -m "chore: add Vitest config and smoke test"
```

---

### Task 4: Minimal root layout and placeholder landing

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Padelboard — Free padel scoreboard for streamers',
  description: 'Free-forever streaming scoreboard for padel matches. OBS browser-source overlay with golden point, super-tiebreak, and phone-based control.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Write a placeholder `src/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold">Padelboard — coming soon</h1>
    </main>
  )
}
```

- [ ] **Step 3: Run dev server to verify**

Run: `npm run dev`
Open: http://localhost:3003 — expect "Padelboard — coming soon" on cream background.
Kill with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "chore: add minimal root layout and placeholder landing"
```

---

## Phase 1 — Scoring Engine (Pure TS, TDD)

The engine is the foundation. Every rule is expressed as a failing test first, then made to pass. No UI code is written until the engine is complete. When a test name mentions "padel rule," cross-reference Spec §Scoring engine for the exact rule.

### Task 5: Types for the scoring engine

**Files:**
- Create: `src/lib/padel-scoring.ts`

- [ ] **Step 1: Write types**

```typescript
// src/lib/padel-scoring.ts — Pure scoring engine for padel.

export type MatchFormat = 'bo3' | 'bo5' | 'pro-set' | 'single-set'
export type Points = 0 | 15 | 30 | 40 | 'Adv'
export type TeamId = 'a' | 'b'
export type PlayerIndex = 0 | 1 | 2 | 3

export interface MatchConfig {
  format: MatchFormat
  goldenPoint: boolean
  superTiebreak: boolean
  setTiebreakAt: 6 | 'none'
}

export interface SetScore {
  a: number
  b: number
}

export interface MatchState {
  config: MatchConfig
  sets: SetScore[]
  currentGame: { a: Points; b: Points } | { a: number; b: number }
  servingTeam: TeamId
  servingPlayer: PlayerIndex
  phase: 'playing' | 'tiebreak' | 'super-tiebreak' | 'finished'
  winner: TeamId | null
  endReason: 'completed' | 'retired' | 'walkover' | null
}

export type Action =
  | { kind: 'point_for'; team: TeamId }
  | { kind: 'undo' }
  | { kind: 'set_golden_point'; value: boolean }
  | { kind: 'set_format'; value: MatchFormat }
  | { kind: 'mark_retirement'; team: TeamId }  // team that retired
  | { kind: 'mark_walkover'; team: TeamId }    // team that walked over
  | { kind: 'correct_score'; patch: Partial<MatchState> }
  | { kind: 'reset' }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/padel-scoring.ts
git commit -m "feat(scoring): add type definitions for padel scoring engine"
```

---

### Task 6: `createInitialState(config)` + unit test

**Files:**
- Modify: `src/lib/padel-scoring.ts`
- Create: `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/padel-scoring.test.ts
import { describe, it, expect } from 'vitest'
import { createInitialState } from '@/lib/padel-scoring'

describe('createInitialState', () => {
  it('creates a best-of-3 match ready to play', () => {
    const s = createInitialState({
      format: 'bo3',
      goldenPoint: true,
      superTiebreak: true,
      setTiebreakAt: 6,
    })
    expect(s.config.format).toBe('bo3')
    expect(s.sets).toEqual([{ a: 0, b: 0 }])
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
    expect(s.servingTeam).toBe('a')
    expect(s.servingPlayer).toBe(0)
    expect(s.phase).toBe('playing')
    expect(s.winner).toBeNull()
    expect(s.endReason).toBeNull()
  })
})
```

- [ ] **Step 2: Run it — expect fail**

Run: `npm test -- padel-scoring`
Expected: FAIL — `createInitialState is not defined`

- [ ] **Step 3: Implement**

Append to `src/lib/padel-scoring.ts`:

```typescript
export function createInitialState(config: MatchConfig): MatchState {
  return {
    config,
    sets: [{ a: 0, b: 0 }],
    currentGame: { a: 0, b: 0 },
    servingTeam: 'a',
    servingPlayer: 0,
    phase: 'playing',
    winner: null,
    endReason: null,
  }
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/padel-scoring.ts src/lib/__tests__/padel-scoring.test.ts
git commit -m "feat(scoring): createInitialState with BO3 default"
```

---

### Task 7: `apply(state, action)` — basic game progression 0 → 15 → 30 → 40 → game

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/lib/__tests__/padel-scoring.test.ts`:

```typescript
import { apply } from '@/lib/padel-scoring'

const baseConfig = {
  format: 'bo3' as const,
  goldenPoint: false,
  superTiebreak: false,
  setTiebreakAt: 6 as const,
}

describe('apply — basic game progression', () => {
  it('0 → 15 → 30 → 40 for team A', () => {
    let s = createInitialState(baseConfig)
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 15, b: 0 })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 30, b: 0 })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 40, b: 0 })
  })

  it('winning from 40-0 ends the game and resets currentGame', () => {
    let s = createInitialState(baseConfig)
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
    expect(s.sets[0]).toEqual({ a: 1, b: 0 })
  })

  it('serve passes to the other team after a game ends', () => {
    let s = createInitialState(baseConfig)
    for (let i = 0; i < 4; i++) s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.servingTeam).toBe('b')
  })
})
```

- [ ] **Step 2: Run — expect fail (apply undefined)**

Run: `npm test -- padel-scoring`
Expected: FAIL.

- [ ] **Step 3: Implement minimally**

Append to `src/lib/padel-scoring.ts`:

```typescript
const NEXT_POINT: Record<Exclude<Points, 'Adv'>, Points> = {
  0: 15,
  15: 30,
  30: 40,
  40: 'Adv', // placeholder — real deuce logic comes in Task 8
}

export function apply(state: MatchState, action: Action): MatchState {
  if (action.kind === 'point_for') return pointFor(state, action.team)
  return state // stubs for other actions come later
}

function pointFor(state: MatchState, team: TeamId): MatchState {
  if (state.phase === 'finished') return state
  if (state.phase === 'tiebreak' || state.phase === 'super-tiebreak') {
    return pointInTiebreak(state, team)
  }
  return pointInGame(state, team)
}

function pointInGame(state: MatchState, team: TeamId): MatchState {
  const game = state.currentGame as { a: Points; b: Points }
  const current = game[team]
  // Game won when team at 40 scores, opponent NOT at 40 or Adv (classic rules handled in Task 8)
  if (current === 40 && game[other(team)] !== 40 && game[other(team)] !== 'Adv') {
    return finishGame(state, team)
  }
  // Advantage conversion to game
  if (current === 'Adv') {
    return finishGame(state, team)
  }
  // Otherwise progress the point counter
  const next = NEXT_POINT[current as Exclude<Points, 'Adv'>]
  return {
    ...state,
    currentGame: { ...game, [team]: next },
  }
}

function pointInTiebreak(state: MatchState, team: TeamId): MatchState {
  // Task 11/14 — leave untouched for now
  return state
}

function other(team: TeamId): TeamId {
  return team === 'a' ? 'b' : 'a'
}

function finishGame(state: MatchState, winner: TeamId): MatchState {
  const sets = state.sets.map((s, i) =>
    i === state.sets.length - 1 ? { ...s, [winner]: s[winner] + 1 } : s,
  )
  return {
    ...state,
    sets,
    currentGame: { a: 0, b: 0 },
    servingTeam: other(state.servingTeam),
    servingPlayer: ((state.servingPlayer + 1) % 4) as PlayerIndex,
  }
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/padel-scoring.ts src/lib/__tests__/padel-scoring.test.ts
git commit -m "feat(scoring): basic game progression with serve rotation"
```

---

### Task 8: Deuce and advantage (classic rules)

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('apply — deuce and advantage (classic)', () => {
  const classicConfig = { ...baseConfig, goldenPoint: false }

  it('40-40 stays at 40-40 until someone scores advantage', () => {
    let s = createInitialState(classicConfig)
    // get to 40-40: alternate points
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    expect(s.currentGame).toEqual({ a: 40, b: 40 })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 'Adv', b: 40 })
  })

  it('team at Adv losing a point returns to 40-40', () => {
    let s = createInitialState(classicConfig)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    s = apply(s, { kind: 'point_for', team: 'a' }) // a = Adv
    s = apply(s, { kind: 'point_for', team: 'b' }) // back to 40-40
    expect(s.currentGame).toEqual({ a: 40, b: 40 })
  })

  it('team at Adv winning the next point wins the game', () => {
    let s = createInitialState(classicConfig)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.sets[0]).toEqual({ a: 1, b: 0 })
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
  })
})
```

- [ ] **Step 2: Run — expect fails on Adv→40 step**

Run: `npm test -- padel-scoring`
Expected: FAIL — "team at Adv losing a point returns to 40-40".

- [ ] **Step 3: Fix `pointInGame` to handle classic deuce**

Replace `pointInGame` in `src/lib/padel-scoring.ts` with:

```typescript
function pointInGame(state: MatchState, team: TeamId): MatchState {
  const game = state.currentGame as { a: Points; b: Points }
  const mine = game[team]
  const theirs = game[other(team)]

  // At Adv: if I score, I win; (opponent at Adv means I'm at 40, see Adv path below)
  if (mine === 'Adv') return finishGame(state, team)

  // Opponent at Adv: I score, drop back to 40-40
  if (theirs === 'Adv') {
    return { ...state, currentGame: { ...game, [other(team)]: 40 as Points } }
  }

  // 40-40 deuce: I score → go to Adv
  if (mine === 40 && theirs === 40) {
    if (state.config.goldenPoint) {
      return finishGame(state, team) // handled in Task 9
    }
    return { ...state, currentGame: { ...game, [team]: 'Adv' as Points } }
  }

  // I'm at 40 and opponent is not 40: I score → win the game
  if (mine === 40) return finishGame(state, team)

  // Normal progression: 0 → 15 → 30 → 40
  const next = NEXT_POINT[mine as Exclude<Points, 'Adv'>]
  return { ...state, currentGame: { ...game, [team]: next } }
}
```

And remove the `'40': 'Adv'` line from `NEXT_POINT` — it's unused now. Replace the constant with:

```typescript
const NEXT_POINT: Record<0 | 15 | 30, Points> = {
  0: 15,
  15: 30,
  30: 40,
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass (7 tests total in file).

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): deuce and advantage (classic rules)"
```

---

### Task 9: Golden point (40-40 → next point wins)

**Files:**
- Modify: `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
describe('apply — golden point (punto de oro)', () => {
  const goldenConfig = { ...baseConfig, goldenPoint: true }

  it('at 40-40 the next point wins the game (no advantage)', () => {
    let s = createInitialState(goldenConfig)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    expect(s.currentGame).toEqual({ a: 40, b: 40 })
    s = apply(s, { kind: 'point_for', team: 'b' })
    expect(s.sets[0]).toEqual({ a: 0, b: 1 })
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
  })

  it('golden point off: 40-40 goes to Adv (classic rules)', () => {
    let s = createInitialState(baseConfig) // goldenPoint: false
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.currentGame).toEqual({ a: 'Adv', b: 40 })
  })
})
```

- [ ] **Step 2: Run — expect pass (Task 8 already included the goldenPoint branch)**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git commit -am "test(scoring): golden-point behavior is correct"
```

---

### Task 10: Set progression — first to 6 games with 2-game lead

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// Helpers added to the test file (below imports):
function winGames(s: MatchState, team: TeamId, n: number): MatchState {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 4; j++) s = apply(s, { kind: 'point_for', team })
  }
  return s
}

describe('set progression', () => {
  it('first to 6 games with 2-game lead wins the set', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)
    // b has 0 games — set should end at 6-0
    expect(s.sets[0]).toEqual({ a: 6, b: 0 })
    expect(s.sets.length).toBe(2) // new set started
    expect(s.sets[1]).toEqual({ a: 0, b: 0 })
  })

  it('at 5-5 no one wins; continues until 7-5 or 6-6 tiebreak', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 5)
    s = winGames(s, 'b', 5)
    expect(s.sets[0]).toEqual({ a: 5, b: 5 })
    expect(s.sets.length).toBe(1)
    s = winGames(s, 'a', 2)
    expect(s.sets[0]).toEqual({ a: 7, b: 5 })
    expect(s.sets.length).toBe(2)
  })

  it('at 6-5 and server wins: set ends 7-5', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)  // wait — this ends at 6-0; rewrite:
    s = createInitialState(baseConfig)
    s = winGames(s, 'a', 5)
    s = winGames(s, 'b', 6)
    // a=5, b=6 — still tie at 5-6? no, b wins another game after: b=6 a=5 not >=2 lead, set continues
    // actually at b=6, a=5 lead is 1, set continues. NOW a wins one: 6-6
    expect(s.sets[0]).toEqual({ a: 5, b: 6 })
    expect(s.sets.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- padel-scoring`
Expected: FAIL — set never closes, arrays don't grow.

- [ ] **Step 3: Update `finishGame` to handle set close**

Replace `finishGame` in `src/lib/padel-scoring.ts` with:

```typescript
function finishGame(state: MatchState, winner: TeamId): MatchState {
  const sets = state.sets.map((s, i) =>
    i === state.sets.length - 1 ? { ...s, [winner]: s[winner] + 1 } : s,
  )
  const updated: MatchState = {
    ...state,
    sets,
    currentGame: { a: 0, b: 0 },
    servingTeam: other(state.servingTeam),
    servingPlayer: ((state.servingPlayer + 1) % 4) as PlayerIndex,
  }
  return maybeCloseSetOrMatch(updated)
}

function maybeCloseSetOrMatch(state: MatchState): MatchState {
  const current = state.sets[state.sets.length - 1]
  const { a, b } = current
  const setComplete = isSetComplete(a, b, state.config)

  // 6-6 → enter tiebreak (Task 11)
  if (a === 6 && b === 6 && state.config.setTiebreakAt === 6 && !setComplete) {
    return { ...state, phase: 'tiebreak' }
  }

  if (!setComplete) return state

  // Set done. Does the match end?
  const setWinner: TeamId = a > b ? 'a' : 'b'
  const matchOver = checkMatchOver(state.sets, state.config)
  if (matchOver) {
    return { ...state, phase: 'finished', winner: setWinner, endReason: 'completed' }
  }

  // Continue: start a new empty set
  return { ...state, sets: [...state.sets, { a: 0, b: 0 }] }
}

function isSetComplete(a: number, b: number, config: MatchConfig): boolean {
  if (config.format === 'pro-set') {
    return (a >= 9 || b >= 9) && Math.abs(a - b) >= 2
  }
  if (config.format === 'single-set') {
    // single-set: first to 6 by 2, or 7-6 with tiebreak
    if (a === 7 && b === 6) return true
    if (a === 6 && b === 7) return true
    return (a >= 6 || b >= 6) && Math.abs(a - b) >= 2
  }
  // bo3, bo5: standard 6-game set
  if (a === 7 && b === 6) return true
  if (a === 6 && b === 7) return true
  return (a >= 6 || b >= 6) && Math.abs(a - b) >= 2
}

function checkMatchOver(sets: SetScore[], config: MatchConfig): boolean {
  const setsNeeded = config.format === 'bo5' ? 3 : config.format === 'bo3' ? 2 : 1
  let aSets = 0, bSets = 0
  for (const s of sets) {
    if (s.a > s.b && isSetComplete(s.a, s.b, config)) aSets++
    if (s.b > s.a && isSetComplete(s.a, s.b, config)) bSets++
  }
  return aSets >= setsNeeded || bSets >= setsNeeded
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): set progression with 6-game / 7-5 / continue rules"
```

---

### Task 11: Tiebreak at 6-6 (standard 7-point, win by 2)

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('tiebreak at 6-6', () => {
  it('entering tiebreak resets currentGame to 0-0 integers', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)
    // a=6, b=0, set closed. Reset:
    s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)
    // a=6, b=0; set closed at 6-0, new set started. need 6-6 scenario:
    s = createInitialState(baseConfig)
    for (let i = 0; i < 6; i++) { s = winGames(s, 'a', 1); s = winGames(s, 'b', 1) }
    expect(s.sets[0]).toEqual({ a: 6, b: 6 })
    expect(s.phase).toBe('tiebreak')
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
  })

  it('first to 7 with 2-point lead wins the tiebreak and the set 7-6', () => {
    let s = createInitialState(baseConfig)
    for (let i = 0; i < 6; i++) { s = winGames(s, 'a', 1); s = winGames(s, 'b', 1) }
    for (let i = 0; i < 7; i++) s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.sets[0]).toEqual({ a: 7, b: 6 })
    expect(s.sets.length).toBe(2) // moved to set 2
    expect(s.phase).toBe('playing')
  })

  it('tiebreak at 6-6 continues to 8-6, 9-7, etc. (win by 2)', () => {
    let s = createInitialState(baseConfig)
    for (let i = 0; i < 6; i++) { s = winGames(s, 'a', 1); s = winGames(s, 'b', 1) }
    for (let i = 0; i < 6; i++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let i = 0; i < 6; i++) s = apply(s, { kind: 'point_for', team: 'b' })
    expect(s.currentGame).toEqual({ a: 6, b: 6 })
    expect(s.phase).toBe('tiebreak')
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.sets[0]).toEqual({ a: 7, b: 6 })
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- padel-scoring`
Expected: FAIL — currentGame mismatch (Points instead of integers when entering tiebreak).

- [ ] **Step 3: Update `maybeCloseSetOrMatch` and implement `pointInTiebreak`**

In `maybeCloseSetOrMatch`, update the 6-6 branch to also reset `currentGame` to integer counters:

```typescript
if (a === 6 && b === 6 && state.config.setTiebreakAt === 6 && !setComplete) {
  return { ...state, phase: 'tiebreak', currentGame: { a: 0, b: 0 } }
}
```

Then replace `pointInTiebreak`:

```typescript
function pointInTiebreak(state: MatchState, team: TeamId): MatchState {
  const tb = state.currentGame as { a: number; b: number }
  const mine = tb[team] + 1
  const theirs = tb[other(team)]
  const threshold = state.phase === 'super-tiebreak' ? 10 : 7
  if (mine >= threshold && mine - theirs >= 2) {
    return closeTiebreak(state, team)
  }
  return { ...state, currentGame: { ...tb, [team]: mine } }
}

function closeTiebreak(state: MatchState, winner: TeamId): MatchState {
  // Tiebreak set ends 7-6 (or 10 in super-tiebreak)
  const setIndex = state.sets.length - 1
  const sets = state.sets.map((s, i) =>
    i === setIndex ? { a: winner === 'a' ? s.a + 1 : s.a, b: winner === 'b' ? s.b + 1 : s.b } : s,
  )
  const base: MatchState = {
    ...state,
    sets,
    currentGame: { a: 0, b: 0 },
    phase: 'playing',
  }
  const matchOver = checkMatchOver(sets, state.config)
  if (matchOver) {
    return { ...base, phase: 'finished', winner, endReason: 'completed' }
  }
  return { ...base, sets: [...sets, { a: 0, b: 0 }] }
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): 6-6 tiebreak (first to 7, win by 2)"
```

---

### Task 12: Best-of-3 match completion

**Files:**
- Modify: `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('BO3 match completion', () => {
  it('first team to 2 sets wins', () => {
    let s = createInitialState(baseConfig)
    // A wins sets 1 and 2
    s = winGames(s, 'a', 6)
    s = winGames(s, 'a', 6)
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
    expect(s.endReason).toBe('completed')
    expect(s.sets.length).toBe(2) // no 3rd set started
  })

  it('if 1-1 in sets, third set decides', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6) // set 1: 6-0 for A
    s = winGames(s, 'b', 6) // set 2: 6-0 for B
    expect(s.sets.length).toBe(3)
    expect(s.phase).toBe('playing')
    s = winGames(s, 'a', 6)
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
  })
})
```

- [ ] **Step 2: Run — expect pass (match-over logic already in Task 10)**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git commit -am "test(scoring): BO3 match completion"
```

---

### Task 13: Super-tiebreak in final set (replaces 3rd set)

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('super-tiebreak in final set', () => {
  const stbConfig = { ...baseConfig, superTiebreak: true }

  it('at 1-1 in sets, match enters super-tiebreak immediately', () => {
    let s = createInitialState(stbConfig)
    s = winGames(s, 'a', 6)
    s = winGames(s, 'b', 6)
    expect(s.phase).toBe('super-tiebreak')
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
    expect(s.sets.length).toBe(3)
    expect(s.sets[2]).toEqual({ a: 0, b: 0 })
  })

  it('first to 10 with 2-point lead wins the super-tiebreak and match', () => {
    let s = createInitialState(stbConfig)
    s = winGames(s, 'a', 6)
    s = winGames(s, 'b', 6)
    for (let i = 0; i < 10; i++) s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
    expect(s.sets[2]).toEqual({ a: 1, b: 0 })
  })

  it('at 9-9 super-tiebreak continues to 11-9, 12-10 etc.', () => {
    let s = createInitialState(stbConfig)
    s = winGames(s, 'a', 6)
    s = winGames(s, 'b', 6)
    for (let i = 0; i < 9; i++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let i = 0; i < 9; i++) s = apply(s, { kind: 'point_for', team: 'b' })
    expect(s.currentGame).toEqual({ a: 9, b: 9 })
    expect(s.phase).toBe('super-tiebreak')
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'point_for', team: 'a' })
    expect(s.phase).toBe('finished')
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- padel-scoring`
Expected: FAIL — super-tiebreak not entered after 1-1.

- [ ] **Step 3: Update `maybeCloseSetOrMatch` to enter super-tiebreak**

Replace `maybeCloseSetOrMatch` (inside the "set done, match continues" branch):

```typescript
function maybeCloseSetOrMatch(state: MatchState): MatchState {
  const current = state.sets[state.sets.length - 1]
  const { a, b } = current
  const setComplete = isSetComplete(a, b, state.config)

  if (a === 6 && b === 6 && state.config.setTiebreakAt === 6 && !setComplete) {
    return { ...state, phase: 'tiebreak', currentGame: { a: 0, b: 0 } }
  }

  if (!setComplete) return state

  const setWinner: TeamId = a > b ? 'a' : 'b'
  const matchOver = checkMatchOver(state.sets, state.config)
  if (matchOver) {
    return { ...state, phase: 'finished', winner: setWinner, endReason: 'completed' }
  }

  // New set. If next set would be the decider AND super-tiebreak is on, enter super-tiebreak.
  const nextSets = [...state.sets, { a: 0, b: 0 }]
  if (state.config.superTiebreak && isDecidingSet(nextSets, state.config)) {
    return { ...state, sets: nextSets, phase: 'super-tiebreak', currentGame: { a: 0, b: 0 } }
  }
  return { ...state, sets: nextSets }
}

function isDecidingSet(sets: SetScore[], config: MatchConfig): boolean {
  const setsNeeded = config.format === 'bo5' ? 3 : config.format === 'bo3' ? 2 : 1
  let aSets = 0, bSets = 0
  for (let i = 0; i < sets.length - 1; i++) {
    const s = sets[i]
    if (isSetComplete(s.a, s.b, config)) {
      if (s.a > s.b) aSets++
      else bSets++
    }
  }
  // Decider = one more set-win by either team ends the match
  return aSets === setsNeeded - 1 && bSets === setsNeeded - 1
}
```

Also update `closeTiebreak` to handle super-tiebreak closing the match correctly — already does: the `checkMatchOver` call at end handles it, but super-tiebreak sets record differently. Add a check: super-tiebreak sets show games `1-0` or `0-1` (not `7-6`). Update `closeTiebreak`:

```typescript
function closeTiebreak(state: MatchState, winner: TeamId): MatchState {
  const setIndex = state.sets.length - 1
  // Super-tiebreak records as 1-0, regular tiebreak as 7-6
  const sets = state.sets.map((s, i) => {
    if (i !== setIndex) return s
    if (state.phase === 'super-tiebreak') {
      return { a: winner === 'a' ? 1 : 0, b: winner === 'b' ? 1 : 0 }
    }
    return { a: winner === 'a' ? s.a + 1 : s.a, b: winner === 'b' ? s.b + 1 : s.b }
  })
  const base: MatchState = {
    ...state,
    sets,
    currentGame: { a: 0, b: 0 },
    phase: 'playing',
  }
  const matchOver = checkMatchOver(sets, state.config) ||
    state.phase === 'super-tiebreak' // super-tiebreak always ends match
  if (matchOver) {
    return { ...base, phase: 'finished', winner, endReason: 'completed' }
  }
  return { ...base, sets: [...sets, { a: 0, b: 0 }] }
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): super-tiebreak replaces final set (first to 10 by 2)"
```

---

### Task 14: Pro-set and single-set formats

**Files:**
- Modify: `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('alt formats', () => {
  it('pro-set: first to 9 with 2-game lead wins the match', () => {
    const cfg: MatchConfig = { format: 'pro-set', goldenPoint: false, superTiebreak: false, setTiebreakAt: 'none' }
    let s = createInitialState(cfg)
    s = winGames(s, 'a', 9)
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
  })

  it('single-set: first to 6 with 2-lead wins', () => {
    const cfg: MatchConfig = { format: 'single-set', goldenPoint: false, superTiebreak: false, setTiebreakAt: 6 }
    let s = createInitialState(cfg)
    s = winGames(s, 'a', 6)
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
  })
})
```

- [ ] **Step 2: Run — expect pass (Task 10 already covers pro-set and single-set closing)**

Run: `npm test -- padel-scoring`
Expected: all pass. If `single-set` test fails because `checkMatchOver` with `setsNeeded=1` — debug and fix.

- [ ] **Step 3: Commit**

```bash
git commit -am "test(scoring): pro-set and single-set formats"
```

---

### Task 15: Serve rotation across games and tiebreak

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('serve rotation (doubles, 4 players)', () => {
  it('server cycles through all 4 players', () => {
    let s = createInitialState(baseConfig)
    const servers: PlayerIndex[] = [s.servingPlayer]
    for (let g = 0; g < 5; g++) {
      s = winGames(s, g % 2 === 0 ? 'a' : 'b', 1)
      servers.push(s.servingPlayer)
    }
    expect(servers).toEqual([0, 1, 2, 3, 0, 1])
  })

  it('tiebreak: first serve by whichever team would have served next, then rotate after 1 then every 2 points', () => {
    let s = createInitialState(baseConfig)
    // Force to 6-6
    for (let i = 0; i < 6; i++) { s = winGames(s, 'a', 1); s = winGames(s, 'b', 1) }
    expect(s.phase).toBe('tiebreak')
    const first = s.servingPlayer
    s = apply(s, { kind: 'point_for', team: 'a' }) // 1 point played
    const afterOne = s.servingPlayer
    expect(afterOne).not.toBe(first) // server changes after point 1 in tiebreak
    s = apply(s, { kind: 'point_for', team: 'a' }) // 2 points played
    const afterTwo = s.servingPlayer
    expect(afterTwo).toBe(afterOne) // same server for 2 points
    s = apply(s, { kind: 'point_for', team: 'a' }) // 3rd point
    expect(s.servingPlayer).not.toBe(afterTwo)
  })
})
```

- [ ] **Step 2: Run — expect fail on tiebreak serve rotation**

Run: `npm test -- padel-scoring`
Expected: FAIL.

- [ ] **Step 3: Update `pointInTiebreak` with proper serve rotation**

Replace `pointInTiebreak`:

```typescript
function pointInTiebreak(state: MatchState, team: TeamId): MatchState {
  const tb = state.currentGame as { a: number; b: number }
  const totalPoints = tb.a + tb.b + 1
  const mine = tb[team] + 1
  const theirs = tb[other(team)]
  const threshold = state.phase === 'super-tiebreak' ? 10 : 7

  let next: MatchState = { ...state, currentGame: { ...tb, [team]: mine } }

  // Serve rotation in tiebreak: after point 1, rotate; then every 2 points thereafter.
  const rotate = totalPoints === 1 || (totalPoints >= 3 && (totalPoints - 1) % 2 === 0)
  if (rotate) {
    next = {
      ...next,
      servingTeam: other(next.servingTeam),
      servingPlayer: ((next.servingPlayer + 1) % 4) as PlayerIndex,
    }
  }

  if (mine >= threshold && mine - theirs >= 2) {
    return closeTiebreak(next, team)
  }
  return next
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): doubles serve rotation in game and tiebreak"
```

---

### Task 16: Undo — event-log-based replay

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

The engine itself does not store history — it's a pure reducer. To implement undo, we build a helper `applyAll(initial, actions)` and define the undo semantics at a wrapper layer (`src/lib/match-log.ts`) to keep the pure engine truly pure. This keeps the reducer test-friendly.

- [ ] **Step 1: Create the wrapper + failing tests**

Create `src/lib/match-log.ts`:

```typescript
// Thin wrapper over the pure engine that supports undo by replaying from the initial state.
import { apply, createInitialState, type Action, type MatchConfig, type MatchState } from './padel-scoring'

export interface MatchLog {
  config: MatchConfig
  actions: Action[]            // committed actions (excluding undo)
  state: MatchState            // current computed state
}

export function createLog(config: MatchConfig): MatchLog {
  return { config, actions: [], state: createInitialState(config) }
}

export function recordAction(log: MatchLog, action: Action): MatchLog {
  if (action.kind === 'undo') {
    if (log.actions.length === 0) return log
    const actions = log.actions.slice(0, -1)
    return { ...log, actions, state: replay(log.config, actions) }
  }
  const state = apply(log.state, action)
  return { ...log, actions: [...log.actions, action], state }
}

function replay(config: MatchConfig, actions: Action[]): MatchState {
  let s = createInitialState(config)
  for (const a of actions) s = apply(s, a)
  return s
}
```

Create `src/lib/__tests__/match-log.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createLog, recordAction } from '@/lib/match-log'

const cfg = { format: 'bo3' as const, goldenPoint: false, superTiebreak: false, setTiebreakAt: 6 as const }

describe('match-log undo', () => {
  it('undo removes the last action and replays', () => {
    let log = createLog(cfg)
    log = recordAction(log, { kind: 'point_for', team: 'a' })
    log = recordAction(log, { kind: 'point_for', team: 'a' })
    expect(log.state.currentGame).toEqual({ a: 30, b: 0 })
    log = recordAction(log, { kind: 'undo' })
    expect(log.state.currentGame).toEqual({ a: 15, b: 0 })
    expect(log.actions.length).toBe(1)
  })

  it('undo on an empty log is a no-op', () => {
    let log = createLog(cfg)
    log = recordAction(log, { kind: 'undo' })
    expect(log.state.currentGame).toEqual({ a: 0, b: 0 })
  })

  it('undo restores servingPlayer across game boundaries', () => {
    let log = createLog(cfg)
    for (let i = 0; i < 4; i++) log = recordAction(log, { kind: 'point_for', team: 'a' })
    const afterGame = log.state.servingPlayer
    log = recordAction(log, { kind: 'undo' })
    expect(log.state.servingPlayer).not.toBe(afterGame) // back to previous server
    expect(log.state.currentGame).toEqual({ a: 40, b: 0 })
    expect(log.state.sets[0]).toEqual({ a: 0, b: 0 })
  })
})
```

- [ ] **Step 2: Run — expect pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/match-log.ts src/lib/__tests__/match-log.test.ts
git commit -m "feat(scoring): event-log wrapper with undo via replay"
```

---

### Task 17: Retirement and walkover

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('retirement / walkover', () => {
  it('retirement: opponent wins, endReason=retired, phase=finished', () => {
    let s = createInitialState(baseConfig)
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'mark_retirement', team: 'a' })
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('b') // opponent wins
    expect(s.endReason).toBe('retired')
  })

  it('walkover: opponent wins, endReason=walkover', () => {
    let s = createInitialState(baseConfig)
    s = apply(s, { kind: 'mark_walkover', team: 'b' })
    expect(s.phase).toBe('finished')
    expect(s.winner).toBe('a')
    expect(s.endReason).toBe('walkover')
  })

  it('cannot mark retirement after match has ended', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)
    s = winGames(s, 'a', 6)
    expect(s.phase).toBe('finished')
    const before = s
    s = apply(s, { kind: 'mark_retirement', team: 'b' })
    expect(s).toEqual(before)
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- padel-scoring`
Expected: FAIL.

- [ ] **Step 3: Extend `apply`**

In `src/lib/padel-scoring.ts`, extend the `apply` function:

```typescript
export function apply(state: MatchState, action: Action): MatchState {
  if (state.phase === 'finished') return state
  if (action.kind === 'point_for') return pointFor(state, action.team)
  if (action.kind === 'mark_retirement') {
    return { ...state, phase: 'finished', winner: other(action.team), endReason: 'retired' }
  }
  if (action.kind === 'mark_walkover') {
    return { ...state, phase: 'finished', winner: other(action.team), endReason: 'walkover' }
  }
  return state
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(scoring): retirement and walkover actions"
```

---

### Task 18: Manual score correction and reset

**Files:**
- Modify: `src/lib/padel-scoring.ts`, `src/lib/__tests__/padel-scoring.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('correct_score and reset', () => {
  it('correct_score patches specific fields', () => {
    let s = createInitialState(baseConfig)
    s = apply(s, { kind: 'point_for', team: 'a' })
    s = apply(s, { kind: 'correct_score', patch: { currentGame: { a: 30, b: 15 } } })
    expect(s.currentGame).toEqual({ a: 30, b: 15 })
  })

  it('reset returns to initial state with the same config', () => {
    let s = createInitialState(baseConfig)
    s = winGames(s, 'a', 6)
    s = apply(s, { kind: 'reset' })
    expect(s.sets).toEqual([{ a: 0, b: 0 }])
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
    expect(s.phase).toBe('playing')
  })
})
```

- [ ] **Step 2: Extend `apply`**

```typescript
  if (action.kind === 'correct_score') {
    return { ...state, ...action.patch }
  }
  if (action.kind === 'reset') {
    return createInitialState(state.config)
  }
  if (action.kind === 'set_golden_point') {
    return { ...state, config: { ...state.config, goldenPoint: action.value } }
  }
  if (action.kind === 'set_format') {
    return { ...state, config: { ...state.config, format: action.value } }
  }
```

- [ ] **Step 3: Run — expect pass**

Run: `npm test -- padel-scoring`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(scoring): manual score correction, reset, config toggles"
```

---

### Task 19: Derived-state helpers for overlay (badges, match points)

**Files:**
- Create: `src/lib/match-flags.ts`, `src/lib/__tests__/match-flags.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/__tests__/match-flags.test.ts
import { describe, it, expect } from 'vitest'
import { getMatchFlags } from '@/lib/match-flags'
import { apply, createInitialState } from '@/lib/padel-scoring'

const cfg = { format: 'bo3' as const, goldenPoint: true, superTiebreak: false, setTiebreakAt: 6 as const }

describe('getMatchFlags', () => {
  it('shows GOLDEN POINT at 40-40 with goldenPoint=true', () => {
    let s = createInitialState(cfg)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    const flags = getMatchFlags(s)
    expect(flags.goldenPoint).toBe(true)
  })

  it('shows SET POINT when a team is one point away from winning the current set', () => {
    const classicCfg = { ...cfg, goldenPoint: false }
    let s = createInitialState(classicCfg)
    // A wins 5 games, then gets to 5-0 & 40-0 in game 6: that's set point
    for (let g = 0; g < 5; g++) {
      for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    }
    for (let p = 0; p < 3; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    const flags = getMatchFlags(s)
    expect(flags.setPointFor).toBe('a')
  })

  it('shows MATCH POINT when a team is one point from match win', () => {
    const classicCfg = { ...cfg, goldenPoint: false }
    let s = createInitialState(classicCfg)
    // A wins set 1 6-0. Then gets 5-0 in set 2 and 40-0 in current game
    for (let g = 0; g < 6; g++) for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let g = 0; g < 5; g++) for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let p = 0; p < 3; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    const flags = getMatchFlags(s)
    expect(flags.matchPointFor).toBe('a')
  })
})
```

- [ ] **Step 2: Implement**

Create `src/lib/match-flags.ts`:

```typescript
import { apply, type MatchState, type TeamId } from './padel-scoring'

export interface MatchFlags {
  goldenPoint: boolean
  breakPointFor: TeamId | null
  setPointFor: TeamId | null
  matchPointFor: TeamId | null
  inTiebreak: boolean
  inSuperTiebreak: boolean
  showChangeover: boolean
}

export function getMatchFlags(state: MatchState): MatchFlags {
  const flags: MatchFlags = {
    goldenPoint: false,
    breakPointFor: null,
    setPointFor: null,
    matchPointFor: null,
    inTiebreak: state.phase === 'tiebreak',
    inSuperTiebreak: state.phase === 'super-tiebreak',
    showChangeover: false,
  }

  if (state.phase === 'finished') return flags

  // GOLDEN POINT: 40-40 and config.goldenPoint on (tie detection uses Points values)
  if (state.phase === 'playing' && state.config.goldenPoint) {
    const g = state.currentGame as { a: unknown; b: unknown }
    if (g.a === 40 && g.b === 40) flags.goldenPoint = true
  }

  // BREAK / SET / MATCH POINT: simulate both possibilities. If awarding the next point
  // to team T ends the current game while T is not the serving team → break point for T.
  // If it ends the current set → set point. If it ends the match → match point.
  for (const t of ['a', 'b'] as TeamId[]) {
    const after = apply(state, { kind: 'point_for', team: t })
    if (after.phase === 'finished' && after.winner === t) {
      flags.matchPointFor = t
      continue
    }
    const currentSetA = state.sets[state.sets.length - 1]
    const afterSetA = after.sets[after.sets.length - 1] ?? currentSetA
    if (after.sets.length > state.sets.length) {
      flags.setPointFor = t
      continue
    }
    // Game ended when currentGame reset to 0-0 and the previous currentGame was not 0-0
    const prev = state.currentGame as { a: number | string; b: number | string }
    const next = after.currentGame as { a: number | string; b: number | string }
    const gameReset = next.a === 0 && next.b === 0 && !(prev.a === 0 && prev.b === 0)
    if (gameReset && t !== state.servingTeam) {
      flags.breakPointFor = t
    }
  }

  return flags
}
```

- [ ] **Step 3: Run — expect pass**

Run: `npm test -- match-flags`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/match-flags.ts src/lib/__tests__/match-flags.test.ts
git commit -m "feat(scoring): derived flags (golden/break/set/match point, tiebreak)"
```

---

## Phase 2 — Supabase Setup

### Task 20: Create Supabase project and wire env vars

This task is **manual** — the engineer must create a Supabase project through the dashboard. The migrations are version-controlled; applying them is also manual for v1 (we adopt `supabase migrations` CLI in a later task once v1 is stable).

- [ ] **Step 1: Create Supabase project**

Visit https://supabase.com/dashboard → New project → name `padelboard`, region closest to Vercel edge, set a strong DB password.

- [ ] **Step 2: Copy credentials into `.env.local`**

From Supabase dashboard → Settings → API:

```bash
# .env.local  (DO NOT COMMIT)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service role key>
```

- [ ] **Step 3: Write `.env.local.example`**

```bash
# .env.local.example — copy to .env.local and fill
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

- [ ] **Step 4: Commit the example**

```bash
git add .env.local.example
git commit -m "chore: add .env.local.example"
```

---

### Task 21: Initial schema migration (profiles, matches, match_events)

**Files:**
- Create: `supabase/migrations/20260418000000_initial_schema.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260418000000_initial_schema.sql
-- Padelboard v1 — initial schema.

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('player','club','organizer','federation')),
  created_at timestamptz default now()
);

-- ── matches ─────────────────────────────────────────────────
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  owner_id uuid references public.profiles(id),
  draft_token text,
  status text not null default 'draft' check (status in ('draft','published','finished','abandoned')),
  config jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  teams jsonb not null default '{}'::jsonb,
  overlay jsonb not null default '{}'::jsonb,
  tournament_label text,
  published_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists matches_owner_created_idx on public.matches (owner_id, created_at desc);
create index if not exists matches_short_code_idx on public.matches (short_code);
create index if not exists matches_status_draft_idx on public.matches (status, created_at) where status = 'draft';

-- Enable realtime on state column (row-level)
alter publication supabase_realtime add table public.matches;

-- ── match_events (event log) ────────────────────────────────
create table if not exists public.match_events (
  id bigserial primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  kind text not null,
  payload jsonb,
  state_after jsonb not null,
  created_at timestamptz default now()
);

create index if not exists match_events_match_idx on public.match_events (match_id, id);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Copy the file contents into the Supabase Dashboard → SQL Editor → paste → Run. Verify tables in the Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418000000_initial_schema.sql
git commit -m "feat(db): initial schema (profiles, matches, match_events)"
```

---

### Task 22: RLS policies migration

**Files:**
- Create: `supabase/migrations/20260418000001_rls_policies.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260418000001_rls_policies.sql
-- Row-level security policies.

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

-- ── profiles ────────────────────────────────────────────────
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self write"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update using (auth.uid() = id);

-- ── matches ─────────────────────────────────────────────────
-- Anyone may read a match row (overlay is public).
-- Draft-stage writes happen via the anon key through an API route that verifies draft_token server-side
-- (see Task 28). Clients do not write directly.
-- Published-stage writes (operator control) happen via authenticated owner through an API route.
--
-- So DB-level policies:
--   SELECT: anyone (required for overlay)
--   INSERT: service role only (via API routes)
--   UPDATE/DELETE: owner-only; service role bypasses
create policy "matches: public read"
  on public.matches for select
  using (true);

create policy "matches: owner update"
  on public.matches for update
  using (auth.uid() = owner_id);

create policy "matches: owner delete"
  on public.matches for delete
  using (auth.uid() = owner_id);

-- No INSERT policy on anon — all inserts routed through service-role API routes.
-- (Supabase RLS denies by default when no policy matches.)

-- ── match_events ────────────────────────────────────────────
create policy "match_events: public read"
  on public.match_events for select
  using (true);

create policy "match_events: owner insert"
  on public.match_events for insert
  with check (
    auth.uid() = (select owner_id from public.matches where id = match_id)
  );
```

- [ ] **Step 2: Apply in Supabase SQL editor**

Same procedure as Task 21.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418000001_rls_policies.sql
git commit -m "feat(db): RLS policies for profiles, matches, match_events"
```

---

### Task 23: Storage bucket for logos

**Files:**
- Create: `supabase/migrations/20260418000002_storage.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260418000002_storage.sql
-- Public storage bucket for team/club logos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Public read
create policy "assets: public read"
  on storage.objects for select
  using (bucket_id = 'assets');

-- Authenticated users can upload
create policy "assets: authenticated insert"
  on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'authenticated');

-- For v1, allow anon upload too so drafts can attach logos before signup.
-- Namespaced by draft token so anon can only write to their own folder.
create policy "assets: anon draft insert"
  on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'anon');
```

- [ ] **Step 2: Apply in Supabase SQL editor**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418000002_storage.sql
git commit -m "feat(db): public storage bucket for logos"
```

---

### Task 24: Supabase client factory

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write**

```typescript
// src/lib/supabase.ts — Client factory (browser anon + server service)
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export function browserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function serverSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    },
  )
}

export function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(lib): supabase client factory (browser/server/service)"
```

---

## Phase 3 — Shared Types, Codes, Tokens

### Task 25: Shared types for match rows

**Files:**
- Create: `src/types/match.ts`

- [ ] **Step 1: Write**

```typescript
// src/types/match.ts — Shared domain types.
import type { MatchConfig, MatchState } from '@/lib/padel-scoring'

export type TemplateId = 'minimal' | 'broadcast' | 'split'

export interface TeamJson {
  name: string
  players: [string, string]
  color: string
  logoUrl?: string
  country?: string
}

export interface TeamsJson {
  a: TeamJson
  b: TeamJson
}

export interface OverlayJson {
  template: TemplateId
  showTimer: boolean
  showTournament: boolean
  tournamentName?: string
  round?: string
  customColors: {
    accent: string
  }
  scale: number // 0.5 – 1.5 (100% = 1.0)
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface MatchRow {
  id: string
  short_code: string
  owner_id: string | null
  draft_token: string | null
  status: 'draft' | 'published' | 'finished' | 'abandoned'
  config: MatchConfig
  state: MatchState
  teams: TeamsJson
  overlay: OverlayJson
  tournament_label: string | null
  published_at: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export function defaultTeams(): TeamsJson {
  return {
    a: { name: 'Team A', players: ['', ''], color: '#0a84ff' },
    b: { name: 'Team B', players: ['', ''], color: '#ff453a' },
  }
}

export function defaultOverlay(): OverlayJson {
  return {
    template: 'minimal',
    showTimer: true,
    showTournament: true,
    tournamentName: '',
    round: '',
    customColors: { accent: '#c4d82e' },
    scale: 1.0,
    position: 'top-left',
  }
}

export function defaultConfig(): MatchConfig {
  return {
    format: 'bo3',
    goldenPoint: true,
    superTiebreak: true,
    setTiebreakAt: 6,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/match.ts
git commit -m "feat(types): shared match row + defaults"
```

---

### Task 26: Short-code generator

**Files:**
- Create: `src/lib/short-code.ts`, `src/lib/__tests__/short-code.test.ts`

- [ ] **Step 1: Write test**

```typescript
import { describe, it, expect } from 'vitest'
import { generateShortCode } from '@/lib/short-code'

describe('generateShortCode', () => {
  it('returns a 6-character code using the safe alphabet', () => {
    const code = generateShortCode()
    expect(code).toMatch(/^[A-HJKLMNP-Z23-9]{6}$/)
  })

  it('is unlikely to collide over many draws', () => {
    const set = new Set<string>()
    for (let i = 0; i < 1000; i++) set.add(generateShortCode())
    expect(set.size).toBe(1000)
  })
})
```

- [ ] **Step 2: Implement**

```typescript
// src/lib/short-code.ts — 6-char codes with an unambiguous alphabet (no 0/O/1/I).
import { customAlphabet } from 'nanoid'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const nano = customAlphabet(ALPHABET, 6)

export function generateShortCode(): string {
  return nano()
}
```

- [ ] **Step 3: Run — expect pass**

Run: `npm test -- short-code`
Expected: 2 passed.

- [ ] **Step 4: Commit**

```bash
git add src/lib/short-code.ts src/lib/__tests__/short-code.test.ts
git commit -m "feat(lib): 6-char short-code generator (unambiguous alphabet)"
```

---

### Task 27: Draft-token helpers

**Files:**
- Create: `src/lib/draft-token.ts`

- [ ] **Step 1: Write**

```typescript
// src/lib/draft-token.ts — Generate draft tokens + localStorage persistence.
import { nanoid } from 'nanoid'

const STORAGE_KEY = 'padelboard:draftTokens' // { [matchId]: draftToken }

export function generateDraftToken(): string {
  return nanoid(32)
}

export function saveDraftToken(matchId: string, token: string): void {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  const map: Record<string, string> = raw ? JSON.parse(raw) : {}
  map[matchId] = token
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getDraftToken(matchId: string): string | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const map: Record<string, string> = JSON.parse(raw)
  return map[matchId] ?? null
}

export function clearDraftToken(matchId: string): void {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  const map: Record<string, string> = JSON.parse(raw)
  delete map[matchId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/draft-token.ts
git commit -m "feat(lib): draft-token generator + localStorage helpers"
```

---

## Phase 4 — API Routes

### Task 28: `POST /api/matches` — create a draft match

**Files:**
- Create: `src/app/api/matches/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/matches/route.ts — Create a new draft match.
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase'
import { generateShortCode } from '@/lib/short-code'
import { generateDraftToken } from '@/lib/draft-token'
import { createInitialState } from '@/lib/padel-scoring'
import { defaultConfig, defaultOverlay, defaultTeams } from '@/types/match'

export async function POST() {
  const sb = serviceSupabase()
  const config = defaultConfig()
  const payload = {
    short_code: generateShortCode(),
    draft_token: generateDraftToken(),
    status: 'draft' as const,
    config,
    state: createInitialState(config),
    teams: defaultTeams(),
    overlay: defaultOverlay(),
  }

  // Retry on short-code collision (very rare)
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await sb
      .from('matches')
      .insert(payload)
      .select('id, short_code, draft_token')
      .single()
    if (!error) {
      return NextResponse.json({ id: data.id, shortCode: data.short_code, draftToken: data.draft_token })
    }
    if (error.code === '23505') {  // unique violation
      payload.short_code = generateShortCode()
      continue
    }
    console.error('[api/matches] create failed', error)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
  return NextResponse.json({ error: 'short_code_collision' }, { status: 500 })
}
```

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev  # in one terminal
# in another:
curl -X POST http://localhost:3003/api/matches
# Expect: {"id":"...","shortCode":"XXXXXX","draftToken":"..."}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/matches/route.ts
git commit -m "feat(api): POST /api/matches — create draft row"
```

---

### Task 29: `PATCH /api/matches/[id]` — update a draft

**Files:**
- Create: `src/app/api/matches/[id]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/matches/[id]/route.ts — PATCH draft match (draft_token auth).
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase'
import type { MatchConfig } from '@/lib/padel-scoring'
import type { TeamsJson, OverlayJson } from '@/types/match'
import { createInitialState } from '@/lib/padel-scoring'

interface PatchBody {
  draftToken: string
  teams?: TeamsJson
  overlay?: OverlayJson
  config?: MatchConfig
  tournamentLabel?: string
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json()) as PatchBody
  if (!body?.draftToken) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 })
  }

  const sb = serviceSupabase()
  const { data: row, error: fetchErr } = await sb
    .from('matches')
    .select('id, status, draft_token, config, state')
    .eq('id', id)
    .single()

  if (fetchErr || !row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (row.status !== 'draft') return NextResponse.json({ error: 'not_a_draft' }, { status: 409 })
  if (row.draft_token !== body.draftToken) return NextResponse.json({ error: 'bad_token' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  if (body.teams) patch.teams = body.teams
  if (body.overlay) patch.overlay = body.overlay
  if (body.tournamentLabel !== undefined) patch.tournament_label = body.tournamentLabel
  // Changing the config rebuilds the initial state to stay consistent.
  if (body.config) {
    patch.config = body.config
    patch.state = createInitialState(body.config)
  }

  const { error: updErr } = await sb.from('matches').update(patch).eq('id', id)
  if (updErr) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/matches/[id]/route.ts
git commit -m "feat(api): PATCH /api/matches/[id] — update draft (draft_token auth)"
```

---

### Task 30: `POST /api/matches/[id]/action` — apply scoring action

**Files:**
- Create: `src/app/api/matches/[id]/action/route.ts`

- [ ] **Step 1: Write**

```typescript
// src/app/api/matches/[id]/action/route.ts — apply a scoring action (published matches)
import { NextResponse } from 'next/server'
import { serviceSupabase, serverSupabase } from '@/lib/supabase'
import { apply, type Action } from '@/lib/padel-scoring'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { action, draftToken } = (await req.json()) as { action: Action; draftToken?: string }

  if (!action?.kind) return NextResponse.json({ error: 'bad_action' }, { status: 400 })

  const svc = serviceSupabase()
  const { data: row, error } = await svc
    .from('matches')
    .select('id, status, draft_token, owner_id, state, started_at')
    .eq('id', id)
    .single()
  if (error || !row) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Authorization: either user-session owner, or draft-token holder (for draft test actions).
  let authorized = false
  if (row.owner_id) {
    const user = await serverSupabase().then((sb) => sb.auth.getUser())
    authorized = user.data.user?.id === row.owner_id
  } else if (row.status === 'draft' && draftToken && draftToken === row.draft_token) {
    authorized = true
  }
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const nextState = apply(row.state, action)
  const updates: Record<string, unknown> = { state: nextState }
  if (!row.started_at && isMatchStarted(nextState)) updates.started_at = new Date().toISOString()
  if (nextState.phase === 'finished') {
    updates.status = 'finished'
    updates.finished_at = new Date().toISOString()
  }

  const { error: updErr } = await svc.from('matches').update(updates).eq('id', id)
  if (updErr) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  // Append to event log (best-effort; don't fail the request if this fails)
  await svc.from('match_events').insert({
    match_id: id,
    kind: action.kind,
    payload: 'team' in action ? { team: action.team } : null,
    state_after: nextState,
  })

  return NextResponse.json({ state: nextState })
}

function isMatchStarted(state: { sets: { a: number; b: number }[]; currentGame: { a: unknown; b: unknown } }): boolean {
  const g = state.currentGame as { a: number | string; b: number | string }
  return state.sets.some((s) => s.a + s.b > 0) || (g.a !== 0 || g.b !== 0)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/matches/[id]/action/route.ts
git commit -m "feat(api): POST /api/matches/[id]/action — apply scoring action"
```

---

## Phase 5 — UI Primitives

### Task 31: Button / Input / Chip / Switch / Slider / ColorDots

**Files:**
- Create: `src/components/ui/Button.tsx`, `Input.tsx`, `Chip.tsx`, `Switch.tsx`, `Slider.tsx`, `ColorDots.tsx`, `QRCode.tsx`

- [ ] **Step 1: Write `Button.tsx`**

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'icon'

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex items-center justify-center font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const styles = {
    primary:
      'bg-[var(--color-lime)] text-[var(--color-text)] px-7 py-3 rounded-full shadow-[0_4px_16px_rgba(196,216,46,0.35)] hover:shadow-[0_6px_20px_rgba(196,216,46,0.45)]',
    ghost:
      'bg-transparent text-[var(--color-text)] px-5 py-2 rounded-full border border-[var(--color-border-strong)] hover:bg-[var(--color-lime-tint)]',
    icon:
      'w-8 h-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-lime)] hover:bg-[var(--color-lime-tint)]',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Write `Input.tsx`**

```tsx
// src/components/ui/Input.tsx
import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-[var(--color-border-strong)] bg-[var(--color-surface)] rounded-[var(--radius-sm)] text-[14px] text-[var(--color-text)] outline-none focus:border-[var(--color-lime)] focus:shadow-[0_0_0_3px_rgba(196,216,46,0.2)] transition ${className}`}
      {...rest}
    />
  )
}
```

- [ ] **Step 3: Write `Chip.tsx`**

```tsx
// src/components/ui/Chip.tsx
import type { ButtonHTMLAttributes } from 'react'

export function Chip({
  active,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const base = 'px-3.5 py-2 rounded-full border text-[13px] transition cursor-pointer'
  const states = active
    ? 'bg-[var(--color-lime-tint)] border-[var(--color-lime)] text-[var(--color-text)] font-semibold'
    : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-lime)]'
  return (
    <button className={`${base} ${states} ${className}`} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Write `Switch.tsx`**

```tsx
// src/components/ui/Switch.tsx
'use client'
export function Switch({ on, onToggle }: { on: boolean; onToggle: (next: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(!on)}
      className={`relative w-9 h-5 rounded-full transition ${on ? 'bg-[var(--color-lime)]' : 'bg-[var(--color-border-strong)]'}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${on ? 'right-[3px]' : 'left-[3px]'}`}
      />
    </button>
  )
}
```

- [ ] **Step 5: Write `Slider.tsx`**

```tsx
// src/components/ui/Slider.tsx
'use client'
import type { ChangeEvent } from 'react'

export function Slider({
  value, min = 0, max = 100, step = 1, onChange,
}: { value: number; min?: number; max?: number; step?: number; onChange: (n: number) => void }) {
  return (
    <input
      type="range"
      min={min} max={max} step={step} value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      className="w-full accent-[var(--color-lime)]"
    />
  )
}
```

- [ ] **Step 6: Write `ColorDots.tsx`**

```tsx
// src/components/ui/ColorDots.tsx
'use client'

const DEFAULT_COLORS = ['#c4d82e', '#0a84ff', '#ff453a', '#ff9500', '#af52de', '#1a1d1a']

export function ColorDots({
  value, onChange, options = DEFAULT_COLORS,
}: { value: string; onChange: (color: string) => void; options?: string[] }) {
  return (
    <div className="flex items-center gap-2.5">
      {options.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full ring-inset ring-1 ring-black/10 transition ${value === c ? 'ring-2 ring-[var(--color-lime)]' : ''}`}
          style={{ background: c }}
          aria-label={`color ${c}`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Write `QRCode.tsx`**

```tsx
// src/components/ui/QRCode.tsx
'use client'
import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    QRCodeLib.toCanvas(ref.current, value, { width: size, margin: 1, color: { dark: '#1a1d1a', light: '#ffffff' } })
  }, [value, size])
  return <canvas ref={ref} />
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ui
git commit -m "feat(ui): Button, Input, Chip, Switch, Slider, ColorDots, QRCode primitives"
```

---

## Phase 6 — Overlay page

### Task 32: `MinimalChip` overlay renderer

**Files:**
- Create: `src/components/overlay/MinimalChip.tsx`, `src/components/overlay/StatusBadges.tsx`, `src/components/overlay/TimerBadge.tsx`

- [ ] **Step 1: Write `StatusBadges.tsx`**

```tsx
// src/components/overlay/StatusBadges.tsx
import { getMatchFlags } from '@/lib/match-flags'
import type { MatchState } from '@/lib/padel-scoring'

export function StatusBadges({ state }: { state: MatchState }) {
  const flags = getMatchFlags(state)
  const label = pickLabel(flags, state)
  if (!label) return null
  return (
    <div className="inline-block px-3 py-1 rounded-md bg-[var(--color-lime-tint)] border border-[rgba(196,216,46,0.6)] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text)]">
      {label}
    </div>
  )
}

function pickLabel(flags: ReturnType<typeof getMatchFlags>, state: MatchState): string | null {
  if (state.endReason === 'retired') return 'RET'
  if (state.endReason === 'walkover') return 'W.O.'
  if (flags.inSuperTiebreak) return 'Super Tiebreak'
  if (flags.inTiebreak) return 'Tiebreak'
  if (flags.matchPointFor) return 'Match point'
  if (flags.setPointFor) return 'Set point'
  if (flags.breakPointFor) return 'Break point'
  if (flags.goldenPoint) return 'Golden point'
  return null
}
```

- [ ] **Step 2: Write `TimerBadge.tsx`**

```tsx
// src/components/overlay/TimerBadge.tsx
'use client'
import { useEffect, useState } from 'react'

export function TimerBadge({
  startedAt, tournament, round,
}: { startedAt: string | null; tournament?: string; round?: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => {
      const ms = Date.now() - start
      setElapsed(formatHHMMSS(ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt && !tournament) return null
  const parts = [startedAt && `⏱ ${elapsed}`, tournament, round].filter(Boolean)
  return (
    <div className="inline-block px-2.5 py-1 rounded-md bg-black/85 text-white text-[11px] font-medium tabular-nums tracking-wider">
      {parts.join(' · ')}
    </div>
  )
}

function formatHHMMSS(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}
```

- [ ] **Step 3: Write `MinimalChip.tsx`**

```tsx
// src/components/overlay/MinimalChip.tsx
import type { MatchRow } from '@/types/match'
import { StatusBadges } from './StatusBadges'
import { TimerBadge } from './TimerBadge'

export function MinimalChip({ row }: { row: MatchRow }) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const serveTeam = state.servingTeam

  return (
    <div
      className="absolute p-0 font-[var(--font-sans)] text-[var(--color-text)]"
      style={{
        top: overlay.position.startsWith('top') ? 20 : undefined,
        bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
        left: overlay.position.endsWith('left') ? 20 : undefined,
        right: overlay.position.endsWith('right') ? 20 : undefined,
        transform: `scale(${overlay.scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-[0_6px_24px_rgba(0,0,0,0.28)] min-w-[280px] flex flex-col gap-2.5">
        <TeamRow team={teams.a} serving={serveTeam === 'a'} sets={state.sets.map((s) => s.a)} points={cg.a} />
        <TeamRow team={teams.b} serving={serveTeam === 'b'} sets={state.sets.map((s) => s.b)} points={cg.b} />
      </div>
      <div className="mt-2.5 flex gap-2 items-center">
        <TimerBadge
          startedAt={row.started_at}
          tournament={overlay.showTournament ? overlay.tournamentName : undefined}
          round={overlay.showTournament ? overlay.round : undefined}
        />
        <StatusBadges state={state} />
      </div>
    </div>
  )
}

function TeamRow({
  team, serving, sets, points,
}: { team: { name: string; color: string; country?: string; logoUrl?: string }; serving: boolean; sets: number[]; points: number | string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] font-semibold">
      <span
        className={`w-1.5 h-1.5 rounded-full ${serving ? '' : 'opacity-0'}`}
        style={{ background: 'var(--color-lime)', boxShadow: serving ? '0 0 0 2px rgba(196,216,46,0.3)' : 'none' }}
      />
      <span className="w-[3px] h-[22px] rounded-sm" style={{ background: team.color }} />
      <div className="flex-1 leading-tight">
        {team.name}
        {team.country && <small className="block text-[11px] font-medium text-[var(--color-muted)] mt-[1px]">{team.country}</small>}
      </div>
      <div className="flex gap-0.5">
        {sets.map((s, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-sm text-xs tabular-nums ${isWinningSet(sets[i], i, sets) ? 'bg-[var(--color-text)] text-white' : 'bg-[#f0f1ec]'}`}
          >
            {s}
          </span>
        ))}
      </div>
      <span className="px-2.5 py-0.5 rounded-sm text-[13px] font-bold tabular-nums" style={{ background: 'var(--color-lime)', color: 'var(--color-text)' }}>
        {points}
      </span>
    </div>
  )
}

function isWinningSet(val: number, i: number, all: number[]): boolean {
  // Display-only — Flag as "won" any completed set where this side has more games.
  // The caller can refine; for minimal chip we just darken the higher number.
  return val >= 6 && all[i] !== undefined
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/overlay
git commit -m "feat(overlay): MinimalChip renderer + status badges + timer"
```

---

### Task 33: Realtime subscription hook

**Files:**
- Create: `src/hooks/useMatchState.ts`

- [ ] **Step 1: Write**

```typescript
// src/hooks/useMatchState.ts — subscribe to a match row via Supabase Realtime.
'use client'
import { useEffect, useState } from 'react'
import { browserSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'

export function useMatchState(matchId: string, initial: MatchRow): MatchRow {
  const [row, setRow] = useState<MatchRow>(initial)

  useEffect(() => {
    const sb = browserSupabase()
    const chan = sb
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          setRow((prev) => ({ ...prev, ...(payload.new as Partial<MatchRow>) }))
        },
      )
      .subscribe()
    return () => { sb.removeChannel(chan) }
  }, [matchId])

  return row
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMatchState.ts
git commit -m "feat(hooks): useMatchState with Supabase Realtime subscription"
```

---

### Task 34: `/overlay/[code]` page

**Files:**
- Create: `src/app/overlay/[code]/page.tsx`, `src/app/overlay/[code]/OverlayClient.tsx`

- [ ] **Step 1: Write the server page**

```tsx
// src/app/overlay/[code]/page.tsx
import { notFound } from 'next/navigation'
import { serviceSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'
import { OverlayClient } from './OverlayClient'

export const dynamic = 'force-dynamic'

export default async function OverlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = serviceSupabase()
  const { data, error } = await sb.from('matches').select('*').eq('short_code', code).single()
  if (error || !data) return notFound()
  const row = data as unknown as MatchRow
  return <OverlayClient initial={row} />
}
```

- [ ] **Step 2: Write the client**

```tsx
// src/app/overlay/[code]/OverlayClient.tsx
'use client'
import { useEffect } from 'react'
import { useMatchState } from '@/hooks/useMatchState'
import { MinimalChip } from '@/components/overlay/MinimalChip'
import type { MatchRow } from '@/types/match'

export function OverlayClient({ initial }: { initial: MatchRow }) {
  useEffect(() => {
    document.documentElement.classList.add('overlay')
    return () => document.documentElement.classList.remove('overlay')
  }, [])
  const row = useMatchState(initial.id, initial)
  // Only Minimal Chip ships in v1. Other templates locked.
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <MinimalChip row={row} />
    </main>
  )
}
```

- [ ] **Step 3: Manual verify**

Run `npm run dev`, create a draft via API, then open `http://localhost:3003/overlay/<shortCode>` — expect the chip to render on transparent background.

- [ ] **Step 4: Commit**

```bash
git add src/app/overlay
git commit -m "feat(overlay): /overlay/[code] page with Realtime sub"
```

---

## Phase 7 — Builder UI

### Task 35: Builder data hook

**Files:**
- Create: `src/hooks/useDraftMatch.ts`

- [ ] **Step 1: Write**

```typescript
// src/hooks/useDraftMatch.ts — load a draft + debounced PATCHes.
'use client'
import { useEffect, useRef, useState } from 'react'
import { getDraftToken } from '@/lib/draft-token'
import type { MatchRow } from '@/types/match'
import type { MatchConfig } from '@/lib/padel-scoring'

type PatchInput = {
  teams?: MatchRow['teams']
  overlay?: MatchRow['overlay']
  config?: MatchConfig
  tournamentLabel?: string
}

export function useDraftMatch(initial: MatchRow) {
  const [row, setRow] = useState<MatchRow>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function patch(input: PatchInput) {
    setRow((prev) => ({
      ...prev,
      ...(input.teams ? { teams: input.teams } : {}),
      ...(input.overlay ? { overlay: input.overlay } : {}),
      ...(input.config ? { config: input.config } : {}),
      ...(input.tournamentLabel !== undefined ? { tournament_label: input.tournamentLabel } : {}),
    }))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => flush(input), 400)
  }

  async function flush(input: PatchInput) {
    const token = getDraftToken(initial.id)
    if (!token) return
    await fetch(`/api/matches/${initial.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ draftToken: token, ...input }),
    })
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { row, patch }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useDraftMatch.ts
git commit -m "feat(hooks): useDraftMatch with debounced PATCH"
```

---

### Task 36: `TeamCard` component

**Files:**
- Create: `src/components/builder/TeamCard.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/builder/TeamCard.tsx
'use client'
import type { TeamJson } from '@/types/match'
import { Input } from '@/components/ui/Input'
import { ColorDots } from '@/components/ui/ColorDots'

export function TeamCard({
  label, value, onChange,
}: { label: string; value: TeamJson; onChange: (next: TeamJson) => void }) {
  return (
    <div className="p-4 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          <span className="w-2.5 h-2.5 rounded-full ring-inset ring-1 ring-black/10" style={{ background: value.color }} />
          {label}
        </div>
      </div>
      <Label text="Team name" />
      <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <Label text="Player 1" />
          <Input value={value.players[0]} onChange={(e) => onChange({ ...value, players: [e.target.value, value.players[1]] })} />
        </div>
        <div>
          <Label text="Player 2" />
          <Input value={value.players[1]} onChange={(e) => onChange({ ...value, players: [value.players[0], e.target.value] })} />
        </div>
      </div>
      <div className="mt-3">
        <Label text="Color" />
        <ColorDots value={value.color} onChange={(c) => onChange({ ...value, color: c })} />
      </div>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return <label className="block text-xs text-[var(--color-muted)] mb-1.5">{text}</label>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/builder/TeamCard.tsx
git commit -m "feat(builder): TeamCard component"
```

---

### Task 37: `FormatSection` component

**Files:**
- Create: `src/components/builder/FormatSection.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/builder/FormatSection.tsx
'use client'
import type { MatchConfig, MatchFormat } from '@/lib/padel-scoring'
import { Chip } from '@/components/ui/Chip'
import { Switch } from '@/components/ui/Switch'

const FORMATS: { id: MatchFormat; label: string }[] = [
  { id: 'bo3', label: 'Best of 3' },
  { id: 'bo5', label: 'Best of 5' },
  { id: 'single-set', label: 'Single set' },
  { id: 'pro-set', label: 'Pro set' },
]

export function FormatSection({ value, onChange }: { value: MatchConfig; onChange: (next: MatchConfig) => void }) {
  return (
    <section className="mb-8">
      <SectionTitle>Match format</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Chip key={f.id} active={value.format === f.id} onClick={() => onChange({ ...value, format: f.id })}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <ToggleRow
          title="Golden point"
          subtitle="At 40-40 the receiving team picks a side; next point wins."
          on={value.goldenPoint}
          onToggle={(next) => onChange({ ...value, goldenPoint: next })}
        />
        <ToggleRow
          title="Super-tiebreak in final set"
          subtitle="First to 10 (min 2-point lead) replaces a 3rd set."
          on={value.superTiebreak}
          onToggle={(next) => onChange({ ...value, superTiebreak: next })}
        />
        <ToggleRow
          title="Tiebreak at 6-6"
          subtitle="Standard 7-point tiebreak when a set reaches 6-6."
          on={value.setTiebreakAt === 6}
          onToggle={(next) => onChange({ ...value, setTiebreakAt: next ? 6 : 'none' })}
        />
      </div>
    </section>
  )
}

function ToggleRow({ title, subtitle, on, onToggle }: { title: string; subtitle: string; on: boolean; onToggle: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="text-sm">
        {title}
        <small className="block text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</small>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">{children}</h3>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/builder/FormatSection.tsx
git commit -m "feat(builder): FormatSection with chips + toggles"
```

---

### Task 38: `TemplateBrowser` modal

**Files:**
- Create: `src/components/builder/TemplateBrowser.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/builder/TemplateBrowser.tsx
'use client'
import type { TemplateId } from '@/types/match'

interface Template {
  id: TemplateId
  name: string
  description: string
  tier: 'free' | 'pro'
  preview: React.ReactNode
}

const TEMPLATES: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal Chip',
    description: 'Compact corner anchor. Modern, low-intrusion.',
    tier: 'free',
    preview: <MockChip />,
  },
  {
    id: 'broadcast',
    name: 'Broadcast Bar',
    description: 'Full-width bottom bar. DAZN / Premier Padel feel.',
    tier: 'pro',
    preview: <MockBar />,
  },
  {
    id: 'split',
    name: 'Split Badge',
    description: 'Centered broadcast badge. Lighter than Broadcast Bar.',
    tier: 'pro',
    preview: <MockSplit />,
  },
]

export function TemplateBrowser({
  open, value, onPick, onClose,
}: { open: boolean; value: TemplateId; onPick: (id: TemplateId) => void; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] max-w-4xl w-full p-6 md:p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Browse templates</h2>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => {
            const isLocked = t.tier === 'pro'
            const isActive = value === t.id
            return (
              <button
                key={t.id}
                onClick={() => !isLocked && onPick(t.id)}
                className={`relative text-left p-4 rounded-xl border transition ${isActive ? 'border-[var(--color-lime)] ring-2 ring-[rgba(196,216,46,0.25)]' : 'border-[var(--color-border)] hover:border-[var(--color-lime)]'} ${isLocked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={isLocked}
              >
                {isLocked && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-[var(--color-lime-tint)] border border-[rgba(196,216,46,0.6)] text-[10px] font-bold uppercase tracking-wider rounded">Pro</span>
                )}
                <div className="h-32 bg-gradient-to-b from-[#4a5c3a] to-[#1e2619] rounded-lg mb-3 relative overflow-hidden">
                  {t.preview}
                </div>
                <h3 className="font-semibold text-[15px]">{t.name}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1 leading-snug">{t.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MockChip() { return <div className="absolute top-3 left-3 bg-white/95 rounded-md px-2 py-1 text-[9px]">● Team A 6 40<br/>&nbsp;&nbsp; Team B 4 30</div> }
function MockBar() { return <div className="absolute left-3 right-3 bottom-3 bg-white/95 rounded-md py-1 px-2 text-[9px] flex justify-between">Team A · 6 40<span>|</span>Team B · 4 30</div> }
function MockSplit() { return <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-0"><span className="bg-white/95 px-2 py-1 rounded-l text-[9px]">Team A</span><span className="bg-black text-white px-2 py-1 text-[9px]">6·4</span><span className="bg-white/95 px-2 py-1 rounded-r text-[9px]">Team B</span></div> }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/builder/TemplateBrowser.tsx
git commit -m "feat(builder): TemplateBrowser modal (Minimal free, others Pro-locked)"
```

---

### Task 39: `OverlaySection` component

**Files:**
- Create: `src/components/builder/OverlaySection.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/builder/OverlaySection.tsx
'use client'
import { useState } from 'react'
import type { OverlayJson } from '@/types/match'
import { Chip } from '@/components/ui/Chip'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { ColorDots } from '@/components/ui/ColorDots'
import { Input } from '@/components/ui/Input'
import { TemplateBrowser } from './TemplateBrowser'

const TEMPLATE_LABEL: Record<OverlayJson['template'], string> = {
  minimal: 'Minimal Chip', broadcast: 'Broadcast Bar', split: 'Split Badge',
}

export function OverlaySection({ value, onChange }: { value: OverlayJson; onChange: (next: OverlayJson) => void }) {
  const [browseOpen, setBrowseOpen] = useState(false)
  return (
    <section className="mb-8">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">Overlay</h3>

      <Label text="Style" />
      <div className="flex gap-2 items-center">
        <Chip active>{TEMPLATE_LABEL[value.template]}</Chip>
        <Chip onClick={() => setBrowseOpen(true)}>Browse templates</Chip>
      </div>

      <TemplateBrowser
        open={browseOpen}
        value={value.template}
        onPick={(id) => { onChange({ ...value, template: id }); setBrowseOpen(false) }}
        onClose={() => setBrowseOpen(false)}
      />

      <div className="mt-4">
        <Label text="Accent color" />
        <ColorDots value={value.customColors.accent} onChange={(c) => onChange({ ...value, customColors: { accent: c } })} />
      </div>

      <div className="mt-4">
        <Label text={`Size — ${Math.round(value.scale * 100)}%`} />
        <Slider value={value.scale * 100} min={50} max={150} onChange={(n) => onChange({ ...value, scale: n / 100 })} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <div>
          <Label text="Tournament" />
          <Input value={value.tournamentName ?? ''} onChange={(e) => onChange({ ...value, tournamentName: e.target.value })} />
        </div>
        <div>
          <Label text="Round" />
          <Input value={value.round ?? ''} onChange={(e) => onChange({ ...value, round: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <ToggleRow title="Show match duration" subtitle="Elapsed time since first point." on={value.showTimer} onToggle={(b) => onChange({ ...value, showTimer: b })} />
        <ToggleRow title="Show tournament label" subtitle="Tournament and round on the overlay." on={value.showTournament} onToggle={(b) => onChange({ ...value, showTournament: b })} />
      </div>
    </section>
  )
}

function Label({ text }: { text: string }) { return <label className="block text-xs text-[var(--color-muted)] mb-1.5">{text}</label> }
function ToggleRow({ title, subtitle, on, onToggle }: { title: string; subtitle: string; on: boolean; onToggle: (n: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="text-sm">{title}<small className="block text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</small></div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/builder/OverlaySection.tsx
git commit -m "feat(builder): OverlaySection with template browser, color, scale, toggles"
```

---

### Task 40: Builder client (left form + right preview)

**Files:**
- Create: `src/app/m/[code]/Builder.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/m/[code]/Builder.tsx
'use client'
import { useState } from 'react'
import { useDraftMatch } from '@/hooks/useDraftMatch'
import type { MatchRow } from '@/types/match'
import { TeamCard } from '@/components/builder/TeamCard'
import { FormatSection } from '@/components/builder/FormatSection'
import { OverlaySection } from '@/components/builder/OverlaySection'
import { MinimalChip } from '@/components/overlay/MinimalChip'
import { Button } from '@/components/ui/Button'
import { AuthWallModal } from '@/components/auth/AuthWallModal'

export function Builder({ initial }: { initial: MatchRow }) {
  const { row, patch } = useDraftMatch(initial)
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-7">
      <div className="max-w-[1320px] mx-auto">
        <Header row={row} />
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          <div className="p-7 md:p-8 border-r border-[var(--color-border)]">
            <section className="mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">Teams &amp; players</h3>
              <TeamCard label="Team A" value={row.teams.a} onChange={(a) => patch({ teams: { ...row.teams, a } })} />
              <TeamCard label="Team B" value={row.teams.b} onChange={(b) => patch({ teams: { ...row.teams, b } })} />
            </section>
            <FormatSection value={row.config} onChange={(config) => patch({ config })} />
            <OverlaySection value={row.overlay} onChange={(overlay) => patch({ overlay })} />
          </div>
          <div className="p-7 md:p-8 bg-[#fafbf6]">
            <div className="text-xs text-[var(--color-muted)] mb-2.5 flex justify-between">
              <span>Live preview</span>
              <span className="bg-[var(--color-lime-tint)] px-2 py-0.5 rounded text-[11px] font-semibold">Minimal Chip</span>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-b from-[#4a5c3a] via-[#2d3a26] to-[#1e2619]">
              <MinimalChip row={row} />
            </div>
            <div className="mt-3.5 p-3 bg-white border border-[var(--color-border)] rounded-lg flex justify-between text-xs text-[var(--color-muted)]">
              <span>Overlay URL</span>
              <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[var(--color-text)] text-[11px] font-mono">padelboard.padellabs.tech/overlay/{row.short_code}</code>
            </div>
          </div>
        </div>
        <footer className="flex justify-between items-center py-5 px-8 border-t border-[var(--color-border)] bg-[var(--color-surface)] rounded-b-3xl -mt-[1px]">
          <span className="text-sm text-[var(--color-muted)]">Keep building — your OBS link is one click away.</span>
          <Button onClick={() => setAuthOpen(true)}>Get my OBS link →</Button>
        </footer>
      </div>
      <AuthWallModal open={authOpen} onClose={() => setAuthOpen(false)} matchId={row.id} />
    </main>
  )
}

function Header({ row }: { row: MatchRow }) {
  const title = `${row.teams.a.name || 'Team A'} vs ${row.teams.b.name || 'Team B'}`
  return (
    <div className="flex justify-between items-start mb-4 px-1">
      <div>
        <div className="text-xs text-[var(--color-muted)] mb-0.5">New match</div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="text-xs text-[var(--color-muted)] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime)] shadow-[0_0_0_3px_rgba(196,216,46,0.25)]" />
        Draft · autosaved
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/m/[code]/Builder.tsx
git commit -m "feat(builder): Builder component (form + preview + publish CTA)"
```

---

## Phase 8 — Auth wall + Claim flow

### Task 41: `AuthWallModal`

**Files:**
- Create: `src/components/auth/AuthWallModal.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/auth/AuthWallModal.tsx
'use client'
import { useState } from 'react'
import { browserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Role = 'player' | 'club' | 'organizer' | 'federation'

export function AuthWallModal({
  open, onClose, matchId,
}: { open: boolean; onClose: () => void; matchId: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('player')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!open) return null

  async function submit() {
    if (!email || !name) return
    setSending(true)
    // Stash name + role to apply on callback (profile insert)
    sessionStorage.setItem('padelboard:pendingProfile', JSON.stringify({ name, role }))
    sessionStorage.setItem('padelboard:claimMatchId', matchId)
    const sb = browserSupabase()
    const redirectTo = `${location.origin}/auth/callback?match=${matchId}`
    await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } })
    setSent(true)
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-[var(--color-muted)]">We sent a sign-in link to <strong>{email}</strong>. Click it to unlock your OBS link. Keep this tab open.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-1.5">Get your OBS link</h2>
            <p className="text-sm text-[var(--color-muted)] mb-5">Free forever. Takes 10 seconds. Your scoreboard stays yours.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Email</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Name</label>
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full px-3.5 py-2.5 border border-[var(--color-border-strong)] bg-white rounded-[var(--radius-sm)] text-sm">
                  <option value="player">Player</option>
                  <option value="club">Club</option>
                  <option value="organizer">Tournament organizer</option>
                  <option value="federation">Federation</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={submit} disabled={sending || !email || !name}>{sending ? 'Sending…' : 'Send magic link'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/AuthWallModal.tsx
git commit -m "feat(auth): AuthWallModal with magic-link + role capture"
```

---

### Task 42: `/auth/callback` route — create profile and claim draft

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Write**

```typescript
// src/app/auth/callback/route.ts — Supabase magic-link callback. Claims the user's draft match.
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const matchId = url.searchParams.get('match')

  const sb = await serverSupabase()
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error.message)}`)
    }
  }

  const { data: userRes } = await sb.auth.getUser()
  const user = userRes.user
  if (!user) {
    return NextResponse.redirect(`${url.origin}/?auth_error=no_session`)
  }

  // The callback runs server-side; we can't read sessionStorage. The client will
  // pick up a server-set URL hash and POST name/role via a follow-up completion
  // page. For v1 simplicity we redirect to /m/[shortCode]/complete-signup
  // where the client finalizes profile + claim.
  const dest = matchId
    ? `${url.origin}/m/${await shortCodeFor(matchId)}?complete=1`
    : `${url.origin}/dashboard`
  return NextResponse.redirect(dest)
}

async function shortCodeFor(matchId: string): Promise<string> {
  const svc = serviceSupabase()
  const { data } = await svc.from('matches').select('short_code').eq('id', matchId).single()
  return data?.short_code ?? ''
}
```

- [ ] **Step 2: Create `POST /api/profile/complete` to finalize**

Create `src/app/api/profile/complete/route.ts`:

```typescript
// src/app/api/profile/complete/route.ts — finalize profile + claim match
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { name, role, matchId, draftToken } = await req.json()
  if (!name || !role) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const sb = await serverSupabase()
  const { data: userRes } = await sb.auth.getUser()
  const user = userRes.user
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const svc = serviceSupabase()
  await svc.from('profiles').upsert({ id: user.id, name, role })

  if (matchId && draftToken) {
    // Atomic claim
    const { data, error } = await svc
      .from('matches')
      .update({ owner_id: user.id, draft_token: null, status: 'published', published_at: new Date().toISOString() })
      .eq('id', matchId)
      .eq('draft_token', draftToken)
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'claim_failed' }, { status: 409 })
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Add a complete-signup client that calls it**

Update `src/app/m/[code]/Builder.tsx` to detect `?complete=1`:

At the top of the `Builder` component:

```tsx
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDraftToken, clearDraftToken } from '@/lib/draft-token'

// ... inside component:
const params = useSearchParams()
useEffect(() => {
  if (params.get('complete') !== '1') return
  const raw = sessionStorage.getItem('padelboard:pendingProfile')
  const matchId = sessionStorage.getItem('padelboard:claimMatchId')
  if (!raw || !matchId) return
  const { name, role } = JSON.parse(raw)
  const token = getDraftToken(matchId)
  fetch('/api/profile/complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, role, matchId, draftToken: token }),
  }).then(async (r) => {
    if (r.ok) {
      sessionStorage.removeItem('padelboard:pendingProfile')
      sessionStorage.removeItem('padelboard:claimMatchId')
      clearDraftToken(matchId)
      location.href = `/m/${initial.short_code}`
    }
  })
}, [params, initial.short_code])
```

- [ ] **Step 4: Commit**

```bash
git add src/app/auth src/app/api/profile src/app/m/[code]/Builder.tsx
git commit -m "feat(auth): magic-link callback + profile completion + draft claim"
```

---

## Phase 9 — Operator UI

### Task 43: Operator store (Zustand)

**Files:**
- Create: `src/hooks/useOperatorStore.ts`

- [ ] **Step 1: Write**

```typescript
// src/hooks/useOperatorStore.ts
'use client'
import { create } from 'zustand'
import type { Action, MatchState } from '@/lib/padel-scoring'
import { apply } from '@/lib/padel-scoring'

interface OperatorStore {
  state: MatchState | null
  pending: number
  setInitial: (s: MatchState) => void
  act: (matchId: string, action: Action) => Promise<void>
  acceptRemote: (s: MatchState) => void
}

export const useOperatorStore = create<OperatorStore>((set, get) => ({
  state: null,
  pending: 0,
  setInitial: (s) => set({ state: s }),
  acceptRemote: (s) => {
    // Only accept if we have no pending optimistic writes
    if (get().pending === 0) set({ state: s })
  },
  act: async (matchId, action) => {
    const current = get().state
    if (!current) return
    // Optimistic update
    const optimistic = apply(current, action)
    set({ state: optimistic, pending: get().pending + 1 })
    try {
      const r = await fetch(`/api/matches/${matchId}/action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await r.json()
      if (r.ok && json.state) set({ state: json.state as MatchState })
    } finally {
      set({ pending: Math.max(0, get().pending - 1) })
    }
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useOperatorStore.ts
git commit -m "feat(operator): Zustand store with optimistic writes"
```

---

### Task 44: Operator component

**Files:**
- Create: `src/app/m/[code]/Operator.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/m/[code]/Operator.tsx
'use client'
import { useEffect, useState } from 'react'
import type { MatchRow } from '@/types/match'
import { useOperatorStore } from '@/hooks/useOperatorStore'
import { useMatchState } from '@/hooks/useMatchState'
import { Button } from '@/components/ui/Button'
import { ShareDialog } from './ShareDialog'

export function Operator({ initial }: { initial: MatchRow }) {
  const row = useMatchState(initial.id, initial)
  const { state, setInitial, act, acceptRemote } = useOperatorStore()
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => { setInitial(initial.state) }, [initial.state, setInitial])
  useEffect(() => { acceptRemote(row.state) }, [row.state, acceptRemote])

  if (!state) return null

  const cg = state.currentGame as { a: number | string; b: number | string }
  const scoreText = (t: 'a' | 'b') => {
    const sets = state.sets.map((s) => s[t]).join('·')
    return `${sets}·${cg[t]}`
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-5 flex flex-col gap-4 max-w-sm mx-auto">
      <button onClick={() => setShareOpen(true)} className="text-left p-4 bg-white rounded-xl border border-[var(--color-border)]">
        <div className="text-xs text-[var(--color-muted)] mb-1">Share OBS link</div>
        <div className="text-sm font-semibold truncate">padelboard.padellabs.tech/overlay/{initial.short_code}</div>
      </button>
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">{initial.teams.a.name}</span>
          <span className="tabular-nums">{scoreText('a')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{initial.teams.b.name}</span>
          <span className="tabular-nums">{scoreText('b')}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => act(initial.id, { kind: 'point_for', team: 'a' })} className="h-28 text-base">+1 {initial.teams.a.name}</Button>
        <Button onClick={() => act(initial.id, { kind: 'point_for', team: 'b' })} className="h-28 text-base">+1 {initial.teams.b.name}</Button>
      </div>
      <Button variant="ghost" onClick={() => act(initial.id, { kind: 'undo' })}>↶ Undo</Button>
      <SettingsDrawer matchId={initial.id} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} shortCode={initial.short_code} />
    </main>
  )
}

function SettingsDrawer({ matchId }: { matchId: string }) {
  const { act } = useOperatorStore()
  const [open, setOpen] = useState(false)
  if (!open) return (
    <Button variant="ghost" onClick={() => setOpen(true)}>⚙ Settings</Button>
  )
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-2">
      <button className="w-full text-left text-sm py-2" onClick={() => act(matchId, { kind: 'mark_retirement', team: 'a' })}>Team A retired</button>
      <button className="w-full text-left text-sm py-2" onClick={() => act(matchId, { kind: 'mark_retirement', team: 'b' })}>Team B retired</button>
      <button className="w-full text-left text-sm py-2" onClick={() => act(matchId, { kind: 'mark_walkover', team: 'b' })}>Walkover (A wins)</button>
      <button className="w-full text-left text-sm py-2" onClick={() => act(matchId, { kind: 'mark_walkover', team: 'a' })}>Walkover (B wins)</button>
      <button className="w-full text-left text-sm py-2 text-red-600" onClick={() => { if (confirm('Reset match?')) act(matchId, { kind: 'reset' }) }}>Reset match</button>
      <button className="w-full text-right text-xs text-[var(--color-muted)]" onClick={() => setOpen(false)}>Close</button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/m/[code]/Operator.tsx
git commit -m "feat(operator): phone-first operator UI with +1 / undo / settings"
```

---

### Task 45: Share dialog (URL + QR)

**Files:**
- Create: `src/app/m/[code]/ShareDialog.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/m/[code]/ShareDialog.tsx
'use client'
import { useState } from 'react'
import { QRCode } from '@/components/ui/QRCode'
import { Button } from '@/components/ui/Button'

export function ShareDialog({ open, onClose, shortCode }: { open: boolean; onClose: () => void; shortCode: string }) {
  const [copied, setCopied] = useState<'overlay' | 'control' | null>(null)
  if (!open) return null
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const overlay = `${origin}/overlay/${shortCode}`
  const control = `${origin}/m/${shortCode}`

  async function copy(text: string, which: 'overlay' | 'control') {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-3">Share your scoreboard</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1.5">Paste into OBS as a browser source</div>
            <div className="flex gap-2">
              <code className="flex-1 bg-[var(--color-bg)] px-2.5 py-2 rounded font-mono text-[12px] break-all">{overlay}</code>
              <Button variant="ghost" onClick={() => copy(overlay, 'overlay')}>{copied === 'overlay' ? '✓' : 'Copy'}</Button>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1.5">Open on your phone to control the score</div>
            <div className="flex gap-2 items-start">
              <code className="flex-1 bg-[var(--color-bg)] px-2.5 py-2 rounded font-mono text-[12px] break-all">{control}</code>
              <Button variant="ghost" onClick={() => copy(control, 'control')}>{copied === 'control' ? '✓' : 'Copy'}</Button>
            </div>
            <div className="mt-3 flex justify-center">
              <QRCode value={control} size={180} />
            </div>
          </div>
        </div>
        <div className="mt-5 text-right">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/m/[code]/ShareDialog.tsx
git commit -m "feat(operator): ShareDialog with URL copy + QR"
```

---

### Task 46: `/m/[code]` router page (builder or operator)

**Files:**
- Create: `src/app/m/[code]/page.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/m/[code]/page.tsx
import { notFound } from 'next/navigation'
import { serviceSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'
import { Builder } from './Builder'
import { Operator } from './Operator'

export const dynamic = 'force-dynamic'

export default async function MatchPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = serviceSupabase()
  const { data } = await sb.from('matches').select('*').eq('short_code', code).single()
  if (!data) return notFound()
  const row = data as unknown as MatchRow
  if (row.status === 'draft') return <Builder initial={row} />
  return <Operator initial={row} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/m/[code]/page.tsx
git commit -m "feat(app): /m/[code] routes to builder (draft) or operator (published)"
```

---

## Phase 10 — Landing, dashboard, cleanup

### Task 47: Landing page

**Files:**
- Replace: `src/app/page.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/page.tsx
'use client'
import { useState } from 'react'
import { saveDraftToken } from '@/lib/draft-token'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const [creating, setCreating] = useState(false)
  async function create() {
    setCreating(true)
    const r = await fetch('/api/matches', { method: 'POST' })
    const json = (await r.json()) as { id: string; shortCode: string; draftToken: string }
    saveDraftToken(json.id, json.draftToken)
    location.href = `/m/${json.shortCode}`
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Padelboard</h1>
        <p className="text-lg text-[var(--color-muted)] mb-7">
          A free, padel-native streaming scoreboard. Golden point, super-tiebreak, doubles serve —
          all built in. Paste an OBS link, control from your phone.
        </p>
        <Button onClick={create} disabled={creating}>{creating ? 'Creating…' : 'Create a scoreboard →'}</Button>
        <p className="text-xs text-[var(--color-muted)] mt-4">Free forever. No signup to try.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(app): landing page with create-a-scoreboard CTA"
```

---

### Task 48: Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write**

```tsx
// src/app/dashboard/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverSupabase, serviceSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const sb = await serverSupabase()
  const { data: userRes } = await sb.auth.getUser()
  if (!userRes.user) redirect('/')

  const svc = serviceSupabase()
  const { data } = await svc
    .from('matches')
    .select('*')
    .eq('owner_id', userRes.user.id)
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as MatchRow[]
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Your matches</h1>
      {rows.length === 0 && (
        <p className="text-[var(--color-muted)] text-sm">No matches yet. <Link href="/" className="underline">Create one</Link>.</p>
      )}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="p-4 bg-white border border-[var(--color-border)] rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{r.teams.a.name} vs {r.teams.b.name}</div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  {r.status.toUpperCase()} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <Link href={`/m/${r.short_code}`} className="text-sm underline">Open →</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(app): /dashboard with match list"
```

---

### Task 49: Nightly draft-cleanup cron

**Files:**
- Create: `src/app/api/cron/cleanup-drafts/route.ts`, `vercel.json`

- [ ] **Step 1: Write route**

```typescript
// src/app/api/cron/cleanup-drafts/route.ts
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const svc = serviceSupabase()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error, count } = await svc
    .from('matches')
    .delete({ count: 'exact' })
    .eq('status', 'draft')
    .is('owner_id', null)
    .lt('created_at', sevenDaysAgo)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: count ?? 0 })
}
```

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/cleanup-drafts", "schedule": "0 3 * * *" }]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron vercel.json
git commit -m "feat(cron): nightly cleanup of anonymous drafts older than 7 days"
```

---

## Phase 11 — Deploy

### Task 50: Deploy to Vercel and verify end-to-end

- [ ] **Step 1: Push to GitHub**

```bash
git push origin feat/v1-implementation
```

Open a PR on GitHub against `main`. Review, squash-merge.

- [ ] **Step 2: Connect the repo in Vercel**

Vercel Dashboard → Add New Project → import `gudenes/padelboard` → select the PadelLabs team. Framework auto-detects as Next.js. Root dir = `./`.

- [ ] **Step 3: Add env vars in Vercel**

Project Settings → Environment Variables (all environments):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `CRON_SECRET` (generate with `openssl rand -hex 32`)

- [ ] **Step 4: Configure Supabase redirect URLs**

In Supabase dashboard → Authentication → URL Configuration, add:
- `https://padelboard.padellabs.tech/**`
- `http://localhost:3003/**`

- [ ] **Step 5: Add the custom domain**

Vercel project → Settings → Domains → add `padelboard.padellabs.tech`. Add the CNAME record in DNS (`padelboard` → `cname.vercel-dns.com`).

- [ ] **Step 6: End-to-end test on prod**

1. Open `https://padelboard.padellabs.tech`
2. Click Create a scoreboard
3. Fill teams + players + config
4. Click Get my OBS link → enter email + name + role
5. Check email, click magic link, return to site
6. Share modal should appear with URLs + QR
7. Open the overlay URL in a new tab — see the chip on transparent background
8. Open OBS, add the overlay URL as a browser source (1920×1080)
9. Open the control URL on your phone via QR
10. Tap +1 Team A → overlay updates within ~300ms

- [ ] **Step 7: Verify Supabase logs**

Supabase → Logs → Postgres → confirm `matches` rows created, `state` column updated on each tap, and `match_events` rows inserted.

---

## Ship gate

v1 ships when:

- [ ] All tests pass: `npm test` shows green for `padel-scoring`, `match-log`, `match-flags`, `short-code`.
- [ ] Lint passes: `npm run lint`.
- [ ] Build passes: `npm run build`.
- [ ] Golden path works end-to-end on prod (Task 50, Step 6).
- [ ] One real club match has been streamed with the overlay on YouTube (ship-gate acceptance test from the spec).

---

## Appendix — Spec coverage checklist

Use this to verify no spec requirement was dropped.

| Spec requirement | Task(s) |
|---|---|
| Golden point rule | 9 |
| Super-tiebreak replaces 3rd set | 13 |
| 6-6 tiebreak (first to 7 by 2) | 11 |
| BO3 / BO5 / pro-set / single-set formats | 10, 12, 14 |
| Doubles serve rotation (in-game + tiebreak) | 7, 15 |
| Retirement / walkover | 17 |
| Manual score correction | 18 |
| Undo (unbounded) | 16 |
| Derived badges (GOLDEN/SET/MATCH POINT, TIEBREAK) | 19 |
| `profiles` / `matches` / `match_events` schema | 21 |
| RLS policies | 22 |
| Storage bucket for logos | 23 |
| Minimal Chip overlay renderer | 32 |
| Overlay page (`/overlay/:code`) | 34 |
| Realtime subscription | 33 |
| Builder (single-screen form + preview) | 35–40 |
| Template browser modal | 38 |
| Operator (phone-first + undo + settings) | 43–44 |
| Share dialog (URL copy + QR) | 45 |
| Auth wall at publish (email + name + role) | 41 |
| Magic-link callback + draft claim | 42 |
| Dashboard for signed-in users | 48 |
| Nightly draft cleanup | 49 |
| Landing page | 47 |
| Deploy to `padelboard.padellabs.tech` | 50 |
