import { getMatchFlags } from '@/lib/match-flags'
import type { MatchState } from '@/lib/padel-scoring'

export function StatusBadges({ state }: { state: MatchState }) {
  const label = pickLabel(state)
  if (!label) return null
  return (
    <div className="inline-block px-3 py-1 rounded-md bg-[var(--color-lime-tint)] border border-[rgba(196,216,46,0.6)] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text)]">
      {label}
    </div>
  )
}

function pickLabel(state: MatchState): string | null {
  if (state.endReason === 'retired') return 'RET'
  if (state.endReason === 'walkover') return 'W.O.'
  const flags = getMatchFlags(state)
  if (flags.inSuperTiebreak) return 'Super Tiebreak'
  if (flags.inTiebreak) return 'Tiebreak'
  if (flags.matchPointFor) return 'Match point'
  if (flags.setPointFor) return 'Set point'
  if (flags.breakPointFor) return 'Break point'
  if (flags.goldenPoint) return 'Golden point'
  return null
}
