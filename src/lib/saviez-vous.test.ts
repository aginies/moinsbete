import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    saviezVousFact: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/utils', () => ({
  resolveWikimediaImageUrls: vi.fn((facts) => Promise.resolve(facts)),
}))

describe('getRandomFact', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.saviezVousFact.count).mockReset()
    vi.mocked(prisma.saviezVousFact.findMany).mockReset()
    vi.mocked(prisma.saviezVousFact.update).mockReset()
    const { resolveWikimediaImageUrls } = await import('@/lib/utils')
    vi.mocked(resolveWikimediaImageUrls).mockReset()
    const { factCache } = await import('@/lib/saviez-vous')
    factCache.clear()
  })

  it('returns null when no facts exist', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.saviezVousFact.count).mockResolvedValue(0)

    const { getRandomFact } = await import('@/lib/saviez-vous')
    const result = await getRandomFact()
    expect(result).toBeNull()
  })

  it('returns a random fact when facts exist', async () => {
    const mockFact = {
      id: 'fact-1',
      text: 'Test fact',
      sourceUrl: 'https://example.com',
      imageFilename: null,
      createdAt: new Date(),
    }
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.saviezVousFact.count).mockResolvedValue(1)
    vi.mocked(prisma.saviezVousFact.findMany).mockResolvedValue([mockFact])

    const { getRandomFact } = await import('@/lib/saviez-vous')
    const result = await getRandomFact()

    expect(result).not.toBeNull()
    expect(result!.id).toBe('fact-1')
    expect(result!.text).toBe('Test fact')
  })

  it('caches result for the same day', async () => {
    const mockFact = {
      id: 'fact-1',
      text: 'Cached fact',
      sourceUrl: null,
      imageFilename: null,
      createdAt: new Date(),
    }
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.saviezVousFact.count).mockResolvedValue(1)
    vi.mocked(prisma.saviezVousFact.findMany).mockResolvedValue([mockFact])

    const { getRandomFact } = await import('@/lib/saviez-vous')
    await getRandomFact()
    const firstCallCount = vi.mocked(prisma.saviezVousFact.findMany).mock.calls.length
    await getRandomFact()
    const secondCallCount = vi.mocked(prisma.saviezVousFact.findMany).mock.calls.length
    expect(secondCallCount).toBe(firstCallCount)
  })
})
