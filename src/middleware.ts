import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import i18nMiddleware from '@/i18n/middleware'

export function middleware(request: NextRequest) {
  // Run next-intl locale middleware first
  const i18nResponse = i18nMiddleware(request)
  
  // Then add CSP headers
  const response = i18nResponse instanceof NextResponse ? i18nResponse : NextResponse.next()
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'

  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    `style-src-attr 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.openai.com https://commons.wikimedia.org https://challenges.cloudflare.com`,
    `frame-src https://challenges.cloudflare.com`,
    `media-src 'self' https://cdn.pixabay.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.cookies.set('csp-nonce', nonce, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  return response
}

export const config = {
  matcher: ['/((?!.*\\..*|_next|favicon\\.ico|manifest\\.json|icon-.*\\.svg).*)'],
}
