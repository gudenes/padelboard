import { describe, expect, it } from 'vitest'
import { parsePlayerProfile } from '@/lib/player-profile'

const valid = {
  name: 'Gu',
  role: 'player',
  club: '',
  color: '#f5ff36',
  style: 'headband',
}

describe('locale no perfil', () => {
  it('aceita um perfil sem locale', () => {
    expect(parsePlayerProfile(valid).locale).toBeUndefined()
  })

  it('guarda um locale suportado', () => {
    expect(parsePlayerProfile({ ...valid, locale: 'pt' }).locale).toBe('pt')
  })

  it('ignora um locale não suportado em vez de lançar', () => {
    expect(parsePlayerProfile({ ...valid, locale: 'de' }).locale).toBeUndefined()
  })

  it('ignora um locale que não é string', () => {
    expect(parsePlayerProfile({ ...valid, locale: 7 }).locale).toBeUndefined()
  })
})
