import { describe, it, expect } from 'vitest'
import { createInitialState } from '@/lib/padel-scoring'

describe('createInitialState', () => {
  it('creates a best-of-3 match ready to play', () => {
    const s = createInitialState({
      format: 'bo3',
      goldenPoint: true,
      superTiebreak: true,
      setTiebreakAt: 6,
    })
    expect(s.config.format).toBe('bo3')
    expect(s.sets).toEqual([{ a: 0, b: 0 }])
    expect(s.currentGame).toEqual({ a: 0, b: 0 })
    expect(s.servingTeam).toBe('a')
    expect(s.servingPlayer).toBe(0)
    expect(s.phase).toBe('playing')
    expect(s.winner).toBeNull()
    expect(s.endReason).toBeNull()
  })
})
