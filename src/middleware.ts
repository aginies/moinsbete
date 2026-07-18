import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomBytes(16)).toString('base64')
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https://cdn.pixabay.com; frame-ancestors 'none';`

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!.*\\.|api|_next/static|_next/image|favicon.ico).*)'],
}
