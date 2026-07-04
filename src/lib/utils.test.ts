import { describe, it, expect } from 'vitest'
import { slugify, generateSlug, truncate } from '@/lib/utils'

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips accents', () => {
    expect(slugify('café résumé')).toBe('cafe-resume')
  })

  it('replaces spaces with dashes', () => {
    expect(slugify('un deux trois')).toBe('un-deux-trois')
  })

  it('replaces underscores with dashes', () => {
    expect(slugify('hello_world')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('hello! world? yes.')).toBe('hello-world-yes')
  })

  it('removes leading and trailing dashes', () => {
    expect(slugify('  --hello--  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles french text', () => {
    expect(slugify('L\'apprentissage en s\'amusant')).toBe('lapprentissage-en-samusant')
  })

  it('handles numbers', () => {
    expect(slugify('test 123')).toBe('test-123')
  })
})

describe('generateSlug', () => {
  it('includes timestamp suffix', async () => {
    const slug1 = generateSlug('test')
    await new Promise(r => setTimeout(r, 10))
    const slug2 = generateSlug('test')
    expect(slug1).toMatch(/^test-\d{6}$/)
    expect(slug2).toMatch(/^test-\d{6}$/)
    expect(slug1).not.toBe(slug2)
  })

  it('slugifies the title part', () => {
    const slug = generateSlug('café résumé')
    expect(slug).toMatch(/^cafe-resume-\d{6}$/)
  })
})

describe('truncate', () => {
  it('returns original string when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns original string at exact limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and adds ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('')
  })

  it('handles zero length', () => {
    expect(truncate('hello', 0)).toBe('...')
  })
})
