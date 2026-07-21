import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/request'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie: {
    name: 'locale',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  },
})

export const config = {
  matcher: ['/((?!.*\\..*|_next|favicon\\.ico|manifest\\.json|icon-.*\\.svg|api).*)'],
}
