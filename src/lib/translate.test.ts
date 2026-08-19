import { describe, it, expect, vi, afterEach } from 'vitest'
import { chunkText, translateEnToFr } from './translate'

describe('chunkText', () => {
  it('returns empty array for empty text', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   ')).toEqual([])
  })

  it('returns single chunk when under limit', () => {
    expect(chunkText('Short text.')).toEqual(['Short text.'])
  })

  it('splits at sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence.'
    const chunks = chunkText(text, 30)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(30)
    }
    expect(chunks.join('')).toBe(text)
  })

  it('force-splits long sentence by words', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    const chunks = chunkText(words, 20)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(20)
    }
    expect(chunks.join(' ')).toBe(words)
  })

  it('handles text without punctuation', () => {
    const text = 'no punctuation here at all just words'
    const chunks = chunkText(text, 15)
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(15)
    }
    expect(chunks.join(' ')).toBe(text)
  })

  it('keeps newlines inside chunks', () => {
    const text = 'Para one line.\n\nPara two line.'
    const chunks = chunkText(text, 100)
    expect(chunks).toEqual([text])
  })
})

describe('translateEnToFr', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockMyMemory(translations: Record<string, string | null>) {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = new URL(url)
      const q = u.searchParams.get('q') ?? ''
      const translated = translations[q]
      if (translated === null || translated === undefined) {
        return new Response(JSON.stringify({ responseData: { translatedText: 'MYMEMORY WARNING - quota exceeded' }, responseStatus: 403 }), { status: 200 })
      }
      return new Response(JSON.stringify({ responseData: { translatedText: translated }, responseStatus: 200 }), { status: 200 })
    }))
  }

  it('returns empty string for empty text without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(translateEnToFr('   ')).resolves.toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('translates short text in single call', async () => {
    mockMyMemory({ 'Hello world': 'Bonjour le monde' })
    await expect(translateEnToFr('Hello world')).resolves.toBe('Bonjour le monde')
  })

  it('splits long text and joins translations', async () => {
    const s1 = 'First sentence here.'
    const s2 = 'Second sentence here.'
    const text = `${s1} ${s2}`
    mockMyMemory({
      [`${s1} `]: 'Première phrase ici. ',
      [s2]: 'Deuxième phrase ici.',
    })
    const result = await translateEnToFr(text, 30)
    expect(result).toBe('Première phrase ici. Deuxième phrase ici.')
  })

  it('returns null when a chunk fails', async () => {
    const s1 = 'First sentence here.'
    const s2 = 'Second sentence here.'
    mockMyMemory({
      [`${s1} `]: 'Première phrase ici. ',
      [s2]: null,
    })
    await expect(translateEnToFr(`${s1} ${s2}`, 30)).resolves.toBeNull()
  })

  it('returns null on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('error', { status: 500 })))
    await expect(translateEnToFr('Hello')).resolves.toBeNull()
  })

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network') }))
    await expect(translateEnToFr('Hello')).resolves.toBeNull()
  })
})
