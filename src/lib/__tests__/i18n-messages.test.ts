import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import pt from '@/messages/pt.json'
import it_ from '@/messages/it.json'
import es from '@/messages/es.json'

type Messages = Record<string, unknown>

/** Achata { a: { b: "x" } } em ["a.b"], para comparar estruturas. */
function flattenKeys(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object'
      ? flattenKeys(value as Messages, path)
      : [path]
  })
}

describe('ficheiros de mensagens', () => {
  const englishKeys = flattenKeys(en as Messages).sort()

  it('en.json não está vazio', () => {
    expect(englishKeys.length).toBeGreaterThan(0)
  })

  for (const [locale, messages] of Object.entries({ pt, it: it_, es })) {
    it(`${locale} tem exatamente as chaves de en`, () => {
      const localeKeys = flattenKeys(messages as Messages).sort()

      const missing = englishKeys.filter((k) => !localeKeys.includes(k))
      const extra = localeKeys.filter((k) => !englishKeys.includes(k))

      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    })
  }
})
