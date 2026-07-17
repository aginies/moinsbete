import { describe, it, expect } from 'vitest'
import { isValidUrl, sanitizeUrl, isValidEmail } from '@/lib/utils'

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('accepts https URLs', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true)
  })

  it('accepts uppercase scheme', () => {
    expect(isValidUrl('HTTP://example.com')).toBe(true)
    expect(isValidUrl('HTTPS://example.com')).toBe(true)
  })

  it('accepts mailto URLs', () => {
    expect(isValidUrl('mailto:test@example.com')).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidUrl(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidUrl(undefined)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('rejects javascript protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data protocol', () => {
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false)
  })

  it('rejects vbscript protocol', () => {
    expect(isValidUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('rejects file protocol', () => {
    expect(isValidUrl('file:///etc/passwd')).toBe(false)
  })

  it('rejects URLs with newlines', () => {
    expect(isValidUrl('http://example.com\nredirect')).toBe(false)
    expect(isValidUrl('http://example.com\rredirect')).toBe(false)
  })

  it('rejects URLs over max length', () => {
    const longUrl = 'http://' + 'a'.repeat(2100) + '.com'
    expect(isValidUrl(longUrl)).toBe(false)
  })

  it('accepts valid URL with query params', () => {
    expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true)
  })

  it('accepts URL with port', () => {
    expect(isValidUrl('http://localhost:3000')).toBe(true)
  })

  it('rejects invalid URL structure', () => {
    expect(isValidUrl('http://')).toBe(false)
    expect(isValidUrl('http://example.com:99999')).toBe(false)
  })
})

describe('sanitizeUrl', () => {
  it('returns valid URL trimmed', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
  })

  it('returns fallback for invalid URL', () => {
    expect(sanitizeUrl('not-a-url')).toBe('/')
  })

  it('returns custom fallback', () => {
    expect(sanitizeUrl('bad', '/fallback')).toBe('/fallback')
  })

  it('returns fallback for null', () => {
    expect(sanitizeUrl(null)).toBe('/')
  })

  it('returns fallback for undefined', () => {
    expect(sanitizeUrl(undefined)).toBe('/')
  })
})

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('accepts email with dots, plus, digits', () => {
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
  })

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidEmail(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidEmail(undefined)).toBe(false)
  })

  it('rejects whitespace in email', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })

  it('accepts leading/trailing spaces (trims)', () => {
    expect(isValidEmail(' user@example.com')).toBe(true)
    expect(isValidEmail('user@example.com ')).toBe(true)
  })

  it('rejects email over 254 chars', () => {
    const longEmail = 'a'.repeat(245) + '@example.com'
    expect(isValidEmail(longEmail)).toBe(false)
  })
})
