import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filterAirCrashTitles, scrapeAndCacheAirCrash } from './cache-air-crash'

vi.mock('@/lib/db', () => ({
  prisma: {
    cachedAirCrashArticle: {
      upsert: vi.fn((args: unknown) => args),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/portail-wikipedia-fetch', () => ({
  PORTAL_ARTICLE_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  fetchLinksFromPortal: vi.fn(),
  fetchArticleDetails: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('filterAirCrashTitles', () => {
  it('keeps flight accident articles', () => {
    const links = [
      'Vol United Airlines 811',
      'Vol American Airlines 1420',
      'Prise d\'otages du vol Air France 8969',
      'Attaque du vol DHL en 2003 à Bagdad',
      "Collision aérienne d'Überlingen",
    ]
    expect(filterAirCrashTitles(links)).toEqual([
      'Vol United Airlines 811',
      'Vol American Airlines 1420',
      'Prise d\'otages du vol Air France 8969',
      'Attaque du vol DHL en 2003 à Bagdad',
      "Collision aérienne d'Überlingen",
    ])
  })

  it('drops non-accident links', () => {
    const links = [
      'United Airlines',
      'Boeing 747',
      'Airbus A330',
      'Honolulu',
      'Décompression explosive',
      'Collision aérienne',
      'Vol (aéronautique)',
      'Série télévisée',
    ]
    expect(filterAirCrashTitles(links)).toEqual([])
  })

  it('deduplicates titles', () => {
    expect(filterAirCrashTitles(['Vol Swissair 111', 'Vol Swissair 111'])).toEqual(['Vol Swissair 111'])
  })

  it('handles empty input', () => {
    expect(filterAirCrashTitles([])).toEqual([])
  })
})

describe('scrapeAndCacheAirCrash', () => {
  it('filters links and upserts articles', async () => {
    const { fetchLinksFromPortal, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchLinksFromPortal).mockResolvedValue(['Vol Swissair 111', 'Swissair', 'Boeing 747'])
    vi.mocked(fetchArticleDetails).mockResolvedValue([
      { id: '1', title: 'Vol Swissair 111', extract: 'Le vol 111 s\'écrase.', imageUrl: 'https://img.test/a.jpg', pageUrl: 'https://fr.wikipedia.org/wiki/Vol_Swissair_111' },
    ])
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown[]) => ops as never)

    const count = await scrapeAndCacheAirCrash()

    expect(fetchArticleDetails).toHaveBeenCalledWith(['Vol Swissair 111'])
    expect(count).toBe(1)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as Array<Record<string, unknown>>
    expect(ops[0]).toMatchObject({
      where: { title: 'Vol Swissair 111' },
      create: {
        title: 'Vol Swissair 111',
        description: 'Le vol 111 s\'écrase.',
        url: 'https://fr.wikipedia.org/wiki/Vol_Swissair_111',
        imageUrl: 'https://img.test/a.jpg',
      },
    })
  })

  it('returns 0 when no links found', async () => {
    const { fetchLinksFromPortal, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchLinksFromPortal).mockResolvedValue([])
    vi.mocked(fetchArticleDetails).mockResolvedValue([])

    const count = await scrapeAndCacheAirCrash()

    expect(count).toBe(0)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
