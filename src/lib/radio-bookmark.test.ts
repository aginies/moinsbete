import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('toggleRadioFavorite', async () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findFirst).mockReset()
    vi.mocked(prisma.bookmark.delete).mockReset()
    vi.mocked(prisma.bookmark.create).mockReset()
  })

  it('creates bookmark when not exists', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.bookmark.create).mockResolvedValue({
      id: 'bm-1',
      userId: 'u1',
      ideaId: null,
      resourceId: 'doc-1',
      type: 'RADIO_FRANCE',
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })

    const { toggleRadioFavorite } = await import('@/lib/radio-bookmark')
    const result = await toggleRadioFavorite('u1', 'doc-1')

    expect(result).toEqual({ bookmarked: true, wasBookmarked: false })
    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.bookmark.create)).toHaveBeenCalledWith({
      data: { userId: 'u1', resourceId: 'doc-1', type: 'RADIO_FRANCE', meta: undefined },
    })
  })

  it('removes bookmark when exists', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue({
      id: 'bm-1',
      userId: 'u1',
      ideaId: null,
      resourceId: 'doc-1',
      type: 'RADIO_FRANCE',
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })
    vi.mocked(prisma.bookmark.delete).mockResolvedValue({
      id: 'bm-1',
      userId: 'u1',
      ideaId: null,
      resourceId: 'doc-1',
      type: 'RADIO_FRANCE',
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })

    const { toggleRadioFavorite } = await import('@/lib/radio-bookmark')
    const result = await toggleRadioFavorite('u1', 'doc-1')

    expect(result).toEqual({ bookmarked: false, wasBookmarked: true })
    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.bookmark.delete)).toHaveBeenCalledWith({
      where: { id: 'bm-1' },
    })
  })
})

describe('getRadioFavorites', async () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findMany).mockReset()
  })

  it('returns favorites with metadata', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([
      {
        id: 'bm-1',
        resourceId: 'doc-1',
        userId: 'u1',
        ideaId: null,
        type: 'RADIO_FRANCE',
        meta: { title: 'Test', description: 'Desc', url: 'http://test.com', radio: 'France Culture', section: 'Docs', image: 'img.jpg', favoritedAt: '2024-01-01' },
        createdAt: new Date('2024-01-01'),
        lastReviewAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
      },
    ])

    const { getRadioFavorites } = await import('@/lib/radio-bookmark')
    const result = await getRadioFavorites('u1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('doc-1')
    expect(result[0].favoritedAt).toBe('2024-01-01')
    expect(result[0].title).toBe('Test')
  })
})
