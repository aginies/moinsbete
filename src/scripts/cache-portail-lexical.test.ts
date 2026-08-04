import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeAndCachePortailLexicalWotd } from './cache-portail-lexical'

vi.mock('@/lib/db', () => ({
  prisma: {
    portailLexicalMotDuJour: {
      upsert: vi.fn(),
    },
  },
}))

describe('scrapeAndCachePortailLexicalWotd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('upserts today\'s word of the day', async () => {
    const mockWord = 'test-word'
    const today = new Date().toISOString().split('T')[0]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ form: mockWord }),
    } as Response)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.portailLexicalMotDuJour.upsert).mockResolvedValue({
      id: 'id-1',
      word: mockWord,
      date: today,
      createdAt: new Date(),
    })

    await scrapeAndCachePortailLexicalWotd()

    expect(fetch).toHaveBeenCalledWith('https://www.portail-lexical.fr/api/wotd', expect.any(Object))
    expect(prisma.portailLexicalMotDuJour.upsert).toHaveBeenCalledWith({
      where: { date: today },
      create: { date: today, word: mockWord },
      update: { word: mockWord },
    })
  })

  it('handles API error gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const { prisma } = await import('@/lib/db')

    await scrapeAndCachePortailLexicalWotd()

    expect(prisma.portailLexicalMotDuJour.upsert).not.toHaveBeenCalled()
  })

  it('handles invalid response format', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const { prisma } = await import('@/lib/db')

    await scrapeAndCachePortailLexicalWotd()

    expect(prisma.portailLexicalMotDuJour.upsert).not.toHaveBeenCalled()
  })
})
