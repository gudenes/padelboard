# Padelboard v1.1 Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 single-screen match builder with a 3-step onboarding wizard (Template → Players → Format), ship 3 broadcast-quality templates (Broadcast / Classic / Premier), add AI-powered palette generation from tournament logos, and expose a per-slot color customizer.

**Architecture:** New `Wizard` component at `/m/:code` for draft matches (replaces v1's Builder). Each template is a self-contained React renderer plus metadata (default colors + editable slots). The `OverlayRenderer` dispatches to the correct template component. Step transitions animate with Framer Motion; step state syncs to URL query param (`?step=N`) for resumability. Color customizer opens from Step 1 as a modal — logo uploads to Supabase Storage, server round-trips through Claude Vision for AI palette, user can override any slot.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind 4, Supabase (Storage + Auth), Anthropic SDK (Claude Vision), Framer Motion (animations), ColorThief (palette fallback), Vitest

**Spec:** [`docs/superpowers/specs/2026-04-18-padelboard-v1.1-wizard-design.md`](../specs/2026-04-18-padelboard-v1.1-wizard-design.md)

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/templates/types.ts` | `Template`, `ColorSlot`, `Colors` types |
| `src/lib/templates/merge-colors.ts` | Pure util: merge template defaults with user overrides |
| `src/lib/templates/registry.ts` | `getTemplate(id)` + `allTemplates()` |
| `src/lib/templates/broadcast.tsx` | Broadcast template: metadata + `BroadcastRenderer` component |
| `src/lib/templates/classic.tsx` | Classic template: metadata + `ClassicRenderer` component |
| `src/lib/templates/premier.tsx` | Premier template: metadata + `PremierRenderer` component |
| `src/lib/claude-palette.ts` | Server-only Claude Vision helper for palette inference |
| `src/lib/__tests__/merge-colors.test.ts` | Tests for `mergeColors` |
| `src/components/overlay/OverlayRenderer.tsx` | Dispatcher: picks renderer by `row.overlay.template`; falls back to MinimalChip for legacy |
| `src/components/wizard/Wizard.tsx` | 3-column shell + step orchestration |
| `src/components/wizard/WizardRail.tsx` | Left rail with 3-step task list |
| `src/components/wizard/WizardPreview.tsx` | Right preview panel (stage + overlay) |
| `src/components/wizard/WizardFooter.tsx` | Back / Continue footer |
| `src/components/wizard/StageCourt.tsx` | Stylized CSS padel court background |
| `src/components/wizard/Tooltip.tsx` | Hover-triggered tooltip primitive for `(i)` icons |
| `src/components/wizard/useWizardStep.ts` | Step state + URL `?step=N` sync |
| `src/components/wizard/steps/StepTemplate.tsx` | Step 1 — pick a template |
| `src/components/wizard/steps/StepPlayers.tsx` | Step 2 — enter team + player names |
| `src/components/wizard/steps/StepFormat.tsx` | Step 3 — format + rules toggles |
| `src/components/wizard/TemplateCard.tsx` | One template card in Step 1 list |
| `src/components/wizard/FormatChipWithTip.tsx` | Format chip w/ `(i)` tooltip |
| `src/components/wizard/RuleToggleWithTip.tsx` | Rule toggle row w/ `(i)` tooltip |
| `src/components/customizer/ColorCustomizerModal.tsx` | Full modal component |
| `src/components/customizer/LogoUploadZone.tsx` | Logo drag-drop + upload |
| `src/components/customizer/SlotCard.tsx` | One color slot control |
| `src/components/customizer/AIResultCard.tsx` | AI palette result + "Apply" |
| `src/app/api/logo/route.ts` | `POST /api/logo` — upload to Supabase Storage |
| `src/app/api/palette/route.ts` | `POST /api/palette` — Claude Vision palette gen |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add `motion`, `colorthief`, `@anthropic-ai/sdk` deps |
| `src/types/match.ts` | Expand `OverlayJson`: add `tournamentLogoUrl`, change `customColors` shape |
| `src/app/m/[code]/page.tsx` | Import Wizard instead of Builder for draft status |
| `src/app/overlay/[code]/OverlayClient.tsx` | Use `OverlayRenderer` instead of direct `MinimalChip` |
| `.env.local.example` | Add `ANTHROPIC_API_KEY` |

### Deleted Files (after Wizard is wired up)

| File | Reason |
|------|--------|
| `src/app/m/[code]/Builder.tsx` | Replaced by Wizard |
| `src/components/builder/TeamCard.tsx` | Replaced by StepPlayers internals |
| `src/components/builder/FormatSection.tsx` | Replaced by StepFormat |
| `src/components/builder/OverlaySection.tsx` | Merged into StepTemplate + ColorCustomizerModal |
| `src/components/builder/TemplateBrowser.tsx` | Merged into StepTemplate |

### Preserved but Deprecated

`src/components/overlay/MinimalChip.tsx` — kept for backwards-compat rendering of legacy matches with `template: 'minimal'`. Not selectable in the wizard.

---

## Phase 0 — Setup

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`
- Modify: `.env.local` (locally, not committed)

- [ ] **Step 1: Install packages**

```bash
cd /Users/GuDenes/Projects/padelboard
npm install framer-motion@^11 colorthief@^2.6.0 @anthropic-ai/sdk@^0.32.0
```

- [ ] **Step 2: Verify `package.json` dependencies section includes them**

Run: `grep -E '"(framer-motion|colorthief|@anthropic)' package.json`
Expected: three lines visible.

- [ ] **Step 3: Update `.env.local.example`**

Append to `/Users/GuDenes/Projects/padelboard/.env.local.example`:

```bash
# Claude API for AI palette generation from tournament logos
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Remind user to add ANTHROPIC_API_KEY to `.env.local` locally**

Print a message:

```
⚠️  You need to add ANTHROPIC_API_KEY=sk-ant-... to .env.local locally
before testing the /api/palette route. Get one at console.anthropic.com.
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.local.example
git commit -m "chore(v1.1): add motion, colorthief, @anthropic-ai/sdk deps"
```

---

## Phase 1 — Type Foundations

### Task 2: Update `OverlayJson` shape

**Files:**
- Modify: `src/types/match.ts`

- [ ] **Step 1: Replace the `OverlayJson` interface**

Replace the existing `OverlayJson` interface in `src/types/match.ts` with:

```ts
export type TemplateId = 'broadcast' | 'classic' | 'premier' | 'minimal'

export type SlotColors = Record<string, string>            // e.g. { bg: '#0a3d91', text: '#ffffff' }
export type CustomColors = Record<string, SlotColors>      // keyed by slot id, e.g. { playerRow: { bg, text }, ... }

export interface OverlayJson {
  template: TemplateId                                      // 'broadcast' default for new matches; 'minimal' only for legacy
  showTimer: boolean
  showTournament: boolean
  tournamentName?: string
  round?: string
  tournamentLogoUrl?: string                                // NEW — uploaded logo URL

  // BREAKING: v1 had { accent: string }. v1.1 uses per-slot map.
  // Renderers merge this over the active template's `defaults.colors`.
  customColors: CustomColors

  scale: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
```

- [ ] **Step 2: Update `defaultOverlay()` function in same file**

Replace the existing `defaultOverlay()` with:

```ts
export function defaultOverlay(): OverlayJson {
  return {
    template: 'broadcast',                                  // new default
    showTimer: true,
    showTournament: true,
    tournamentName: '',
    round: '',
    tournamentLogoUrl: undefined,
    customColors: {},                                       // empty — template defaults apply
    scale: 1.0,
    position: 'top-left',
  }
}
```

- [ ] **Step 3: Remove `color` from `TeamJson` interface**

Find `TeamJson` in the same file. Remove the `color: string` field from both the interface and the `defaultTeams()` function.

```ts
// Before:
export interface TeamJson {
  name: string
  players: [string, string]
  color: string
  logoUrl?: string
  country?: string
}

// After:
export interface TeamJson {
  name: string
  players: [string, string]
  logoUrl?: string
  country?: string
}

// Default:
export function defaultTeams(): TeamsJson {
  return {
    a: { name: 'Team A', players: ['', ''] },
    b: { name: 'Team B', players: ['', ''] },
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors in files that still reference `team.color` (will fix in later tasks).

- [ ] **Step 5: Commit**

```bash
git add src/types/match.ts
git commit -m "feat(v1.1): expand OverlayJson for per-slot colors + logo url; remove team.color"
```

Note: TypeScript errors from legacy components will be fixed incrementally. Don't fix them yet — they'll disappear as their files get rewritten in later tasks. If you hit a blocker, proceed to Task 3 and come back.

---

### Task 3: Template types

**Files:**
- Create: `src/lib/templates/types.ts`

- [ ] **Step 1: Write**

```ts
// src/lib/templates/types.ts — Types for the template system.
import type { MatchRow } from '@/types/match'

export type SlotColors = Record<string, string>

export type TemplateColors = Record<string, SlotColors>

export interface ColorSlot {
  key: string                          // e.g. 'playerRow'
  label: string                        // human label, e.g. 'Player rows'
  fields: Array<'bg' | 'text' | 'color'>  // which keys exist within slot
}

export interface Template {
  id: 'broadcast' | 'classic' | 'premier'
  name: string                         // e.g. 'Broadcast'
  description: string
  defaults: {
    colors: TemplateColors
  }
  slots: ColorSlot[]
  Renderer: React.ComponentType<TemplateRendererProps>
}

export interface TemplateRendererProps {
  row: MatchRow
  colors: TemplateColors               // merged defaults + overrides
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates/types.ts
git commit -m "feat(v1.1): template type definitions"
```

---

## Phase 2 — Template System

### Task 4: `mergeColors` utility (TDD)

**Files:**
- Create: `src/lib/templates/merge-colors.ts`
- Create: `src/lib/__tests__/merge-colors.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/__tests__/merge-colors.test.ts
import { describe, it, expect } from 'vitest'
import { mergeColors } from '@/lib/templates/merge-colors'

const defaults = {
  playerRow: { bg: '#000', text: '#fff' },
  scoreAccent: { bg: '#ff0', text: '#000' },
}

describe('mergeColors', () => {
  it('returns defaults when no overrides', () => {
    const merged = mergeColors(defaults, {})
    expect(merged).toEqual(defaults)
  })

  it('overrides a single field within a slot, preserving others', () => {
    const merged = mergeColors(defaults, { playerRow: { text: '#abc' } })
    expect(merged.playerRow).toEqual({ bg: '#000', text: '#abc' })
    expect(merged.scoreAccent).toEqual({ bg: '#ff0', text: '#000' })
  })

  it('adds a new slot from overrides (e.g. legacy shape)', () => {
    const merged = mergeColors(defaults, { extra: { color: '#123' } })
    expect(merged.extra).toEqual({ color: '#123' })
  })

  it('is immutable — does not mutate inputs', () => {
    const def = { playerRow: { bg: '#000' } }
    const override = { playerRow: { bg: '#fff' } }
    mergeColors(def, override)
    expect(def.playerRow.bg).toBe('#000')
    expect(override.playerRow.bg).toBe('#fff')
  })
})
```

- [ ] **Step 2: Run it — expect fail**

Run: `npm test -- merge-colors`
Expected: FAIL — `mergeColors is not defined`.

- [ ] **Step 3: Implement**

```ts
// src/lib/templates/merge-colors.ts — Merge a template's default colors with user overrides.
import type { TemplateColors } from './types'

export function mergeColors(
  defaults: TemplateColors,
  overrides: TemplateColors,
): TemplateColors {
  const merged: TemplateColors = {}
  const allKeys = new Set([...Object.keys(defaults), ...Object.keys(overrides)])
  for (const slot of allKeys) {
    merged[slot] = { ...(defaults[slot] ?? {}), ...(overrides[slot] ?? {}) }
  }
  return merged
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- merge-colors`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/templates/merge-colors.ts src/lib/__tests__/merge-colors.test.ts
git commit -m "feat(v1.1): mergeColors utility with tests"
```

---

### Task 5: Broadcast template renderer

**Files:**
- Create: `src/lib/templates/broadcast.tsx`

- [ ] **Step 1: Write the template + renderer**

```tsx
// src/lib/templates/broadcast.tsx — WPT-inspired. Bold 3-column.
import type { Template, TemplateRendererProps } from './types'

export const broadcast: Template = {
  id: 'broadcast',
  name: 'Broadcast',
  description: 'Bold 3-column. Highest visibility. WPT-inspired.',
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
    { key: 'gamesCol', label: 'Games column', fields: ['bg', 'text'] },
    { key: 'scoreAccent', label: 'Score accent', fields: ['bg', 'text'] },
    { key: 'serverDot', label: 'Server dot', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
    { key: 'divider', label: 'Dividers', fields: ['color'] },
  ],
  Renderer: BroadcastRenderer,
}

function BroadcastRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const serveTeam = state.servingTeam
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)

  const posStyle: React.CSSProperties = {
    top: overlay.position.startsWith('top') ? 20 : undefined,
    bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
    left: overlay.position.endsWith('left') ? 20 : undefined,
    right: overlay.position.endsWith('right') ? 20 : undefined,
    transform: `scale(${overlay.scale})`,
    transformOrigin: overlay.position.replace('-', ' '),
  }

  return (
    <div className="absolute font-[var(--font-sans)]" style={posStyle}>
      <div
        className="grid grid-cols-[1fr_auto_auto] rounded-lg overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
        style={{ background: colors.playerRow.bg, color: colors.playerRow.text }}
      >
        <div className="flex flex-col">
          <Row top team="a" teams={teams} serving={serveTeam === 'a'} colors={colors} />
          <Row team="b" teams={teams} serving={serveTeam === 'b'} colors={colors} />
        </div>

        {Array.from({ length: setCount }, (_, i) => (
          <div key={i} className="flex flex-col">
            <GameCell val={sets[i]?.a ?? 0} colors={colors} />
            <GameCell val={sets[i]?.b ?? 0} colors={colors} bordered />
          </div>
        ))}

        <div
          className="flex flex-col justify-center items-center min-w-[42px]"
          style={{ background: colors.scoreAccent.bg, color: colors.scoreAccent.text }}
        >
          <div className="flex-1 flex items-center justify-center py-1.5 font-extrabold text-[13px] w-full">
            {cg.a}
          </div>
          <div
            className="flex-1 flex items-center justify-center py-1.5 font-extrabold text-[13px] w-full"
            style={{ borderTop: `1px solid rgba(0,0,0,0.15)` }}
          >
            {cg.b}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  top, team, teams, serving, colors,
}: {
  top?: boolean
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  serving: boolean
  colors: Record<string, Record<string, string>>
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-[12px] font-bold"
      style={top ? { borderBottom: `1px solid ${colors.divider.color}` } : undefined}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: serving ? colors.serverDot.color : 'transparent' }}
      />
      {teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}
    </div>
  )
}

