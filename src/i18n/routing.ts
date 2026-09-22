import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'pt', 'it', 'es'] as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // Inglês sem prefixo; pt/it/es com prefixo. Ver secção 1 do spec.
  localePrefix: 'as-needed',
})

// O URL usa `pt`, mas o conteúdo é pt-BR e é isso que o hreflang declara.
export const hreflangByLocale: Record<Locale, string> = {
  en: 'en',
  pt: 'pt-BR',
  it: 'it',
  es: 'es',
}
