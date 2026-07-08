import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

export async function generateCsrfToken(): Promise<string> {
  const crypto = await import('node:crypto')
  return crypto.randomUUID()
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(CSRF_COOKIE_NAME)
  return cookie?.value ?? null
}

export async function isCsrfValid(request: NextRequest, overrideToken?: string): Promise<boolean> {
  const cookieToken = overrideToken ?? ((await (await import('next/headers')).cookies()).get(CSRF_COOKIE_NAME)?.value)

  if (!cookieToken) return false

  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (!headerToken || headerToken !== cookieToken) return false

  const origin = request.headers.get('origin')
  if (!origin) return false
  return origin.toLowerCase() === request.nextUrl.origin.toLowerCase()
}

export async function setCsrfTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 86400,
  })
}
