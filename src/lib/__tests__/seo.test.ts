import { describe, expect, it } from 'vitest'
import { localeAlternates } from '@/lib/seo'

describe('localeAlternates', () => {
  it('mapeia cada locale para o seu hreflang, com o inglês sem prefixo', () => {
    expect(localeAlternates('/manifesto')).toEqual({
      en: '/manifesto',
      'pt-BR': '/pt/manifesto',
      it: '/it/manifesto',
      es: '/es/manifesto',
      'x-default': '/manifesto',
    })
  })

  it('trata a raiz sem barra dupla', () => {
    expect(localeAlternates('/')).toEqual({
      en: '/',
      'pt-BR': '/pt',
      it: '/it',
      es: '/es',
      'x-default': '/',
    })
  })
})
