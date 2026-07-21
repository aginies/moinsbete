import { describe, it, expect } from 'vitest'
import { slugify, generateSlug, truncate, cn, getRandomIcon, getRandomColor, TOPIC_ICONS, TOPIC_COLORS, generateImageId, sanitizeMessage, parseHTML, escapeHtml, isValidUrl, sanitizeUrl } from '@/lib/utils'

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

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4 py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'false-condition')).toBe('base conditional')
  })

  it('handles arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('handles objects', () => {
    expect(cn({ active: true, inactive: false })).toBe('active')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn(null)).toBe('')
    expect(cn(undefined)).toBe('')
    expect(cn(false)).toBe('')
  })

  it('merges conflicting classes', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })
})

describe('getRandomIcon', () => {
  it('returns an icon from TOPIC_ICONS', () => {
    const icon = getRandomIcon()
    expect(TOPIC_ICONS).toContain(icon)
  })

  it('returns different icons on multiple calls', () => {
    const icons = new Set<string>()
    for (let i = 0; i < 50; i++) {
      icons.add(getRandomIcon())
    }
    expect(icons.size).toBeGreaterThan(1)
  })

  it('returns a non-empty string', () => {
    const icon = getRandomIcon()
    expect(icon.length).toBeGreaterThan(0)
  })
})

describe('getRandomColor', () => {
  it('returns a color from TOPIC_COLORS', () => {
    const color = getRandomColor()
    expect(TOPIC_COLORS).toContain(color)
  })

  it('returns different colors on multiple calls', () => {
    const colors = new Set<string>()
    for (let i = 0; i < 50; i++) {
      colors.add(getRandomColor())
    }
    expect(colors.size).toBeGreaterThan(1)
  })

  it('returns a valid hex color', () => {
    const color = getRandomColor()
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('generateImageId', () => {
  it('returns an 8 character hex string', () => {
    const id = generateImageId('https://example.com/image.jpg', '2024-01-01')
    expect(id).toMatch(/^[0-9a-f]{8}$/)
    expect(id.length).toBe(8)
  })

  it('is deterministic for same inputs', () => {
    const id1 = generateImageId('https://example.com/image.jpg', '2024-01-01')
    const id2 = generateImageId('https://example.com/image.jpg', '2024-01-01')
    expect(id1).toBe(id2)
  })

  it('returns different IDs for different fileUrls', () => {
    const id1 = generateImageId('https://example.com/image1.jpg', '2024-01-01')
    const id2 = generateImageId('https://example.com/image2.jpg', '2024-01-01')
    expect(id1).not.toBe(id2)
  })

  it('returns different IDs for different dates', () => {
    const id1 = generateImageId('https://example.com/image.jpg', '2024-01-01')
    const id2 = generateImageId('https://example.com/image.jpg', '2024-01-02')
    expect(id1).not.toBe(id2)
  })
})

describe('sanitizeMessage', () => {
  it('accepts plain text', () => {
    const result = sanitizeMessage('hello world')
    expect(result).toEqual({ valid: true, clean: 'hello world' })
  })

  it('rejects empty string', () => {
    const result = sanitizeMessage('')
    expect(result).toEqual({ valid: false, error: 'Message vide' })
  })

  it('rejects whitespace only', () => {
    const result = sanitizeMessage('   ')
    expect(result).toEqual({ valid: false, error: 'Message vide' })
  })

  it('rejects over max length', () => {
    const result = sanitizeMessage('a'.repeat(251))
    expect(result).toEqual({ valid: false, error: 'Maximum 250 caract\u00e8res' })
  })

  it('accepts exactly max length', () => {
    const result = sanitizeMessage('a'.repeat(250))
    expect(result).toEqual({ valid: true, clean: 'a'.repeat(250) })
  })

  it('strips HTML tags from output', () => {
    const result = sanitizeMessage('<script>alert(1)</script> hello')
    expect(result).toEqual({ valid: true, clean: 'alert(1)  hello' })
  })

  it('strips nested HTML tags', () => {
    const result = sanitizeMessage('<div><b>bold</b></div>')
    expect((result as { valid: true; clean: string }).clean).not.toContain('<')
    expect((result as { valid: true; clean: string }).clean).not.toContain('>')
  })

  it('strips XSS payload', () => {
    const result = sanitizeMessage('<img src=x onerror=alert(1)>')
    expect((result as { valid: true; clean: string }).clean).not.toContain('<img')
  })

  it('preserves URLs in output', () => {
    const result = sanitizeMessage('Check https://example.com for more')
    expect(result).toEqual({ valid: true, clean: 'Check https://example.com for more' })
  })

  it('trims whitespace', () => {
    const result = sanitizeMessage('  hello  ')
    expect(result).toEqual({ valid: true, clean: 'hello' })
  })
})

describe('parseHTML', () => {
  it('escapes HTML entities', () => {
    expect(parseHTML('<b>hello</b>')).toBe('&lt;b&gt;hello&lt;/b&gt;')
  })

  it('converts URLs to links', () => {
    const result = parseHTML('Visit https://example.com today')
    expect(result).toContain('<a href="https://example.com"')
    expect(result).toContain('rel="noopener noreferrer"')
    expect(result).toContain('</a>')
  })

  it('escapes non-URL text', () => {
    const result = parseHTML('<script>alert(1)</script>')
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})

describe('escapeHtml', () => {
  it('escapes all dangerous characters', () => {
    expect(escapeHtml('<a href="test" onclick="x">')).toBe('&lt;a href=&quot;test&quot; onclick=&quot;x&quot;&gt;')
  })

  it('escapes ampersand first', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})

describe('isValidUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('rejects javascript: protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: protocol', () => {
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects null and empty', () => {
    expect(isValidUrl(null)).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
})

describe('sanitizeUrl', () => {
  it('returns valid URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('returns fallback for invalid URL', () => {
    expect(sanitizeUrl('javascript:alert(1)', '/fallback')).toBe('/fallback')
  })

  it('returns fallback for null', () => {
    expect(sanitizeUrl(null)).toBe('/')
  })
})
