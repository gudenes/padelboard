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

/** Achata em { "a.b": "valor" }, para comparar conteúdos. */
function flattenValues(obj: Messages, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object') {
      Object.assign(acc, flattenValues(value as Messages, path))
    } else {
      acc[path] = String(value)
    }
    return acc
  }, {})
}

/**
 * Extrai os marcadores ICU de uma mensagem: `{placeholders}` e `<tags>`.
 * A paridade de chaves não chega — uma tradução que perca um `{name}` ou
 * feche mal um `</b>` tem as chaves todas e rebenta em runtime.
 */
function markersOf(message: string): string[] {
  return [
    ...(message.match(/\{\s*(\w+)/g) ?? []).map((m) => m.replace(/\s/g, '')),
    ...(message.match(/<\/?\s*(\w+)\s*>/g) ?? []).map((m) => m.replace(/\s/g, '')),
  ].sort()
}

describe('placeholders e tags', () => {
  const english = flattenValues(en as Messages)

  for (const [locale, messages] of Object.entries({ pt, it: it_, es })) {
    it(`${locale} preserva todos os placeholders e tags de en`, () => {
      const translated = flattenValues(messages as Messages)

      const broken = Object.keys(english)
        .filter(
          (key) =>
            markersOf(english[key]).join() !== markersOf(translated[key] ?? '').join(),
        )
        .map((key) => ({
          key,
          en: markersOf(english[key]),
          [locale]: markersOf(translated[key] ?? ''),
        }))

      expect(broken).toEqual([])
    })
  }
})
