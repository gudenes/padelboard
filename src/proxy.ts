import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Excluídos deliberadamente (secção 1 do spec):
  //   overlay  — URL colado como Browser Source no OBS; um prefixo partiria
  //              os placares em uso. A língua vem de matches.overlay.locale.
  //   api      — sem UI; erros traduzidos por Accept-Language.
  //   auth     — redirect registado no dashboard do Supabase; tem de ser estável.
  matcher: [
    '/((?!api|auth|overlay|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
