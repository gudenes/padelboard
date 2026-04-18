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
  | { kind: 'mark_retirement'; team: TeamId }
  | { kind: 'mark_walkover'; team: TeamId }
  | { kind: 'correct_score'; patch: Partial<MatchState> }
  | { kind: 'reset' }

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

const NEXT_POINT: Record<0 | 15 | 30, Points> = {
  0: 15,
  15: 30,
  30: 40,
}

export function apply(state: MatchState, action: Action): MatchState {
  if (state.phase === 'finished') return state
  switch (action.kind) {
    case 'point_for':
      return pointFor(state, action.team)
    case 'mark_retirement':
      return { ...state, phase: 'finished', winner: other(action.team), endReason: 'retired' }
    case 'mark_walkover':
      return { ...state, phase: 'finished', winner: other(action.team), endReason: 'walkover' }
    case 'correct_score':
      return { ...state, ...action.patch }
    case 'reset':
      return createInitialState(state.config)
    case 'set_golden_point':
      return { ...state, config: { ...state.config, goldenPoint: action.value } }
    case 'set_format':
      return { ...state, config: { ...state.config, format: action.value } }
    case 'undo':
      // Undo is handled by the match-log wrapper, not the pure reducer.
      return state
    default:
      return state
  }
}

function other(team: TeamId): TeamId {
  return team === 'a' ? 'b' : 'a'
}

function pointFor(state: MatchState, team: TeamId): MatchState {
  if (state.phase === 'tiebreak' || state.phase === 'super-tiebreak') {
    return pointInTiebreak(state, team)
  }
  return pointInGame(state, team)
}

function pointInGame(state: MatchState, team: TeamId): MatchState {
  const game = state.currentGame as { a: Points; b: Points }
  const mine = game[team]
  const theirs = game[other(team)]

  // Advantage resolution
  if (mine === 'Adv') return finishGame(state, team)
  if (theirs === 'Adv') {
    return { ...state, currentGame: { ...game, [other(team)]: 40 as Points } }
  }

  // Deuce
  if (mine === 40 && theirs === 40) {
    if (state.config.goldenPoint) return finishGame(state, team)
    return { ...state, currentGame: { ...game, [team]: 'Adv' as Points } }
  }

  // Win from 40 when opponent is not 40/Adv
  if (mine === 40) return finishGame(state, team)

  // Normal progression
  const next = NEXT_POINT[mine as 0 | 15 | 30]
  return { ...state, currentGame: { ...game, [team]: next } }
}

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

  // 6-6 tiebreak entry
  if (a === 6 && b === 6 && state.config.setTiebreakAt === 6 && !setComplete) {
    return { ...state, phase: 'tiebreak', currentGame: { a: 0, b: 0 } }
  }

  if (!setComplete) return state

  const setWinner: TeamId = a > b ? 'a' : 'b'
  const matchOver = checkMatchOver(state.sets, state.config)
  if (matchOver) {
    return { ...state, phase: 'finished', winner: setWinner, endReason: 'completed' }
  }

  const nextSets = [...state.sets, { a: 0, b: 0 }]
  if (state.config.superTiebreak && isDecidingSet(nextSets, state.config)) {
    return { ...state, sets: nextSets, phase: 'super-tiebreak', currentGame: { a: 0, b: 0 } }
  }
  return { ...state, sets: nextSets }
}

function isSetComplete(a: number, b: number, config: MatchConfig): boolean {
  if (config.format === 'pro-set') {
    return (a >= 9 || b >= 9) && Math.abs(a - b) >= 2
  }
  // bo3 / bo5 / single-set: standard 6-game set with 7-6 tiebreak and 7-5.
  if (a === 7 && b === 6) return true
  if (a === 6 && b === 7) return true
  return (a >= 6 || b >= 6) && Math.abs(a - b) >= 2
}

function setsNeededFor(format: MatchFormat): number {
  if (format === 'bo5') return 3
  if (format === 'bo3') return 2
  // pro-set and single-set end in one "set"
  return 1
}

function checkMatchOver(sets: SetScore[], config: MatchConfig): boolean {
  const needed = setsNeededFor(config.format)
  let aSets = 0
  let bSets = 0
  for (const s of sets) {
    if (!isSetComplete(s.a, s.b, config)) continue
    if (s.a > s.b) aSets++
    else bSets++
  }
  return aSets >= needed || bSets >= needed
}

function isDecidingSet(sets: SetScore[], config: MatchConfig): boolean {
  // Super-tiebreak replaces a deciding set — only meaningful for bo3/bo5.
  if (config.format !== 'bo3' && config.format !== 'bo5') return false
  const needed = setsNeededFor(config.format)
  let aSets = 0
  let bSets = 0
  for (let i = 0; i < sets.length - 1; i++) {
    const s = sets[i]
    if (!isSetComplete(s.a, s.b, config)) continue
    if (s.a > s.b) aSets++
    else bSets++
  }
  return aSets === needed - 1 && bSets === needed - 1
}

function pointInTiebreak(state: MatchState, team: TeamId): MatchState {
  const tb = state.currentGame as { a: number; b: number }
  const totalPoints = tb.a + tb.b + 1 // points played including the one just won
  const mine = tb[team] + 1
  const theirs = tb[other(team)]
  const threshold = state.phase === 'super-tiebreak' ? 10 : 7

  let next: MatchState = { ...state, currentGame: { ...tb, [team]: mine } }

  // Serve rotation in tiebreak: change after point 1, then every 2 points.
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

function closeTiebreak(state: MatchState, winner: TeamId): MatchState {
  const setIndex = state.sets.length - 1
  const wasSuper = state.phase === 'super-tiebreak'
  const sets = state.sets.map((s, i) => {
    if (i !== setIndex) return s
    if (wasSuper) {
      // Super-tiebreak sets are recorded as 1-0 (not 7-6)
      return { a: winner === 'a' ? 1 : 0, b: winner === 'b' ? 1 : 0 }
    }
    return {
      a: winner === 'a' ? s.a + 1 : s.a,
      b: winner === 'b' ? s.b + 1 : s.b,
    }
  })
  const base: MatchState = {
    ...state,
    sets,
    currentGame: { a: 0, b: 0 },
    phase: 'playing',
  }
  const matchOver = wasSuper || checkMatchOver(sets, state.config)
  if (matchOver) {
    return { ...base, phase: 'finished', winner, endReason: 'completed' }
  }
  return { ...base, sets: [...sets, { a: 0, b: 0 }] }
}
