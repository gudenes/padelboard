import { describe, expect, it } from 'vitest'
import { apply, createInitialState, getDeuceRule, isStarPoint, type MatchConfig, type MatchState, type TeamId } from '../padel-scoring'
import { getMatchFlags } from '../match-flags'
import { createLog, recordAction } from '../match-log'

const config: MatchConfig = { format: 'bo3', goldenPoint: false, deuceRule: 'star-point', superTiebreak: false, setTiebreakAt: 6 }
const points = (state: MatchState, sequence: TeamId[]) => sequence.reduce((s, team) => apply(s, {kind: 'point_for', team}), state)
const deuce = () => points(createInitialState(config), ['a','a','a','b','b','b'])

describe('FIP Star Point', () => {
  it('allows two advantage cycles, then either pair can win the deciding point', () => {
    const first = deuce()
    expect(isStarPoint(first)).toBe(false)
    const advantage = points(first, ['a'])
    expect(advantage.currentGame).toEqual({a:'Adv', b:40})
    const second = points(advantage, ['b'])
    expect(second.advantageReturns).toBe(1)
    expect(isStarPoint(second)).toBe(false)
    // The second advantage may belong to the OTHER pair; the count is per game.
    const third = points(second, ['b','a'])
    expect(third.currentGame).toEqual({a:40,b:40})
    expect(third.advantageReturns).toBe(2)
    expect(isStarPoint(third)).toBe(true)
    expect(getMatchFlags(third).starPoint).toBe(true)
    expect(getMatchFlags(third).goldenPoint).toBe(false)
    for (const winner of ['a','b'] as const) {
      const won = points(third,[winner])
      expect(won.sets[0][winner]).toBe(1)
      expect(won.currentGame).toEqual({a:0,b:0})
      expect(won.advantageReturns).toBe(0)
      expect(isStarPoint(won)).toBe(false)
    }
  })
  it('can finish at either advantage without waiting for Star Point', () => {
    expect(points(deuce(),['a','a']).sets[0].a).toBe(1)
    expect(points(deuce(),['a','b','b','b']).sets[0].b).toBe(1)
  })
  it('resets the counter for the next game and on reset', () => {
    const third = points(deuce(), ['a','b','a','b'])
    const nextGame = points(third, ['b','a','a','a','b','b','b'])
    expect(nextGame.currentGame).toEqual({a:40,b:40})
    expect(isStarPoint(nextGame)).toBe(false)
    expect(points(nextGame,['a']).currentGame.a).toBe('Adv')
    expect(apply(third,{kind:'reset'}).advantageReturns).toBe(0)
  })
  it('undo restores the Star Point and the earlier advantage count', () => {
    let log = createLog(config)
    for (const team of ['a','a','a','b','b','b','a','b','b','a','a'] as TeamId[]) log = recordAction(log,{kind:'point_for',team})
    expect(log.state.sets[0].a).toBe(1)
    log = recordAction(log,{kind:'undo'})
    expect(isStarPoint(log.state)).toBe(true)
    log = recordAction(log,{kind:'undo'})
    expect(log.state.currentGame.b).toBe('Adv')
    expect(log.state.advantageReturns).toBe(1)
  })
  it('never triggers in a tiebreak', () => {
    const tie: MatchState = {...deuce(),phase:'tiebreak',sets:[{a:6,b:6}],advantageReturns:2,currentGame:{a:6,b:6}}
    expect(isStarPoint(tie)).toBe(false)
    expect(points(tie,['a']).phase).toBe('tiebreak')
    expect(points(tie,['a','a']).sets[0].a).toBe(7)
  })
  it('keeps old configs working and gives an explicit rule precedence', () => {
    expect(getDeuceRule({...config,deuceRule:undefined,goldenPoint:true})).toBe('golden-point')
    expect(getDeuceRule({...config,deuceRule:undefined,goldenPoint:false})).toBe('advantage')
    const explicit = {...deuce(),config:{...config,goldenPoint:true}}
    expect(points(explicit,['a']).currentGame.a).toBe('Adv')
    expect(getMatchFlags(explicit).goldenPoint).toBe(false)
    const legacy = {...deuce(),config:{...config,deuceRule:undefined},advantageReturns:undefined}
    expect(points(legacy,['a','b']).advantageReturns).toBe(1)
  })
})
