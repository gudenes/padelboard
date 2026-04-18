import { describe, it, expect } from 'vitest'
import { generateShortCode } from '@/lib/short-code'

describe('generateShortCode', () => {
  it('returns a 6-character code using the safe alphabet', () => {
    const code = generateShortCode()
    expect(code).toMatch(/^[A-HJKLMNP-Z23-9]{6}$/)
  })

  it('is unlikely to collide over many draws', () => {
    const set = new Set<string>()
    for (let i = 0; i < 1000; i++) set.add(generateShortCode())
    expect(set.size).toBe(1000)
  })
})
