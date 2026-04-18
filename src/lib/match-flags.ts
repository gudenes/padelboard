// src/lib/match-flags.ts — Derived flags for UI badges (GOLDEN / SET / MATCH POINT etc)

import { apply, type MatchState, type TeamId } from './padel-scoring'

export interface MatchFlags {
  goldenPoint: boolean
  breakPointFor: TeamId | null
  setPointFor: TeamId | null
  matchPointFor: TeamId | null
  inTiebreak: boolean
  inSuperTiebreak: boolean
}

export function getMatchFlags(state: MatchState): MatchFlags {
  const flags: MatchFlags = {
    goldenPoint: false,
    breakPointFor: null,
    setPointFor: null,
    matchPointFor: null,
    inTiebreak: state.phase === 'tiebreak',
    inSuperTiebreak: state.phase === 'super-tiebreak',
  }

  if (state.phase === 'finished') return flags

  // GOLDEN POINT: deuce with golden-point rule on
  if (state.phase === 'playing' && state.config.goldenPoint) {
    const g = state.currentGame as { a: unknown; b: unknown }
    if (g.a === 40 && g.b === 40) flags.goldenPoint = true
  }

  // Simulate awarding the next point to each team to detect BP / SP / MP.
  for (const t of ['a', 'b'] as TeamId[]) {
    const after = apply(state, { kind: 'point_for', team: t })

    // Match point: awarding the next point ends the match in this team's favor.
    if (after.phase === 'finished' && after.winner === t) {
      flags.matchPointFor = t
      continue
    }

    // Set point: awarding the next point advances the sets array (closes current set).
    if (after.sets.length > state.sets.length) {
      flags.setPointFor = t
      continue
    }

    // Break point: the game ended (currentGame reset) and the scoring team isn't serving.
    const prev = state.currentGame as { a: number | string; b: number | string }
    const next = after.currentGame as { a: number | string; b: number | string }
    const gameJustEnded =
      next.a === 0 && next.b === 0 && !(prev.a === 0 && prev.b === 0)
    if (gameJustEnded && t !== state.servingTeam) {
      flags.breakPointFor = t
    }
  }

  return flags
}
