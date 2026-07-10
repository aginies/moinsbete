import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordReview, skipIdea } from './review-actions'

const mockBookmark = {
  id: 'bm-1',
  userId: 'u1',
  ideaId: 'i1',
  type: 'IDEA' as const,
  resourceId: null,
  meta: null,
  createdAt: new Date(),
  lastReviewAt: new Date('2026-07-09T00:00:00Z'),
  nextReviewAt: new Date('2026-07-10T00:00:00Z'),
  reviewCount: 3,
  easeFactor: 2.5,
}

const mockSession = {
  user: { id: 'u1', email: 'test@test.com' },
}

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: { provider: [] },
}))

describe('recordReview', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns error when not authenticated', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const result = await recordReview('bm-1', 'good')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('returns error when bookmark not found', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null)

    const result = await recordReview('bm-999', 'good')
    expect(result).toEqual({ error: 'Signet non trouvé' })
  })

  it('updates bookmark with good rating', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(mockBookmark)
    vi.mocked(prisma.bookmark.update).mockResolvedValue({ ...mockBookmark })

    const result = await recordReview('bm-1', 'good')
    expect(result).toEqual({ success: true })
    expect(prisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: 'bm-1' },
      data: expect.objectContaining({
        reviewCount: 4,
        easeFactor: 2.5,
      }),
    })
  })

  it('updates bookmark with easy rating', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(mockBookmark)
    vi.mocked(prisma.bookmark.update).mockResolvedValue({ ...mockBookmark })

    const result = await recordReview('bm-1', 'easy')
    expect(result).toEqual({ success: true })
    expect(prisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: 'bm-1' },
      data: expect.objectContaining({
        reviewCount: 4,
        easeFactor: 2.6,
      }),
    })
  })

  it('updates bookmark with again rating', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(mockBookmark)
    vi.mocked(prisma.bookmark.update).mockResolvedValue({ ...mockBookmark })

    const result = await recordReview('bm-1', 'again')
    expect(result).toEqual({ success: true })
    expect(prisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: 'bm-1' },
      data: expect.objectContaining({
        reviewCount: 4,
        easeFactor: 2.3,
      }),
    })
  })
})

describe('skipIdea', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns error when not authenticated', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const result = await skipIdea('bm-1')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('updates bookmark nextReviewAt', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.update).mockResolvedValue({ ...mockBookmark })

    const result = await skipIdea('bm-1')
    expect(result).toEqual({ success: true })
    expect(prisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: 'bm-1' },
      data: expect.objectContaining({
        nextReviewAt: expect.any(Date),
      }),
    })
  })
})
