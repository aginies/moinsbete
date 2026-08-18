import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFindMany = vi.fn()
const mockUpsert = vi.fn()
const mockGetCachedPool = vi.fn()
const mockFindRandomCommonsImage = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    cachedWikiLovesImage: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

vi.mock('@/lib/feed-pool-cache', () => ({
  getCachedPool: (...args: unknown[]) => mockGetCachedPool(...args),
}))

vi.mock('@/lib/commons-random-image', () => ({
  findRandomCommonsImage: (...args: unknown[]) => mockFindRandomCommonsImage(...args),
}))

const commonsFallbackImage = {
  docid: 'commons-fallback.jpg',
  titre: 'Fallback image',
  auteur: 'Bob',
  imageUrl: 'https://commons.example/fallback.jpg',
  zoomUrl: 'https://commons.example/fallback.jpg',
  thumbnailUrl: 'https://commons.example/fallback.jpg',
  description: '',
  droits: 'CC BY-SA 4.0',
  link: 'https://commons.wikimedia.org/wiki/File:commons-fallback.jpg',
}

function makePoolEntry(overrides: Record<string, unknown> = {}) {
  return {
    docid: 'wlm-2024-tour-eiffel.jpg',
    title: 'Tour Eiffel',
    author: 'Alice',
    imageUrl: 'https://wikilovesmonuments.org/tour-eiffel.jpg',
    commonsUrl: null,
    license: 'CC BY-SA 4.0',
    year: 2024,
    source: 'MONUMENTS',
    scrapedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  }
}

describe('Image WikiLoves API route', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFindMany.mockReset()
    mockUpsert.mockReset()
    mockGetCachedPool.mockReset()
    mockFindRandomCommonsImage.mockReset()
  })

  it('serves cached image when pool dates are strings (Redis JSON round-trip)', async () => {
    // Simulates a pool deserialized from Redis: expiresAt is an ISO string, not a Date
    const futureIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    mockGetCachedPool.mockImplementation(async (key: string) => {
      if (key === 'wikiloves:MONUMENTS') {
        return [makePoolEntry({ expiresAt: futureIso })]
      }
      return []
    })

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/image-wikiloves?event=wlm')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.imageUrl).toBe('https://wikilovesmonuments.org/tour-eiffel.jpg')
    expect(data.titre).toBe('Tour Eiffel')
    expect(mockFindRandomCommonsImage).not.toHaveBeenCalled()
  })

  it('falls back to Commons API when pool is empty', async () => {
    mockGetCachedPool.mockResolvedValue([])
    mockFindRandomCommonsImage.mockImplementation(async (_terms: unknown, onFound?: (img: unknown) => Promise<void> | void) => {
      await onFound?.(commonsFallbackImage)
      return commonsFallbackImage
    })

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/image-wikiloves?event=wlm')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.imageUrl).toBe('https://commons.example/fallback.jpg')
    expect(mockFindRandomCommonsImage).toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('falls back to Commons API when all pool entries are expired (string dates)', async () => {
    const pastIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    mockGetCachedPool.mockImplementation(async (key: string) => {
      if (key === 'wikiloves:MONUMENTS') {
        return [makePoolEntry({ expiresAt: pastIso })]
      }
      return []
    })
    mockFindRandomCommonsImage.mockImplementation(async (_terms: unknown, onFound?: (img: unknown) => Promise<void> | void) => {
      await onFound?.(commonsFallbackImage)
      return commonsFallbackImage
    })

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/image-wikiloves?event=wlm')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.imageUrl).toBe('https://commons.example/fallback.jpg')
  })
})
