import { describe, it, expect } from 'vitest'
import { createLog, recordAction } from '@/lib/match-log'
import type { MatchConfig } from '@/lib/padel-scoring'

const cfg: MatchConfig = {
  format: 'bo3',
  goldenPoint: false,
  superTiebreak: false,
  setTiebreakAt: 6,
}

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

  it('undo rolls back across a game boundary', () => {
    let log = createLog(cfg)
    for (let i = 0; i < 4; i++) log = recordAction(log, { kind: 'point_for', team: 'a' })
    expect(log.state.sets[0]).toEqual({ a: 1, b: 0 })
    expect(log.state.servingTeam).toBe('b')
    log = recordAction(log, { kind: 'undo' })
    expect(log.state.currentGame).toEqual({ a: 40, b: 0 })
    expect(log.state.sets[0]).toEqual({ a: 0, b: 0 })
    expect(log.state.servingTeam).toBe('a')
  })
})
