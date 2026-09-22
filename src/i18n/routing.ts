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

// Os nomes aparecem sempre na própria língua e NUNCA são traduzidos: quem
// precisa do seletor é quem está perdido numa língua que não percebe. Por
// isso vivem aqui e não em src/messages — lá seriam traduzidos pelo processo
// normal e o seletor deixava de servir o seu propósito.
export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  it: 'Italiano',
  es: 'Español',
}