function GameCell({
  val, colors, bordered,
}: {
  val: number
  colors: Record<string, Record<string, string>>
  bordered?: boolean
}) {
  return (
    <div
      className="flex items-center justify-center px-2.5 py-2 text-[12px] font-bold min-w-[28px]"
      style={{
        background: colors.gamesCol.bg,
        color: colors.gamesCol.text,
        borderLeft: `1px solid ${colors.gamesCol.text}22`,
        borderTop: bordered ? `1px solid ${colors.gamesCol.text}22` : undefined,
      }}
    >
      {val}
    </div>
  )
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (ignore unrelated errors from older files being refactored).

- [ ] **Step 3: Commit**

```bash
git add src/lib/templates/broadcast.tsx
git commit -m "feat(v1.1): Broadcast template (WPT-inspired)"
```

---

### Task 6: Classic template renderer

**Files:**
- Create: `src/lib/templates/classic.tsx`

- [ ] **Step 1: Write**

```tsx
// src/lib/templates/classic.tsx — FIP-inspired. Adds match timer + tournament strip.
import { useEffect, useState } from 'react'
import type { Template, TemplateRendererProps } from './types'

export const classic: Template = {
  id: 'classic',
  name: 'Classic',
  description: 'Adds match timer + tournament label. Great for tournaments.',
  defaults: {
    colors: {
      timerChip: { bg: '#ffffff', text: '#1a1d1a' },
      boardBg: { bg: '#0f2b5b', text: '#ffffff' },
      divider: { color: 'rgba(255,255,255,0.1)' },
      statusBadge: { bg: '#c4d82e', text: '#1a1d1a' },
      tournamentStrip: { bg: '#0a1e42', text: '#ffffff' },
    },
  },
  slots: [
    { key: 'timerChip', label: 'Timer chip', fields: ['bg', 'text'] },
    { key: 'boardBg', label: 'Board', fields: ['bg', 'text'] },
    { key: 'divider', label: 'Dividers', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
    { key: 'tournamentStrip', label: 'Tournament strip', fields: ['bg', 'text'] },
  ],
  Renderer: ClassicRenderer,
}

function ClassicRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)
  const elapsed = useElapsed(row.started_at)

  const posStyle: React.CSSProperties = {
    top: overlay.position.startsWith('top') ? 20 : undefined,
    bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
    left: overlay.position.endsWith('left') ? 20 : undefined,
    right: overlay.position.endsWith('right') ? 20 : undefined,
    transform: `scale(${overlay.scale})`,
    transformOrigin: overlay.position.replace('-', ' '),
  }

  return (
    <div className="absolute" style={posStyle}>
      {overlay.showTimer && row.started_at && (
        <div
          className="inline-block px-2 py-1 rounded text-[11px] font-extrabold tabular-nums mb-1"
          style={{ background: colors.timerChip.bg, color: colors.timerChip.text }}
        >
          {elapsed}
        </div>
      )}
      <div
        className="rounded overflow-hidden min-w-[260px]"
        style={{ background: colors.boardBg.bg, color: colors.boardBg.text }}
      >
        <TeamRow team="a" teams={teams} sets={sets} points={cg.a} setCount={setCount} />
        <div style={{ height: 1, background: colors.divider.color }} />
        <TeamRow team="b" teams={teams} sets={sets} points={cg.b} setCount={setCount} />
      </div>
      {overlay.showTournament && (overlay.tournamentName || overlay.round) && (
        <div
          className="rounded mt-0.5 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase"
          style={{ background: colors.tournamentStrip.bg, color: colors.tournamentStrip.text }}
        >
          {[overlay.tournamentName, overlay.round].filter(Boolean).join(' — ')}
        </div>
      )}
    </div>
  )
}

function TeamRow({
  team, teams, sets, points, setCount,
}: {
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  sets: Array<{ a: number; b: number }>
  points: number | string
  setCount: number
}) {
  return (
    <div className="flex items-center px-3 py-1.5 text-[12px] font-bold">
      <span className="flex-1 truncate mr-3">{teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}</span>
      {Array.from({ length: setCount }, (_, i) => (
        <span key={i} className="w-6 text-center tabular-nums">{sets[i]?.[team] ?? 0}</span>
      ))}
      <span className="w-8 text-center tabular-nums font-extrabold">{points}</span>
    </div>
  )
}

function useElapsed(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('00:00')
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => {
      const ms = Date.now() - start
      const s = Math.floor(ms / 1000)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      const pad = (n: number) => String(n).padStart(2, '0')
      setElapsed(h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates/classic.tsx
git commit -m "feat(v1.1): Classic template (FIP-inspired with timer)"
```

---

### Task 7: Premier template renderer

**Files:**
- Create: `src/lib/templates/premier.tsx`

- [ ] **Step 1: Write**

```tsx
// src/lib/templates/premier.tsx — Premier-inspired. Dark + gold, minimal.
import type { Template, TemplateRendererProps } from './types'

export const premier: Template = {
  id: 'premier',
  name: 'Premier',
  description: 'Dark + gold. Premium broadcast feel.',
  defaults: {
    colors: {
      board: { bg: '#0f0f0f', text: '#ffffff' },
      frame: { color: '#c4a860' },
      setScore: { text: '#c4a860' },
      currentPoints: { text: '#ffffff' },
      serverDot: { color: '#c4a860' },
      statusBadge: { bg: '#c4a860', text: '#0f0f0f' },
    },
  },
  slots: [
    { key: 'board', label: 'Board', fields: ['bg', 'text'] },
    { key: 'frame', label: 'Border', fields: ['color'] },
    { key: 'setScore', label: 'Set scores', fields: ['text'] },
    { key: 'currentPoints', label: 'Current points', fields: ['text'] },
    { key: 'serverDot', label: 'Server dot', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
  ],
  Renderer: PremierRenderer,
}

function PremierRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)
  const serveTeam = state.servingTeam

  const posStyle: React.CSSProperties = {
    top: overlay.position.startsWith('top') ? 20 : undefined,
    bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
    left: overlay.position.endsWith('left') ? 20 : undefined,
    right: overlay.position.endsWith('right') ? 20 : undefined,
    transform: `scale(${overlay.scale})`,
    transformOrigin: overlay.position.replace('-', ' '),
  }

  return (
    <div className="absolute" style={posStyle}>
      <div
        className="rounded px-3 py-2 min-w-[260px]"
        style={{
          background: colors.board.bg,
          color: colors.board.text,
          border: `1px solid ${colors.frame.color}`,
        }}
      >
        <TeamRow
          team="a" teams={teams} sets={sets} points={cg.a} setCount={setCount}
          serving={serveTeam === 'a'} colors={colors}
        />
        <TeamRow
          team="b" teams={teams} sets={sets} points={cg.b} setCount={setCount}
          serving={serveTeam === 'b'} colors={colors}
        />
      </div>
    </div>
  )
}

function TeamRow({
  team, teams, sets, points, setCount, serving, colors,
}: {
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  sets: Array<{ a: number; b: number }>
  points: number | string
  setCount: number
  serving: boolean
  colors: Record<string, Record<string, string>>
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-[12px] font-bold">
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: serving ? colors.serverDot.color : 'transparent' }}
      />
      <span className="flex-1 truncate">{teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}</span>
      {Array.from({ length: setCount }, (_, i) => (
        <span
          key={i}
          className="w-6 text-center tabular-nums"
          style={{ color: colors.setScore.text }}
        >
          {sets[i]?.[team] ?? 0}
        </span>
      ))}
      <span
        className="w-7 text-center tabular-nums font-extrabold"
        style={{ color: colors.currentPoints.text }}
      >
        {points}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates/premier.tsx
git commit -m "feat(v1.1): Premier template (dark + gold)"
```

---

### Task 8: Template registry

**Files:**
- Create: `src/lib/templates/registry.ts`

- [ ] **Step 1: Write**

```ts
// src/lib/templates/registry.ts — Lookup + enumeration for the template system.
import { broadcast } from './broadcast'
import { classic } from './classic'
import { premier } from './premier'
import type { Template } from './types'

const REGISTRY: Record<string, Template> = {
  broadcast,
  classic,
  premier,
}

export function getTemplate(id: string): Template | null {
  return REGISTRY[id] ?? null
}

export function allTemplates(): Template[] {
  return [broadcast, classic, premier]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates/registry.ts
git commit -m "feat(v1.1): template registry"
```

---

### Task 9: OverlayRenderer dispatcher

**Files:**
- Create: `src/components/overlay/OverlayRenderer.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/overlay/OverlayRenderer.tsx — picks the correct template renderer.
// Legacy matches (template: 'minimal') fall back to the v1 MinimalChip component.
import type { MatchRow } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { mergeColors } from '@/lib/templates/merge-colors'
import { MinimalChip } from './MinimalChip'

export function OverlayRenderer({ row }: { row: MatchRow }) {
  const template = getTemplate(row.overlay.template)
  if (!template) {
    // Unknown or legacy ('minimal') template — fall back to v1 renderer.
    return <MinimalChip row={row} />
  }
  const colors = mergeColors(template.defaults.colors, row.overlay.customColors)
  const Renderer = template.Renderer
  return <Renderer row={row} colors={colors} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/overlay/OverlayRenderer.tsx
git commit -m "feat(v1.1): OverlayRenderer dispatcher"
```

---

### Task 10: Wire overlay page to use OverlayRenderer

**Files:**
- Modify: `src/app/overlay/[code]/OverlayClient.tsx`

- [ ] **Step 1: Replace MinimalChip with OverlayRenderer in the overlay page**

Open `src/app/overlay/[code]/OverlayClient.tsx`. Find:

```tsx
import { MinimalChip } from '@/components/overlay/MinimalChip'
```

Replace with:

```tsx
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer'
```

And replace:

```tsx
<MinimalChip row={row} />
```

With:

```tsx
<OverlayRenderer row={row} />
```

- [ ] **Step 2: Smoke test**

```bash
npm run dev
```

Open a new match URL in browser: `http://localhost:3003/overlay/<any-existing-shortcode>`.
Expected: renders (with old data it uses minimal fallback; with new data it uses the template). No console errors.

Kill dev server.

- [ ] **Step 3: Commit**

```bash
git add src/app/overlay/[code]/OverlayClient.tsx
git commit -m "feat(v1.1): overlay page uses OverlayRenderer dispatcher"
```

---

## Phase 3 — Wizard Shell Components

### Task 11: `useWizardStep` hook (URL + localStorage sync)

**Files:**
- Create: `src/components/wizard/useWizardStep.ts`

- [ ] **Step 1: Write**

```ts
// src/components/wizard/useWizardStep.ts — Step state with URL and localStorage sync.
'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type StepNum = 1 | 2 | 3

export function useWizardStep(matchId: string): {
  step: StepNum
  direction: 1 | -1
  setStep: (next: StepNum) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const initial: StepNum = readStep(params.get('step'), matchId)
  const [step, setStepState] = useState<StepNum>(initial)
  const [direction, setDirection] = useState<1 | -1>(1)

  const setStep = useCallback(
    (next: StepNum) => {
      setDirection(next > step ? 1 : -1)
      setStepState(next)
      try {
        localStorage.setItem(`padelboard:lastStep:${matchId}`, String(next))
      } catch { /* ignore quota */ }
      const usp = new URLSearchParams(params.toString())
      usp.set('step', String(next))
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false })
    },
    [step, pathname, params, router, matchId],
  )

  // Keep state in sync if URL changes from elsewhere (rare)
  useEffect(() => {
    const fromUrl = readStep(params.get('step'), matchId)
    if (fromUrl !== step) {
      setDirection(fromUrl > step ? 1 : -1)
      setStepState(fromUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return { step, direction, setStep }
}

function readStep(urlValue: string | null, matchId: string): StepNum {
  const fromUrl = urlValue ? parseInt(urlValue, 10) : NaN
  if (fromUrl === 1 || fromUrl === 2 || fromUrl === 3) return fromUrl
  if (typeof localStorage !== 'undefined') {
    const fromStorage = parseInt(localStorage.getItem(`padelboard:lastStep:${matchId}`) ?? '', 10)
    if (fromStorage === 1 || fromStorage === 2 || fromStorage === 3) return fromStorage
  }
  return 1
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/useWizardStep.ts
git commit -m "feat(v1.1): useWizardStep hook with URL + localStorage sync"
```

---

### Task 12: `StageCourt` background component

**Files:**
- Create: `src/components/wizard/StageCourt.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/StageCourt.tsx — Stylized CSS padel court background for the preview stage.
export function StageCourt({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative aspect-video rounded-xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.15)]"
      style={{
        background:
          'linear-gradient(180deg, #0a0e14 0%, #1a2432 18%, #24324a 28%, #2c6fb8 38%, #2e7cc8 45%, #286fb8 68%, #1a56a0 85%, #0f3d78 100%)',
      }}
    >
      {/* Crowd texture */}
      <div
        className="absolute inset-x-0 top-0 bottom-[65%] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 50%, rgba(255,255,255,0.08) 0.5px, transparent 1px),
            radial-gradient(circle at 30% 30%, rgba(196,216,46,0.08) 0.5px, transparent 1px),
            radial-gradient(circle at 55% 70%, rgba(255,255,255,0.06) 0.5px, transparent 1px),
            radial-gradient(circle at 80% 40%, rgba(255,200,100,0.08) 0.5px, transparent 1px)
          `,
          backgroundSize: '4px 4px, 5px 5px, 3px 3px, 6px 6px',
        }}
      />
      {/* Sponsor strip */}
      <div
        className="absolute left-[8%] right-[8%] top-[30%] h-[8%] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.2)',
        }}
      />
      {/* Court service lines in perspective */}
      <div
        className="absolute left-[12%] right-[12%] top-[52%] bottom-[8%] pointer-events-none"
        style={{
          border: '1.5px solid rgba(255,255,255,0.55)',
          borderTopWidth: 2,
          transform: 'perspective(500px) rotateX(52deg)',
          transformOrigin: 'top center',
          background: `
            linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.55) 49%, rgba(255,255,255,0.55) 51%, transparent 51%),
            linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 41%, transparent 41%)
          `,
        }}
      />
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/StageCourt.tsx
git commit -m "feat(v1.1): StageCourt CSS stadium background"
```

---

### Task 13: `WizardRail` component

**Files:**
- Create: `src/components/wizard/WizardRail.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/WizardRail.tsx — Left rail with 3-step task list.
'use client'
import type { StepNum } from './useWizardStep'

