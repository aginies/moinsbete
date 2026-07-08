import { describe, it, expect } from 'vitest'
import { slugify, generateSlug, truncate, cn, getRandomIcon, getRandomColor, TOPIC_ICONS, TOPIC_COLORS } from '@/lib/utils'

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
