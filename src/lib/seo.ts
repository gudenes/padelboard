import { hreflangByLocale, locales, routing } from '@/i18n/routing'

/**
 * Constrói o mapa `alternates.languages` do Next para uma rota.
 * O inglês é o default e não leva prefixo; as restantes levam.
 */
export function localeAlternates(pathname: string): Record<string, string> {
  const path = pathname === '/' ? '' : pathname

  return Object.fromEntries(
    locales.map((locale) => [
      hreflangByLocale[locale],
      locale === routing.defaultLocale ? path || '/' : `/${locale}${path}`,
    ]),
  )
}
