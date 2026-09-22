import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Todos os .tsx sob um directório, recursivamente. */
function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return tsxFiles(full)
    return full.endsWith('.tsx') ? [full] : []
  })
}

describe('links com consciência de locale', () => {
  it('nenhuma rota sob [locale] importa Link de next/link', () => {
    const offenders = tsxFiles('src/app/[locale]')
      .filter((f) => /from ["']next\/link["']/.test(readFileSync(f, 'utf8')))

    expect(offenders).toEqual([])
  })

  it('o chrome partilhado usa o Link do next-intl', () => {
    for (const f of [
      'src/components/workspace/ProjectFooter.tsx',
      'src/components/home/PublicHeader.tsx',
    ]) {
      expect(readFileSync(f, 'utf8')).not.toMatch(/from ["']next\/link["']/)
    }
  })
})
