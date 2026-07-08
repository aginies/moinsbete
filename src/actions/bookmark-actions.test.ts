import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSession = { user: { id: 'user-1', role: 'USER' as const } }

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [], secret: 'test' },
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/bookmark', () => ({
  toggleBookmark: vi.fn(),
}))

describe('bookmarkAction - add', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.create).mockResolvedValue({
      id: 'bm-1',
      userId: 'user-1',
      ideaId: 'idea-1',
      createdAt: new Date(),
    })
  })

  it('creates a bookmark when action is add', async () => {
    const { bookmarkAction } = await import('@/actions/bookmark-actions')
    const result = await bookmarkAction('idea-1', 'add')

    expect(result).toEqual({ success: true })
    const { prisma } = await import('@/lib/db')
    expect(vi.mocked(prisma.bookmark.create)).toHaveBeenCalledWith({
      data: { userId: 'user-1', ideaId: 'idea-1' },
    })
  })

  it('returns error when no session', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const { bookmarkAction } = await import('@/actions/bookmark-actions')
    const result = await bookmarkAction('idea-1', 'add')

    expect(result).toEqual({ error: 'Non authentifié' })
  })
})

describe('bookmarkAction - remove', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.delete).mockResolvedValue({
      id: 'bm-1',
      userId: 'user-1',
      ideaId: 'idea-1',
      createdAt: new Date(),
    })
  })

  it('deletes a bookmark when action is remove', async () => {
    const { bookmarkAction } = await import('@/actions/bookmark-actions')
    const result = await bookmarkAction('idea-1', 'remove')

    expect(result).toEqual({ success: true })
    const { prisma } = await import('@/lib/db')
    expect(vi.mocked(prisma.bookmark.delete)).toHaveBeenCalledWith({
      where: { userId_ideaId: { userId: 'user-1', ideaId: 'idea-1' } },
    })
  })
})

describe('toggleBookmarkAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  it('returns success and bookmarked state when bookmarking', async () => {
    const { toggleBookmark } = await import('@/lib/bookmark')
    vi.mocked(toggleBookmark).mockResolvedValue({
      bookmarked: true,
      wasBookmarked: false,
    })

    const { toggleBookmarkAction } = await import('@/actions/bookmark-actions')
    const result = await toggleBookmarkAction('idea-1')

    expect(result).toEqual({ success: true, bookmarked: true, wasBookmarked: false })
  })

  it('returns success and unbookmarked state when unbookmarking', async () => {
    const { toggleBookmark } = await import('@/lib/bookmark')
    vi.mocked(toggleBookmark).mockResolvedValue({
      bookmarked: false,
      wasBookmarked: true,
    })

    const { toggleBookmarkAction } = await import('@/actions/bookmark-actions')
    const result = await toggleBookmarkAction('idea-1')

    expect(result).toEqual({ success: true, bookmarked: false, wasBookmarked: true })
  })
})

describe('getSavedIdeas', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  it('returns empty ideas when no bookmarks', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([])

    const { getSavedIdeas } = await import('@/actions/bookmark-actions')
    const result = await getSavedIdeas()

    expect(result).toEqual({ ideas: [], count: 0 })
  })

  it('returns bookmarked ideas with topics', async () => {
    const mockBookmark = {
      id: 'bm-1',
      userId: 'user-1',
      ideaId: 'idea-1',
      createdAt: new Date(),
      idea: {
        id: 'idea-1',
        title: 'Test Idea',
        content: 'Test content',
        takeaway: 'Test takeaway',
        slug: 'test-idea',
        sourceId: 'source-1',
        orderIndex: 0,
        isPublished: true,
        isEnhanced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ideaTopics: [{ topic: { name: 'Test', slug: 'test', icon: '📚', color: '#6366f1', id: 't-1' } }],
        source: { title: 'Source', type: 'WIKIPEDIA' as const },
      },
    }
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([mockBookmark])

    const { getSavedIdeas } = await import('@/actions/bookmark-actions')
    const result = await getSavedIdeas()

    expect(result.count).toBe(1)
    expect(result.ideas[0].title).toBe('Test Idea')
    expect(result.ideas[0].topics).toHaveLength(1)
  })
})