interface StepMeta {
  num: StepNum
  title: string
  subtitle: (row: import('@/types/match').MatchRow) => string
}

const STEPS: StepMeta[] = [
  { num: 1, title: 'Pick a template', subtitle: (r) => {
    const t = r.overlay.template
    return t === 'broadcast' ? 'Broadcast' : t === 'classic' ? 'Classic' : t === 'premier' ? 'Premier' : 'How the board looks'
  } },
  { num: 2, title: 'Players', subtitle: (r) => {
    const a = r.teams.a.name, b = r.teams.b.name
    return a && b ? `${a} vs ${b}` : 'Team and player names'
  } },
  { num: 3, title: 'Match format', subtitle: () => 'Scoring rules' },
]

export function WizardRail({
  step, completed, onJump, row,
}: {
  step: StepNum
  completed: Set<StepNum>
  onJump: (s: StepNum) => void
  row: import('@/types/match').MatchRow
}) {
  return (
    <aside className="bg-[#fafbf6] border-r border-[var(--color-border)] p-6 flex flex-col">
      <div className="text-[14px] font-bold">Padelboard</div>
      <div className="text-[11px] text-[var(--color-muted)] mb-6">New match</div>
      <div className="flex flex-col gap-1 flex-1">
        {STEPS.map((s) => {
          const isActive = s.num === step
          const isDone = completed.has(s.num)
          const canJump = isDone || isActive
          return (
            <button
              key={s.num}
              onClick={() => canJump && onJump(s.num)}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition ${
                isActive ? 'bg-[var(--color-lime-tint)]' : 'hover:bg-[rgba(196,216,46,0.08)]'
              } ${canJump ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              disabled={!canJump}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  isActive
                    ? 'bg-[var(--color-lime)] border-[1.5px] border-[var(--color-lime)] text-[var(--color-text)]'
                    : isDone
                      ? 'bg-[var(--color-text)] border-[1.5px] border-[var(--color-text)] text-white'
                      : 'bg-white border-[1.5px] border-[var(--color-border-strong)] text-[var(--color-muted)]'
                }`}
              >
                {isDone ? '✓' : s.num}
              </span>
              <div className="flex-1 leading-tight">
                <div className="text-[12.5px] font-semibold">{s.title}</div>
                <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{s.subtitle(row)}</div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] mt-5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime)]"
          style={{ boxShadow: '0 0 0 3px rgba(196,216,46,0.25)' }}
        />
        Draft · autosaved
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/WizardRail.tsx
git commit -m "feat(v1.1): WizardRail left navigation"
```

---

### Task 14: `WizardPreview` component

**Files:**
- Create: `src/components/wizard/WizardPreview.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/WizardPreview.tsx — Right preview panel.
'use client'
import type { MatchRow } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer'
import { StageCourt } from './StageCourt'

export function WizardPreview({ row }: { row: MatchRow }) {
  const template = getTemplate(row.overlay.template)
  const templateName = template?.name ?? 'Minimal'
  const overlayUrl = typeof window !== 'undefined'
    ? `${window.location.host}/overlay/${row.short_code}`
    : `padelboard.padellabs.tech/overlay/${row.short_code}`

  return (
    <aside className="bg-[#fafbf6] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <span>Live preview</span>
        <span className="bg-[var(--color-lime-tint)] px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case tracking-normal text-[var(--color-text)]">
          {templateName}
        </span>
      </div>
      <StageCourt>
        <OverlayRenderer row={row} />
      </StageCourt>
      <div className="mt-4 p-3 bg-white border border-[var(--color-border)] rounded-lg text-[11.5px] text-[var(--color-muted)] flex flex-col gap-1">
        <span className="font-medium text-[var(--color-text)]">Overlay URL</span>
        <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[10.5px] text-[var(--color-text)] font-mono">
          {overlayUrl}
        </code>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/WizardPreview.tsx
git commit -m "feat(v1.1): WizardPreview right panel"
```

---

### Task 15: `WizardFooter` component

**Files:**
- Create: `src/components/wizard/WizardFooter.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/WizardFooter.tsx — Back / Continue footer.
'use client'
import { Button } from '@/components/ui/Button'
import type { StepNum } from './useWizardStep'

export function WizardFooter({
  step,
  onBack,
  onNext,
  onPublish,
}: {
  step: StepNum
  onBack: () => void
  onNext: () => void
  onPublish: () => void
}) {
  const isFinal = step === 3
  return (
    <div className="col-span-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 px-9 flex justify-between items-center">
      <span className="text-[12px] text-[var(--color-muted)]">
        {isFinal ? 'All set — click below to publish.' : 'Autosaves as you type.'}
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={step === 1}>
          ← Back
        </Button>
        {isFinal ? (
          <Button onClick={onPublish}>Get my OBS link →</Button>
        ) : (
          <Button onClick={onNext}>Continue →</Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/WizardFooter.tsx
git commit -m "feat(v1.1): WizardFooter with back/continue/publish"
```

---

### Task 16: `Tooltip` primitive

**Files:**
- Create: `src/components/wizard/Tooltip.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/Tooltip.tsx — Hover-triggered tooltip with (i) trigger.
'use client'
import { useState } from 'react'

export function Tooltip({ text, children }: { text: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children ?? (
        <button
          type="button"
          className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full bg-black/10 text-[var(--color-muted)] text-[10px] font-bold cursor-help"
          aria-label="More info"
        >
          i
        </button>
      )}
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[var(--color-text)] text-white text-[11.5px] font-medium text-center leading-snug rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2"
            style={{
              borderWidth: 5,
              borderStyle: 'solid',
              borderColor: 'var(--color-text) transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/Tooltip.tsx
git commit -m "feat(v1.1): Tooltip primitive for (i) icons"
```

---

## Phase 4 — Step 1 (Template)

### Task 17: `TemplateCard` component

**Files:**
- Create: `src/components/wizard/TemplateCard.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/TemplateCard.tsx — one selectable template card.
'use client'
import type { Template } from '@/lib/templates/types'
import type { MatchRow } from '@/types/match'
import { mergeColors } from '@/lib/templates/merge-colors'

export function TemplateCard({
  template, selected, onSelect, sampleRow,
}: {
  template: Template
  selected: boolean
  onSelect: () => void
  sampleRow: MatchRow
}) {
  const colors = mergeColors(template.defaults.colors, {})
  const Renderer = template.Renderer
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid grid-cols-[90px_1fr] gap-3.5 items-center p-3.5 rounded-2xl transition cursor-pointer text-left w-full ${
        selected
          ? 'border-[1.5px] border-[var(--color-lime)] ring-2 ring-[rgba(196,216,46,0.22)] bg-[rgba(196,216,46,0.04)]'
          : 'border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-lime)] bg-white'
      }`}
    >
      <div
        className="aspect-[16/10] rounded-lg overflow-hidden relative"
        style={{ background: 'linear-gradient(180deg, #4a5c3a 0%, #1e2619 100%)' }}
      >
        <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', position: 'absolute', top: 4, left: 4 }}>
          <Renderer row={sampleRow} colors={colors} />
        </div>
      </div>
      <div>
        <div className="text-[14px] font-semibold">{template.name}</div>
        <div className="text-[11.5px] text-[var(--color-muted)] mt-0.5 leading-snug">
          {template.description}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/TemplateCard.tsx
git commit -m "feat(v1.1): TemplateCard with inline sample render"
```

---

### Task 18: `StepTemplate` component

**Files:**
- Create: `src/components/wizard/steps/StepTemplate.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/steps/StepTemplate.tsx — Step 1 of the wizard.
'use client'
import { useState } from 'react'
import type { MatchRow, OverlayJson, TemplateId } from '@/types/match'
import { allTemplates } from '@/lib/templates/registry'
import { Button } from '@/components/ui/Button'
import { TemplateCard } from '../TemplateCard'
import { ColorCustomizerModal } from '@/components/customizer/ColorCustomizerModal'

export function StepTemplate({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { overlay: OverlayJson }) => void
}) {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const templates = allTemplates()

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 1 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Pick a template</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Swap any time — fully free, no lock-ins.
      </p>

      <div className="flex flex-col gap-2.5">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={row.overlay.template === t.id}
            onSelect={() => onChange({ overlay: { ...row.overlay, template: t.id as TemplateId } })}
            sampleRow={row}
          />
        ))}
      </div>

      <div className="mt-5 p-4 bg-[#fafbf6] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-medium">Customize colors</div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
            Upload your tournament logo — AI suggests a palette — fine-tune per element.
          </div>
        </div>
        <Button variant="ghost" onClick={() => setCustomizerOpen(true)}>
          Open customizer →
        </Button>
      </div>

      <ColorCustomizerModal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        row={row}
        onChange={onChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/steps/StepTemplate.tsx
git commit -m "feat(v1.1): StepTemplate (template picker + customizer open)"
```

---

## Phase 5 — Step 2 (Players)

### Task 19: `StepPlayers` component

**Files:**
- Create: `src/components/wizard/steps/StepPlayers.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/steps/StepPlayers.tsx — Step 2 of the wizard.
'use client'
import type { MatchRow, TeamJson, TeamsJson } from '@/types/match'
import { Input } from '@/components/ui/Input'

export function StepPlayers({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { teams: TeamsJson }) => void
}) {
  function updateTeam(side: 'a' | 'b', patch: Partial<TeamJson>) {
    onChange({ teams: { ...row.teams, [side]: { ...row.teams[side], ...patch } } })
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 2 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Who&apos;s playing?</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Enter team names and the two players per team. You can edit these later.
      </p>

      <TeamBlock
        label="Team A"
        dotColor="#0a3d91"
        team={row.teams.a}
        placeholder={{ team: 'Team A', p1: 'Player 1', p2: 'Player 2' }}
        onChange={(patch) => updateTeam('a', patch)}
      />
      <TeamBlock
        label="Team B"
        dotColor="#b91c1c"
        team={row.teams.b}
        placeholder={{ team: 'Team B', p1: 'Player 1', p2: 'Player 2' }}
        onChange={(patch) => updateTeam('b', patch)}
      />
    </div>
  )
}

function TeamBlock({
  label, dotColor, team, placeholder, onChange,
}: {
  label: string
  dotColor: string
  team: TeamJson
  placeholder: { team: string; p1: string; p2: string }
  onChange: (patch: Partial<TeamJson>) => void
}) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
        {label}
      </div>
      <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Team name</label>
      <Input
        value={team.name}
        placeholder={placeholder.team}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Player 1</label>
          <Input
            value={team.players[0]}
            placeholder={placeholder.p1}
            onChange={(e) => onChange({ players: [e.target.value, team.players[1]] })}
          />
        </div>
        <div>
          <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Player 2</label>
          <Input
            value={team.players[1]}
            placeholder={placeholder.p2}
            onChange={(e) => onChange({ players: [team.players[0], e.target.value] })}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/steps/StepPlayers.tsx
git commit -m "feat(v1.1): StepPlayers — no color picker, placeholders"
```

---

## Phase 6 — Step 3 (Format)

### Task 20: `FormatChipWithTip`

**Files:**
- Create: `src/components/wizard/FormatChipWithTip.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/FormatChipWithTip.tsx — Format chip w/ tooltip.
'use client'
import { Tooltip } from './Tooltip'

export function FormatChipWithTip({
  label, active, tip, onClick,
}: {
  label: string
  active: boolean
  tip: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-medium transition ${
        active
          ? 'bg-[var(--color-lime-tint)] border-[var(--color-lime)] text-[var(--color-text)] font-semibold'
          : 'bg-white border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-lime)]'
      }`}
    >
      {label}
      <Tooltip text={tip} />
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/FormatChipWithTip.tsx
git commit -m "feat(v1.1): FormatChipWithTip"
```

---

### Task 21: `RuleToggleWithTip`

**Files:**
- Create: `src/components/wizard/RuleToggleWithTip.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/RuleToggleWithTip.tsx — Rule toggle row w/ tooltip.
'use client'
import { Switch } from '@/components/ui/Switch'
import { Tooltip } from './Tooltip'

export function RuleToggleWithTip({
  title, subtitle, tip, on, onToggle,
}: {
  title: string
  subtitle: string
  tip: string
  on: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0">
      <div>
        <div className="flex items-center text-[13.5px] font-medium">
          {title}
          <Tooltip text={tip} />
        </div>
        <div className="text-[11.5px] text-[var(--color-muted)] mt-0.5">{subtitle}</div>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/RuleToggleWithTip.tsx
git commit -m "feat(v1.1): RuleToggleWithTip"
```

---

### Task 22: `StepFormat` component

**Files:**
- Create: `src/components/wizard/steps/StepFormat.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/steps/StepFormat.tsx — Step 3 of the wizard.
'use client'
import type { MatchRow } from '@/types/match'
import type { MatchConfig, MatchFormat } from '@/lib/padel-scoring'
import { FormatChipWithTip } from '../FormatChipWithTip'
import { RuleToggleWithTip } from '../RuleToggleWithTip'

const FORMATS: Array<{ id: MatchFormat; label: string; tip: string }> = [
  { id: 'bo3', label: 'Best of 3', tip: 'First team to win 2 sets wins the match. Standard for most club and tournament matches.' },
  { id: 'single-set', label: 'Single set', tip: 'First team to 6 games (with 2-game lead) wins. Fast format — great for short streams.' },
  { id: 'pro-set', label: 'Pro set', tip: 'First team to 9 games (with 2-game lead) wins the match. One long set, no best-of structure.' },
]

export function StepFormat({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { config: MatchConfig }) => void
}) {
  const cfg = row.config
  function update(patch: Partial<MatchConfig>) {
    onChange({ config: { ...cfg, ...patch } })
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 3 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Match format</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Pick the format and enable any rules you want. Hover any option for details.
      </p>

      <label className="block text-[11.5px] text-[var(--color-muted)] mb-2 font-medium">Format</label>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <FormatChipWithTip
            key={f.id}
            label={f.label}
            active={cfg.format === f.id}
            tip={f.tip}
            onClick={() => update({ format: f.id })}
          />
        ))}
      </div>

      <label className="block text-[11.5px] text-[var(--color-muted)] mb-2 mt-7 font-medium">Rules</label>
      <RuleToggleWithTip
        title="Golden point"
        subtitle="Standard in FIP, Premier, and most club matches"
        tip="At 40-40 the receiving team chooses which side to receive from. The next point wins the game — no advantage."
        on={cfg.goldenPoint}
        onToggle={(v) => update({ goldenPoint: v })}
      />
      <RuleToggleWithTip
        title="Super-tiebreak in final set"
        subtitle="First to 10 points replaces a full final set"
        tip="Replaces the final set with a first-to-10 tiebreak (win by 2). Common on amateur tours and some pro events."
        on={cfg.superTiebreak}
        onToggle={(v) => update({ superTiebreak: v })}
      />
      <RuleToggleWithTip
        title="Tiebreak at 6-6"
        subtitle="Standard 7-point tiebreak"
        tip="When a set reaches 6-6, play a standard 7-point tiebreak (win by 2) to close it."
        on={cfg.setTiebreakAt === 6}
        onToggle={(v) => update({ setTiebreakAt: v ? 6 : 'none' })}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/steps/StepFormat.tsx
git commit -m "feat(v1.1): StepFormat with chip tooltips + rule toggles"
```

---

## Phase 7 — Color Customizer Modal

### Task 23: `SlotCard`

**Files:**
- Create: `src/components/customizer/SlotCard.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/customizer/SlotCard.tsx — one color slot with per-field swatches.
'use client'
import type { ColorSlot, SlotColors } from '@/lib/templates/types'

export function SlotCard({
  slot, value, onChange,
}: {
  slot: ColorSlot
  value: SlotColors
  onChange: (next: SlotColors) => void
}) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {slot.label}
      </div>
      <div className="flex gap-1.5">
        {slot.fields.map((f) => (
          <label key={f} className="flex-1 cursor-pointer">
            <input
              type="color"
              value={toHex(value[f])}
              onChange={(e) => onChange({ ...value, [f]: e.target.value })}
              className="sr-only"
            />
            <div
              className="w-full h-7 rounded-md border border-black/10 mb-1"
              style={{ background: value[f] ?? '#000000' }}
            />
            <div className="text-[10px] text-[var(--color-muted)] text-center capitalize">
              {f}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// Native <input type="color"> requires hex without alpha. Strip rgba → approximate hex.
function toHex(color: string | undefined): string {
  if (!color) return '#000000'
  if (color.startsWith('#') && color.length === 7) return color
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return '#000000'
  const [r, g, b] = [m[1], m[2], m[3]].map(Number)
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/customizer/SlotCard.tsx
git commit -m "feat(v1.1): SlotCard color slot editor"
```

---

### Task 24: `LogoUploadZone`

**Files:**
- Create: `src/components/customizer/LogoUploadZone.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/customizer/LogoUploadZone.tsx — drag-drop logo upload.
'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export function LogoUploadZone({
  logoUrl, onUpload, uploading,
}: {
  logoUrl?: string
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }
    await onUpload(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
      }}
      className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-white mb-5 transition ${
        dragging ? 'border-[var(--color-lime)] bg-[var(--color-lime-tint)]' : 'border-[var(--color-border-strong)]'
      }`}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-lg bg-[var(--color-bg)]" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#0a3d91] to-[#ffcf2e] flex items-center justify-center text-white text-[20px] font-extrabold">
          ?
        </div>
      )}
      <div className="flex-1">
        <strong className="block text-[13px] font-semibold mb-0.5">
          {logoUrl ? 'Tournament logo' : 'Upload a tournament logo'}
        </strong>
        <small className="block text-[11.5px] text-[var(--color-muted)] leading-snug">
          {uploading
            ? 'Uploading…'
            : 'PNG / JPG / WebP / SVG, max 2MB. Drag a file here or click the button.'}
        </small>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
      />
      <Button
        variant="ghost"
        className="text-[12px] px-3.5 py-2"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {logoUrl ? 'Change' : 'Choose file'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/customizer/LogoUploadZone.tsx
git commit -m "feat(v1.1): LogoUploadZone"
```

---

### Task 25: `POST /api/logo` route

**Files:**
- Create: `src/app/api/logo/route.ts`

- [ ] **Step 1: Write**

```ts
// src/app/api/logo/route.ts — upload a logo to Supabase Storage.
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase-server'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const matchId = form.get('matchId') as string | null
  const draftToken = form.get('draftToken') as string | null

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  // Auth: owner session OR draft token
  const svc = serviceSupabase()
  let ownerId: string | null = null
  let draftMatch: { draft_token: string } | null = null

  if (matchId) {
    const { data } = await svc.from('matches').select('owner_id, draft_token').eq('id', matchId).single()
    ownerId = data?.owner_id ?? null
    draftMatch = data?.draft_token ? { draft_token: data.draft_token } : null
  }

  let authorized = false
  if (ownerId) {
    const sb = await serverSupabase()
    const { data: userRes } = await sb.auth.getUser()
    authorized = userRes.user?.id === ownerId
  } else if (draftMatch && draftToken && draftToken === draftMatch.draft_token) {
    authorized = true
  }
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  // Upload to Supabase Storage
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `logos/${matchId ?? 'anon'}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await svc.storage.from('assets').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) {
    console.error('[api/logo] upload failed', upErr)
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
  const { data: pub } = svc.storage.from('assets').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/logo/route.ts
git commit -m "feat(v1.1): POST /api/logo upload route"
```

---

### Task 26: `claude-palette` helper

**Files:**
- Create: `src/lib/claude-palette.ts`

- [ ] **Step 1: Write**

```ts
// src/lib/claude-palette.ts — Server-only: call Claude Vision to recommend a palette from a logo URL.
import Anthropic from '@anthropic-ai/sdk'
import { getTemplate } from './templates/registry'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface PaletteResult {
  palette: { primary: string; accent: string; textOnPrimary: string; textOnAccent: string }
  slotAssignments: Record<string, Record<string, string>>
  reasoning: string
}

export async function generatePaletteFromLogo(
  logoUrl: string,
  templateId: string,
): Promise<PaletteResult> {
  const template = getTemplate(templateId)
  if (!template) throw new Error(`Unknown template: ${templateId}`)

  const slotDescriptions = template.slots
    .map((s) => `  - "${s.key}" (${s.label}) with fields [${s.fields.join(', ')}]`)
    .join('\n')

  const prompt = `You are a brand design assistant. Analyze the attached tournament logo and recommend a color palette for a padel scoreboard overlay using the "${template.name}" template.

The template exposes these slots:
${slotDescriptions}

Return ONLY valid JSON with this exact shape:
{
  "palette": {
    "primary": "#HEX",
    "accent": "#HEX",
    "textOnPrimary": "#HEX",
    "textOnAccent": "#HEX"
  },
  "slotAssignments": {
    "<slot-key>": { "<field>": "#HEX", ... },
    ...
  },
  "reasoning": "One sentence explaining your choices."
}

Rules:
- All colors must be 7-char hex (#rrggbb) — no alpha.
- textOnPrimary must contrast well with primary (WCAG AA). Same for textOnAccent.
- slotAssignments must cover every slot and every field listed above.
- Reasoning: one sentence, max 25 words.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: logoUrl } },
        { type: 'text', text: prompt },
      ],
    }],
  })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response')

  // Pull the JSON block out. Claude sometimes wraps in code fences.
  let json = textBlock.text.trim()
  const fence = json.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (fence) json = fence[1].trim()

  const parsed = JSON.parse(json) as PaletteResult
  if (!parsed.palette || !parsed.slotAssignments || !parsed.reasoning) {
    throw new Error('Invalid palette JSON')
  }
  return parsed
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/claude-palette.ts
git commit -m "feat(v1.1): claude-palette Claude Vision helper"
```

---

### Task 27: `POST /api/palette` route

**Files:**
- Create: `src/app/api/palette/route.ts`

- [ ] **Step 1: Write**

```ts
// src/app/api/palette/route.ts — Generate an AI palette from a logo URL.
import { NextResponse } from 'next/server'
import { generatePaletteFromLogo } from '@/lib/claude-palette'

