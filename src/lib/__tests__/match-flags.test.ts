import { describe, it, expect } from 'vitest'
import { getMatchFlags } from '@/lib/match-flags'
import { apply, createInitialState, type MatchConfig } from '@/lib/padel-scoring'

const goldenCfg: MatchConfig = {
  format: 'bo3',
  goldenPoint: true,
  superTiebreak: false,
  setTiebreakAt: 6,
}

const classicCfg: MatchConfig = { ...goldenCfg, goldenPoint: false }

describe('getMatchFlags', () => {
  it('GOLDEN POINT at 40-40 when goldenPoint is on', () => {
    let s = createInitialState(goldenCfg)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    expect(getMatchFlags(s).goldenPoint).toBe(true)
  })

  it('no GOLDEN POINT flag at 40-40 when goldenPoint is off', () => {
    let s = createInitialState(classicCfg)
    for (let i = 0; i < 3; i++) {
      s = apply(s, { kind: 'point_for', team: 'a' })
      s = apply(s, { kind: 'point_for', team: 'b' })
    }
    expect(getMatchFlags(s).goldenPoint).toBe(false)
  })

  it('SET POINT when a team is one point from closing the current set', () => {
    let s = createInitialState(classicCfg)
    // A wins 5 games, then 40-0 in next game → set point for A
    for (let g = 0; g < 5; g++) {
      for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    }
    for (let p = 0; p < 3; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    expect(getMatchFlags(s).setPointFor).toBe('a')
  })

  it('MATCH POINT when a team is one point from match win', () => {
    let s = createInitialState(classicCfg)
    // A wins set 1 6-0; then 5-0, 40-0 in set 2 → match point for A
    for (let g = 0; g < 6; g++) for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let g = 0; g < 5; g++) for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    for (let p = 0; p < 3; p++) s = apply(s, { kind: 'point_for', team: 'a' })
    expect(getMatchFlags(s).matchPointFor).toBe('a')
  })

  it('inTiebreak flag when phase is tiebreak', () => {
    let s = createInitialState(classicCfg)
    // Force to 6-6
    for (let i = 0; i < 6; i++) {
      for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'a' })
      for (let p = 0; p < 4; p++) s = apply(s, { kind: 'point_for', team: 'b' })
    }
    expect(getMatchFlags(s).inTiebreak).toBe(true)
  })
})
