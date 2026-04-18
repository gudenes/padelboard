// src/lib/__tests__/merge-colors.test.ts
import { describe, it, expect } from 'vitest'
import { mergeColors } from '@/lib/templates/merge-colors'

const defaults = {
  playerRow: { bg: '#000', text: '#fff' },
  scoreAccent: { bg: '#ff0', text: '#000' },
}

describe('mergeColors', () => {
  it('returns defaults when no overrides', () => {
    const merged = mergeColors(defaults, {})
    expect(merged).toEqual(defaults)
  })

  it('overrides a single field within a slot, preserving others', () => {
    const merged = mergeColors(defaults, { playerRow: { text: '#abc' } })
    expect(merged.playerRow).toEqual({ bg: '#000', text: '#abc' })
    expect(merged.scoreAccent).toEqual({ bg: '#ff0', text: '#000' })
  })

  it('adds a new slot from overrides (e.g. legacy shape)', () => {
    const merged = mergeColors(defaults, { extra: { color: '#123' } })
    expect(merged.extra).toEqual({ color: '#123' })
  })

  it('is immutable — does not mutate inputs', () => {
    const def = { playerRow: { bg: '#000' } }
    const override = { playerRow: { bg: '#fff' } }
    mergeColors(def, override)
    expect(def.playerRow.bg).toBe('#000')
    expect(override.playerRow.bg).toBe('#fff')
  })
})