const recentRequests = new Map<string, number[]>() // IP → timestamps (in-memory, dev-simple)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (recentRequests.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  recentRequests.set(ip, recent)
  return recent.length > 10
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const { logoUrl, templateId } = (await req.json()) as { logoUrl?: string; templateId?: string }
  if (!logoUrl || !templateId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  try {
    const result = await generatePaletteFromLogo(logoUrl, templateId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/palette] failed', err)
    return NextResponse.json({ error: 'ai_failed', detail: String(err) }, { status: 502 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/palette/route.ts
git commit -m "feat(v1.1): POST /api/palette AI route"
```

---

### Task 28: `AIResultCard`

**Files:**
- Create: `src/components/customizer/AIResultCard.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/customizer/AIResultCard.tsx — shows AI palette result + Apply button.
'use client'

interface Palette {
  primary: string
  accent: string
  textOnPrimary: string
  textOnAccent: string
}

export function AIResultCard({
  palette, reasoning, onApply,
}: {
  palette: Palette
  reasoning: string
  onApply: () => void
}) {
  return (
    <div className="mt-3.5 p-3 bg-white border border-[var(--color-border)] rounded-xl flex items-center gap-3">
      <div className="flex gap-1 flex-shrink-0">
        {[palette.primary, palette.accent, palette.textOnPrimary, palette.textOnAccent].map((c, i) => (
          <div key={i} className="w-6 h-6 rounded ring-inset ring-1 ring-black/10" style={{ background: c }} />
        ))}
      </div>
      <div className="flex-1 text-[11.5px] text-[var(--color-muted)] leading-snug">
        <strong className="text-[var(--color-text)]">Suggested palette.</strong> {reasoning}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="text-[11px] px-3 py-1.5 rounded-full bg-[var(--color-lime)] text-[var(--color-text)] font-semibold flex-shrink-0"
      >
        Apply palette
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/customizer/AIResultCard.tsx
git commit -m "feat(v1.1): AIResultCard"
```

---

### Task 29: `ColorCustomizerModal`

**Files:**
- Create: `src/components/customizer/ColorCustomizerModal.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/customizer/ColorCustomizerModal.tsx — full customizer flow.
'use client'
import { useState } from 'react'
import type { MatchRow, OverlayJson } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { mergeColors } from '@/lib/templates/merge-colors'
import { getDraftToken } from '@/lib/draft-token'
import { Button } from '@/components/ui/Button'
import { StageCourt } from '@/components/wizard/StageCourt'
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer'
import { LogoUploadZone } from './LogoUploadZone'
import { SlotCard } from './SlotCard'
import { AIResultCard } from './AIResultCard'

interface Palette {
  primary: string
  accent: string
  textOnPrimary: string
  textOnAccent: string
}

export function ColorCustomizerModal({
  open, onClose, row, onChange,
}: {
  open: boolean
  onClose: () => void
  row: MatchRow
  onChange: (patch: { overlay: OverlayJson }) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ palette: Palette; slotAssignments: Record<string, Record<string, string>>; reasoning: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  if (!open) return null

  const template = getTemplate(row.overlay.template)
  if (!template) return null

  const effectiveColors = mergeColors(template.defaults.colors, row.overlay.customColors)

  async function handleUpload(file: File) {
    setUploading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('matchId', row.id)
      const dt = getDraftToken(row.id)
      if (dt) form.append('draftToken', dt)
      const r = await fetch('/api/logo', { method: 'POST', body: form })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'upload_failed')
      const nextOverlay = { ...row.overlay, tournamentLogoUrl: json.url as string }
      onChange({ overlay: nextOverlay })
      // Immediately kick off AI palette
      await generatePalette(json.url)
    } catch (err) {
      setAiError(String(err))
    } finally {
      setUploading(false)
    }
  }

  async function generatePalette(logoUrl: string) {
    setAiLoading(true)
    try {
      const r = await fetch('/api/palette', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logoUrl, templateId: template.id }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'ai_failed')
      setAiResult(json)
    } catch (err) {
      setAiError(String(err))
    } finally {
      setAiLoading(false)
    }
  }

  function applyAI() {
    if (!aiResult) return
    onChange({ overlay: { ...row.overlay, customColors: aiResult.slotAssignments } })
  }

  function updateSlot(slotKey: string, value: Record<string, string>) {
    const nextCustom = { ...row.overlay.customColors, [slotKey]: { ...(row.overlay.customColors[slotKey] ?? {}), ...value } }
    onChange({ overlay: { ...row.overlay, customColors: nextCustom } })
  }

  function reset() {
    onChange({ overlay: { ...row.overlay, customColors: {} } })
    setAiResult(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[880px] w-full max-h-[90vh] overflow-auto shadow-[0_30px_80px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[20px] font-bold tracking-tight">Customize colors</div>
            <div className="text-[12.5px] text-[var(--color-muted)] mt-0.5">{template.name} template</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-muted)] text-base"
          >
            ×
          </button>
        </div>

        <div className="p-5 bg-[#fafbf6] border-b border-[var(--color-border)]">
          <div className="h-[140px]">
            <StageCourt>
              <OverlayRenderer row={row} />
            </StageCourt>
          </div>
        </div>

        <div className="p-7">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3.5">
            AI palette from logo
          </div>
          <LogoUploadZone logoUrl={row.overlay.tournamentLogoUrl} onUpload={handleUpload} uploading={uploading} />
          {aiLoading && <div className="text-[12px] text-[var(--color-muted)] mb-4">Generating palette…</div>}
          {aiError && <div className="text-[12px] text-red-600 mb-4">AI failed: {aiError}</div>}
          {aiResult && (
            <AIResultCard palette={aiResult.palette} reasoning={aiResult.reasoning} onApply={applyAI} />
          )}

          <div className="flex items-center justify-between mt-6 mb-3.5">
            <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Fine-tune per slot
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] text-[var(--color-muted)] px-2.5 py-1 rounded-md border border-[var(--color-border-strong)] bg-white"
            >
              ↻ Reset to template defaults
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {template.slots.map((slot) => (
              <SlotCard
                key={slot.key}
                slot={slot}
                value={effectiveColors[slot.key] ?? {}}
                onChange={(value) => updateSlot(slot.key, value)}
              />
            ))}
          </div>
        </div>

        <div className="px-7 py-4 border-t border-[var(--color-border)] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/customizer/ColorCustomizerModal.tsx
git commit -m "feat(v1.1): ColorCustomizerModal (logo upload + AI palette + per-slot)"
```

---

## Phase 8 — Wizard shell & integration

### Task 30: `Wizard` shell component

**Files:**
- Create: `src/components/wizard/Wizard.tsx`

- [ ] **Step 1: Write**

```tsx
// src/components/wizard/Wizard.tsx — 3-step onboarding wizard shell.
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MatchRow } from '@/types/match'
import { useDraftMatch } from '@/hooks/useDraftMatch'
import { AuthWallModal } from '@/components/auth/AuthWallModal'
import { WizardRail } from './WizardRail'
import { WizardPreview } from './WizardPreview'
import { WizardFooter } from './WizardFooter'
import { useWizardStep, type StepNum } from './useWizardStep'
import { StepTemplate } from './steps/StepTemplate'
import { StepPlayers } from './steps/StepPlayers'
import { StepFormat } from './steps/StepFormat'

const slideVariants = {
  enter: (dir: 1 | -1) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir * -40, opacity: 0 }),
}

export function Wizard({ initial }: { initial: MatchRow }) {
  const { row, patch } = useDraftMatch(initial)
  const { step, direction, setStep } = useWizardStep(row.id)
  const [authOpen, setAuthOpen] = useState(false)
  const completed = new Set<StepNum>()
  if (step > 1) completed.add(1)
  if (step > 2) completed.add(2)

  function goBack() { if (step > 1) setStep((step - 1) as StepNum) }
  function goNext() { if (step < 3) setStep((step + 1) as StepNum) }
  function publish() { setAuthOpen(true) }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-7">
      <div className="max-w-[1440px] mx-auto">
        <div
          className="grid bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm"
          style={{ gridTemplateColumns: '240px 1fr 420px' }}
        >
          <WizardRail step={step} completed={completed} onJump={setStep} row={row} />

          <div className="flex flex-col border-r border-[var(--color-border)]">
            <div className="flex-1 p-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.3 }}
                >
                  {step === 1 && <StepTemplate row={row} onChange={patch} />}
                  {step === 2 && <StepPlayers row={row} onChange={patch} />}
                  {step === 3 && <StepFormat row={row} onChange={patch} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <WizardPreview row={row} />

          <WizardFooter step={step} onBack={goBack} onNext={goNext} onPublish={publish} />
        </div>
      </div>
      <AuthWallModal open={authOpen} onClose={() => setAuthOpen(false)} matchId={row.id} />
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wizard/Wizard.tsx
git commit -m "feat(v1.1): Wizard shell with Framer Motion step transitions"
```

---

### Task 31: Replace Builder with Wizard in the route

**Files:**
- Modify: `src/app/m/[code]/page.tsx`

- [ ] **Step 1: Update the page**

Replace `src/app/m/[code]/page.tsx` with:

```tsx
// src/app/m/[code]/page.tsx — routes to Wizard (draft) or Operator (published).
import { notFound } from 'next/navigation'
import { serviceSupabase } from '@/lib/supabase-server'
import type { MatchRow } from '@/types/match'
import { Wizard } from '@/components/wizard/Wizard'
import { Operator } from './Operator'

export const dynamic = 'force-dynamic'

export default async function MatchPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = serviceSupabase()
  const { data } = await sb.from('matches').select('*').eq('short_code', code).single()
  if (!data) return notFound()
  const row = data as unknown as MatchRow
  if (row.status === 'draft') return <Wizard initial={row} />
  return <Operator initial={row} />
}
```

- [ ] **Step 2: Delete old Builder**

```bash
rm src/app/m/\[code\]/Builder.tsx
```

- [ ] **Step 3: Delete old builder components**

```bash
rm -rf src/components/builder/
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: **no errors** (all the v1 builder-era type errors should now be gone).

- [ ] **Step 5: Verify dev build works**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/m/\[code\]/page.tsx
git rm -r src/components/builder/ 2>/dev/null || true
git rm src/app/m/\[code\]/Builder.tsx 2>/dev/null || true
git commit -m "feat(v1.1): route /m/[code] drafts to Wizard; remove legacy Builder"
```

---

## Phase 9 — End-to-end verification

### Task 32: Smoke test on local dev

**Files:** none

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

Wait ~3s for ready.

- [ ] **Step 2: Create a match**

```bash
curl -X POST http://localhost:3003/api/matches | python3 -m json.tool
```

Capture `shortCode` from response.

- [ ] **Step 3: Visit the wizard**

Open `http://localhost:3003/m/<shortCode>` in a browser.

Expected:
- 3-column wizard shell renders
- Step 1 (Pick a template) shows 3 cards: Broadcast, Classic, Premier
- Clicking a card updates the right-side preview
- "Customize colors" button opens the modal (mock — AI will fail without `ANTHROPIC_API_KEY` locally)
- Continue → Step 2 (Players form) with live-updating preview
- Continue → Step 3 (Format + rule toggles) with badges appearing/disappearing
- Back button works from steps 2 and 3
- URL updates to `?step=1|2|3` as you navigate

- [ ] **Step 4: If broken, fix the specific component and commit separately**

Use browser devtools and `npm run lint` / `npx tsc --noEmit` to diagnose. Fix issues one at a time — each fix gets its own commit.

- [ ] **Step 5: Kill dev server**

Ctrl-C in the terminal running `npm run dev`.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(v1.1): local smoke-test adjustments" 2>/dev/null || echo "no fixes needed"
```

---

## Phase 10 — Deploy

### Task 33: Deploy to Vercel

**Files:** none (infrastructure)

- [ ] **Step 1: Add `ANTHROPIC_API_KEY` to Vercel env vars**

Vercel Dashboard → Project `padelboard` → Settings → Environment Variables → Add:
- Key: `ANTHROPIC_API_KEY`
- Value: the `sk-ant-...` key from console.anthropic.com
- Environments: Production, Preview, Development

Save.

- [ ] **Step 2: Push the branch**

```bash
git push origin feat/v1.1-wizard
```

- [ ] **Step 3: Preview deploy smoke test**

Vercel auto-creates a preview URL (printed in the CLI output). Open it and run through the same smoke test as Task 32. This time the AI palette should actually work (logo upload → palette appears).

- [ ] **Step 4: Open PR**

```bash
gh pr create --title "Padelboard v1.1 — onboarding wizard" --body "Implements the 3-step wizard (Template → Players → Format), 3 new templates (Broadcast / Classic / Premier), AI-powered palette customization via Claude Vision, and tournament logo upload. See spec at docs/superpowers/specs/2026-04-18-padelboard-v1.1-wizard-design.md."
```

- [ ] **Step 5: Merge + production deploy**

Once satisfied with the preview, merge the PR. Vercel auto-deploys to `padelboard.padellabs.tech`. Retest on production (magic-link signup flow too).

---

## Ship gate

v1.1 ships when:

- [ ] `npm test` is green (`merge-colors` + all v1 tests still pass)
- [ ] `npx tsc --noEmit` has 0 errors
- [ ] `npm run build` succeeds
- [ ] Preview deploy smoke test passes
- [ ] Logo upload + AI palette works end-to-end on production
- [ ] One real club match completes the full Wizard → Operator → Overlay flow with a new template

---

## Appendix — Spec coverage checklist

| Spec requirement | Task(s) |
|---|---|
| 3-column wizard shell | 30 |
| Left rail with 3-step task list | 13 |
| Right preview panel | 14 |
| Framer Motion slide transitions | 30 |
| URL `?step=N` state persistence | 11 |
| Template Broadcast | 5 |
| Template Classic | 6 |
| Template Premier | 7 |
| Template registry | 8 |
| Per-slot color model | 2, 23, 29 |
| Minimal Chip deprecated but still renders | 9 (OverlayRenderer fallback) |
| Step 1 template picker | 17, 18 |
| Step 2 players (no color picker) | 19 |
| Step 2 placeholders | 19 |
| Step 3 format chips w/ tooltips | 20, 22 |
| Step 3 rule toggles w/ tooltips | 21, 22 |
| BO5 removed from UI | 22 (FORMATS array) |
| Color customizer modal | 29 |
| Logo upload | 24, 25 |
| Claude Vision AI palette | 26, 27, 28 |
| Per-slot manual override | 23, 29 |
| Reset to defaults | 29 |
| `tournamentLogoUrl` displayed on overlay | Partially — stored in DB (Tasks 24-25), used by AI palette (Task 26). **Rendering the image on each template overlay is deferred** to a follow-up commit (~1 hr, 3 template edits). Not blocking v1.1 ship. |
| Deploy to Vercel | 33 |
