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
