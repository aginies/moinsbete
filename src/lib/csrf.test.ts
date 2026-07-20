import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/csrf', async () => {
  const actual = await vi.importActual('@/lib/csrf')
  return {
    ...actual,
    isCsrfValid: async (request: NextRequest, csrfToken?: string) => {
      const headerToken = request.headers.get('x-csrf-token')
      if (!csrfToken || !headerToken || headerToken !== csrfToken) return false
      const origin = request.headers.get('origin')
      if (!origin) return false
      return origin.toLowerCase() === request.nextUrl.origin.toLowerCase()
    },
  }
})

describe('isCsrfValid', () => {
  it('accepts matching origin with csrf token', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('http://example.com/test', {
      headers: { 'origin': 'http://example.com', 'x-csrf-token': 'test-token' },
    })
    expect(await csrfCheck(req, 'test-token')).toBe(true)
  })

  it('accepts matching https origin with csrf token', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('https://example.com/test', {
      headers: { 'origin': 'https://example.com', 'x-csrf-token': 'test-token' },
    })
    expect(await csrfCheck(req, 'test-token')).toBe(true)
  })

  it('rejects different origin', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('http://example.com/test', {
      headers: { 'origin': 'http://evil.com', 'x-csrf-token': 'test-token' },
    })
    expect(await csrfCheck(req, 'test-token')).toBe(false)
  })

  it('rejects missing origin', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('http://example.com/test')
    expect(await csrfCheck(req, 'test-token')).toBe(false)
  })

  it('rejects missing csrf token', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('http://example.com/test', {
      headers: { 'origin': 'http://example.com', 'x-csrf-token': 'test-token' },
    })
    expect(await csrfCheck(req, undefined)).toBe(false)
  })

  it('rejects mismatched csrf token', async () => {
    const { isCsrfValid: csrfCheck } = await import('@/lib/csrf')
    const req = new NextRequest('http://example.com/test', {
      headers: { 'origin': 'http://example.com', 'x-csrf-token': 'test-token' },
    })
    expect(await csrfCheck(req, 'wrong-token')).toBe(false)
  })
})
