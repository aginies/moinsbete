import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { parseAirCrashWikitext, scrapeAndCacheAirCrash } from './cache-air-crash'

vi.mock('@/lib/db', () => ({
  prisma: {
    cachedAirCrashArticle: {
      upsert: vi.fn((args: unknown) => args),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  },
}))

vi.mock('@/lib/portail-wikipedia-fetch', () => ({
  PORTAL_ARTICLE_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  fetchPageWikitext: vi.fn(),
  fetchArticleDetails: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const SAMPLE_WIKITEXT = [
  '== Épisodes ==',
  'Intro avec [[#Saison 1 (2003)|lien interne]] et [[Accident de décompression#Décompression explosive|section]].',
  '=== Saison 1 (2003) ===',
  '{| class="wikitable"',
  '!width="17"|n°',
  '!width="160"|Titre',
  '!width="260"|Référence du vol',
  '!width="150"|Date de l\'accident',
  '!width="150"|Type d\'appareil',
  '!Cause(s) de la catastrophe',
  '|-',
  '|rowspan="2"|1',
  '|rowspan="2"|\'\'\'La porte de l\'enfer\'\'\'<br>\x27\x27(Unlocking Disaster)\x27\x27',
  '|[[Vol United Airlines 811]]',
  '|{{date-|24 février 1989}}',
  '|[[Boeing 747|Boeing 747-100]]',
  '|Décompression explosive',
  '|-',
  '| bgcolor="#ffffff" colspan="5"|Texte avec [[United Airlines]] et [[Honolulu]].',
  '|-',
  '|rowspan="2"|2',
  '|rowspan="2"|\'\'\'Feu à bord\'\'\'',
  '|[[Vol Swissair 111]]',
  '|{{date-|2 septembre 1998}}',
  '|[[McDonnell Douglas MD-11]]',
  '|Incendie en vol',
  '|}',
  '=== Saison 3 (2005-2006) ===',
  '{| class="wikitable"',
  '!n°',
  '!Titre',
  '!Référence du vol',
  '!Date',
  '!Type',
  '!Cause',
  '|-',
  '|rowspan="2"|9',
  '|rowspan="2"|\'\'\'Le train fou\'\'\'',
  '|{{Lien|langue=en|trad=San Bernardino train disaster|fr=Catastrophe ferroviaire de San Bernardino}}',
  '|{{date-|12 mai 1989}}',
  '|Locomotive',
  '|Panne de frein',
  '|}',
  '=== Épisodes spéciaux et hors-série ===',
  'Dans la version anglophone, ces épisodes portent le nom de « \'\'Air Crash Investigation Special Report\'\' » :',
  '* \'\'\'Saison 6\'\'\' : Trois épisodes. L\'épisode évoque en plus les deux accidents du [[De Havilland Comet]] :',
  '** « Séquences spectaculaires » : [[Vol BOAC 781]] et [[Vol South African Airways 201]].',
  '* \'\'\'Saison 8\'\'\' : évoque la [[collision aérienne du Grand Canyon]] entre un [[Douglas DC-7]] et un [[Lockheed Constellation|Lockheed L-1049 Super Constellation]] :',
  '** « Panne générale » : [[Collision aérienne du Grand Canyon]] et [[Vol Avianca 052]].',
  '== Notes et références ==',
  '=== Notes ===',
].join('\n')

describe('parseAirCrashWikitext', () => {
  it('extracts refs from season tables', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    expect(titles).toContain('Vol United Airlines 811')
    expect(titles).toContain('Vol Swissair 111')
    expect(titles).toContain('Catastrophe ferroviaire de San Bernardino')
  })

  it('extracts refs from specials section', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    expect(titles).toContain('Vol BOAC 781')
    expect(titles).toContain('Vol South African Airways 201')
    expect(titles).toContain('Vol Avianca 052')
  })

  it('excludes non-accident aircraft links from specials', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    expect(titles).not.toContain('De Havilland Comet')
    expect(titles).not.toContain('Douglas DC-7')
    expect(titles).not.toContain('Lockheed Constellation')
  })

  it('excludes internal and section links', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    expect(titles).not.toContain('#Saison 1 (2003)')
    expect(titles).not.toContain('Accident de décompression')
  })

  it('does not include links from description rows or aircraft cells', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    expect(titles).not.toContain('United Airlines')
    expect(titles).not.toContain('Honolulu')
    expect(titles).not.toContain('Boeing 747')
  })

  it('deduplicates case-insensitively keeping first occurrence', () => {
    const titles = parseAirCrashWikitext(SAMPLE_WIKITEXT)
    const matches = titles.filter(t => t.toLowerCase() === 'collision aérienne du grand canyon')
    expect(matches).toEqual(['collision aérienne du Grand Canyon'])
  })

  it('returns empty array when episodes section missing', () => {
    expect(parseAirCrashWikitext('== Intro ==\nTexte sans épisodes.')).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(parseAirCrashWikitext('')).toEqual([])
  })
})

