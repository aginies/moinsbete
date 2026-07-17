import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('toggleBookmark', () => {
  it('creates bookmark when none exists', async () => {
    const { toggleBookmark } = await import('@/lib/bookmark')
    const { prisma } = await import('@/lib/db')

    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.bookmark.create).mockResolvedValue({
      id: 'bm1',
      userId: 'u1',
      ideaId: 'i1',
      resourceId: null,
      type: 'IDEA' as const,
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })

    const result = await toggleBookmark('u1', 'i1')

    expect(result).toEqual({ bookmarked: true, wasBookmarked: false })
    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: { userId: 'u1', ideaId: 'i1' },
    })
  })

  it('removes bookmark when exists', async () => {
    const { toggleBookmark } = await import('@/lib/bookmark')
    const { prisma } = await import('@/lib/db')

    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue({
      id: 'bm1',
      userId: 'u1',
      ideaId: 'i1',
      resourceId: null,
      type: 'IDEA' as const,
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })
    vi.mocked(prisma.bookmark.delete).mockResolvedValue({
      id: 'bm1',
      userId: 'u1',
      ideaId: 'i1',
      resourceId: null,
      type: 'IDEA' as const,
      meta: null,
      createdAt: new Date(),
      lastReviewAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      easeFactor: 2.5,
    })

    const result = await toggleBookmark('u1', 'i1')

    expect(result).toEqual({ bookmarked: false, wasBookmarked: true })
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({
      where: { id: 'bm1' },
    })
  })
})
