import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Chave em falta cai para a string inglesa; nunca se mostra a chave crua.
    getMessageFallback({ key, namespace }) {
      const path = [namespace, key].filter(Boolean).join('.')
      console.warn(`[i18n] chave em falta: ${path} (locale ${locale})`)
      return path
    },
  }
})
