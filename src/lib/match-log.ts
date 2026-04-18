// src/lib/match-log.ts — Thin wrapper over the pure scoring engine that supports
// undo by replaying all recorded actions from the initial state.

import {
  apply,
  createInitialState,
  type Action,
  type MatchConfig,
  type MatchState,
} from './padel-scoring'

export interface MatchLog {
  config: MatchConfig
  actions: Action[] // committed actions (undo entries are not stored)
  state: MatchState // current computed state
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
