import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Este próprio ficheiro contém o literal `next/link` no allowlist e nas
 * mensagens de erro, por isso tem de se auto-excluir da varredura.
 */
const ALLOWED = new Set(['src/lib/__tests__/i18n-no-hardcoded-links.test.ts'])

/** Todos os .ts/.tsx sob um directório, recursivamente (sem seguir symlinks). */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    if (!entry.isFile()) return []
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

describe('links com consciência de locale', () => {
  it('nenhum ficheiro em src importa Link do next', () => {
    const offenders = sourceFiles('src')
      .filter((f) => !ALLOWED.has(f))
      .filter((f) => readFileSync(f, 'utf8').includes('next/link'))

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