describe('scrapeAndCacheAirCrash', () => {
  it('parses wikitext, fetches details and upserts articles', async () => {
    const { fetchPageWikitext, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchPageWikitext).mockResolvedValue(SAMPLE_WIKITEXT)
    vi.mocked(fetchArticleDetails).mockResolvedValue([
      { id: '1', title: 'Vol Swissair 111', extract: 'Le vol 111 s\'écrase.', imageUrl: 'https://img.test/a.jpg', pageUrl: 'https://fr.wikipedia.org/wiki/Vol_Swissair_111' },
    ])
    const transaction = vi.mocked(prisma.$transaction) as unknown as Mock
    transaction.mockImplementation(async (ops: unknown[]) => ops)
    vi.mocked(prisma.cachedAirCrashArticle.findMany).mockResolvedValue([])

    const count = await scrapeAndCacheAirCrash()

    expect(fetchPageWikitext).toHaveBeenCalledWith('Air_Crash')
    const titles = vi.mocked(fetchArticleDetails).mock.calls[0][0]
    expect(titles).toContain('Vol Swissair 111')
    expect(titles).toContain('Vol United Airlines 811')
    expect(count).toBe(1)
    expect(transaction).toHaveBeenCalledTimes(1)
    const ops = transaction.mock.calls[0][0] as Array<Record<string, unknown>>
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

  it('removes stale rows not in current list', async () => {
    const { fetchPageWikitext, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchPageWikitext).mockResolvedValue(SAMPLE_WIKITEXT)
    vi.mocked(fetchArticleDetails).mockImplementation(async (titles: string[]) =>
      titles.map((title, i) => ({
        id: String(i + 1),
        title,
        extract: 'Extrait.',
        imageUrl: null,
        pageUrl: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      }))
    )
    const transaction = vi.mocked(prisma.$transaction) as unknown as Mock
    transaction.mockImplementation(async (ops: unknown[]) => ops)
    vi.mocked(prisma.cachedAirCrashArticle.findMany).mockResolvedValue([{ id: 'stale-1' }] as never)
    vi.mocked(prisma.cachedAirCrashArticle.deleteMany).mockResolvedValue({ count: 1 })

    await scrapeAndCacheAirCrash()

    expect(prisma.cachedAirCrashArticle.findMany).toHaveBeenCalledWith({
      where: { title: { notIn: expect.any(Array) } },
      select: { id: true },
    })
    expect(prisma.cachedAirCrashArticle.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['stale-1'] } } })
  })

  it('does not remove stale rows when fetch is partial', async () => {
    const { fetchPageWikitext, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchPageWikitext).mockResolvedValue(SAMPLE_WIKITEXT)
    vi.mocked(fetchArticleDetails).mockResolvedValue([
      { id: '1', title: 'Vol Swissair 111', extract: 'x', imageUrl: null, pageUrl: 'https://fr.wikipedia.org/wiki/Vol_Swissair_111' },
    ])
    const transaction = vi.mocked(prisma.$transaction) as unknown as Mock
    transaction.mockImplementation(async (ops: unknown[]) => ops)
    vi.mocked(prisma.cachedAirCrashArticle.findMany).mockResolvedValue([{ id: 'stale-1' }] as never)

    await scrapeAndCacheAirCrash()

    expect(prisma.cachedAirCrashArticle.findMany).not.toHaveBeenCalled()
    expect(prisma.cachedAirCrashArticle.deleteMany).not.toHaveBeenCalled()
  })

  it('throws when no articles parsed', async () => {
    const { fetchPageWikitext } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchPageWikitext).mockResolvedValue('== Intro ==\nSans épisodes.')

    await expect(scrapeAndCacheAirCrash()).rejects.toThrow('No air crash articles parsed from wikitext')
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('throws when no article details fetched', async () => {
    const { fetchPageWikitext, fetchArticleDetails } = await import('@/lib/portail-wikipedia-fetch')
    const { prisma } = await import('@/lib/db')

    vi.mocked(fetchPageWikitext).mockResolvedValue(SAMPLE_WIKITEXT)
    vi.mocked(fetchArticleDetails).mockResolvedValue([])

    await expect(scrapeAndCacheAirCrash()).rejects.toThrow('No article details fetched')
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
