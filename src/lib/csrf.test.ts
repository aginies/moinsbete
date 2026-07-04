import { describe, it, expect } from 'vitest'
import { isCsrfValid } from '@/lib/csrf'
import { NextRequest } from 'next/server'

describe('isCsrfValid', () => {
  it('accepts matching origin', () => {
    const req = new NextRequest('http://example.com/test', {
      headers: { origin: 'http://example.com' },
    })
    expect(isCsrfValid(req)).toBe(true)
  })

  it('accepts matching https origin', () => {
    const req = new NextRequest('https://example.com/test', {
      headers: { origin: 'https://example.com' },
    })
    expect(isCsrfValid(req)).toBe(true)
  })

  it('rejects different origin', () => {
    const req = new NextRequest('http://example.com/test', {
      headers: { origin: 'http://evil.com' },
    })
    expect(isCsrfValid(req)).toBe(false)
  })

  it('rejects missing origin', () => {
    const req = new NextRequest('http://example.com/test')
    expect(isCsrfValid(req)).toBe(false)
  })

  it('case-insensitive origin comparison', () => {
    const req = new NextRequest('http://EXAMPLE.com/test', {
      headers: { origin: 'http://example.com' },
    })
    expect(isCsrfValid(req)).toBe(true)
  })

  it('rejects empty origin', () => {
    const req = new NextRequest('http://example.com/test', {
      headers: { origin: '' },
    })
    expect(isCsrfValid(req)).toBe(false)
  })
})
