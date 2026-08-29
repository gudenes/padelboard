import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs a test', () => {
    expect(1 + 1).toBe(2)
  })

  it('exposes a health handler', async () => {
    const mod = await import('../../app/api/health/route')
    expect(typeof mod.GET).toBe('function')
    const res = mod.GET()
    expect(res.status).toBe(200)
  })
})
