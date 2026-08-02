import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeAndCachePortailLexicalWotd } from './cache-portail-lexical'

vi.mock('@/lib/db', () => ({
  prisma: {
    portailLexicalMotDuJour: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('scrapeAndCachePortailLexicalWotd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('fetches today\'s word of the day and saves it if not already in the db', async () => {
    const mockWord = 'test-word'
    const today = new Date().toISOString().split('T')[0]

    // Mock fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ form: mockWord }),
    } as Response)

    // Mock prisma responses
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.portailLexicalMotDuJour.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.portailLexicalMotDuJour.create).mockResolvedValue({
      id: 'id-1',
      word: mockWord,
      date: today,
      createdAt: new Date(),
    })

    await scrapeAndCachePortailLexicalWotd()

    expect(fetch).toHaveBeenCalledWith('https://www.portail-lexical.fr/api/wotd', expect.any(Object))
    expect(prisma.portailLexicalMotDuJour.findUnique).toHaveBeenCalledWith({
      where: { date: today },
    })
    expect(prisma.portailLexicalMotDuJour.create).toHaveBeenCalledWith({
      data: { date: today, word: mockWord },
    })
  })

  it('updates the word if it is different from what\'s stored for today', async () => {
    const mockWord = 'new-word'
    const today = new Date().toISOString().split('T')[0]

    // Mock fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ form: mockWord }),
    } as Response)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.portailLexicalMotDuJour.findUnique).mockResolvedValue({
      id: 'id-1',
      word: 'old-word',
      date: today,
      createdAt: new Date(),
    })

    await scrapeAndCachePortailLexicalWotd()

    expect(prisma.portailLexicalMotDuJour.update).toHaveBeenCalledWith({
      where: { date: today },
      data: { word: mockWord },
    })
  })

  it('does nothing if the word is already up to date', async () => {
    const mockWord = 'same-word'
    const today = new Date().toISOString().split('T')[0]

    // Mock fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ form: mockWord }),
    } as Response)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.portailLexicalMotDuJour.findUnique).mockResolvedValue({
      id: 'id-1',
      word: mockWord,
      date: today,
      createdAt: new Date(),
    })

    await scrapeAndCachePortailLexicalWotd()

    expect(prisma.portailLexicalMotDuJour.update).not.toHaveBeenCalled()
    expect(prisma.portailLexicalMotDuJour.create).not.toHaveBeenCalled()
  })
})
