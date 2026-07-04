import { NextRequest } from 'next/server'

export function isCsrfValid(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  return origin.toLowerCase() === request.nextUrl.origin.toLowerCase()
}
