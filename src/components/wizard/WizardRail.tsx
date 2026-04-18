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
