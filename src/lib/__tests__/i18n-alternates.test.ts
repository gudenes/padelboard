import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Rotas indexáveis. A lista é explícita de propósito: acrescentar uma página
 * pública obriga a uma edição deliberada aqui, em vez de esquecer o hreflang
 * em silêncio. Rotas autenticadas não entram — não são indexáveis.
 */
const INDEXABLE = [
  'src/app/[locale]/page.tsx',
  'src/app/[locale]/manifesto/page.tsx',
  'src/app/[locale]/help/page.tsx',
]

describe('alternates por página', () => {
  for (const file of INDEXABLE) {
    it(`${file} declara localeAlternates`, () => {
      expect(readFileSync(file, 'utf8')).toMatch(/localeAlternates\(/)
    })
  }
})
