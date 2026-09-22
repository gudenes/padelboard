import { describe, expect, it } from 'vitest'
import { routing, locales, hreflangByLocale, localeNames } from '@/i18n/routing'

describe('configuração de routing', () => {
  it('suporta exatamente en, pt, it e es', () => {
    expect([...locales].sort()).toEqual(['en', 'es', 'it', 'pt'])
  })

  it('tem o inglês como default sem prefixo', () => {
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toBe('as-needed')
  })

  it('declara hreflang pt-BR para o locale pt', () => {
    expect(hreflangByLocale.pt).toBe('pt-BR')
  })

  it('tem um hreflang para cada locale suportado', () => {
    expect(Object.keys(hreflangByLocale).sort()).toEqual([...locales].sort())
  })

  it('tem um nome para cada locale suportado', () => {
    expect(Object.keys(localeNames).sort()).toEqual([...locales].sort())
  })

  it('nomeia cada língua na própria língua', () => {
    expect(localeNames).toEqual({
      en: 'English',
      pt: 'Português',
      it: 'Italiano',
      es: 'Español',
    })
  })
})
