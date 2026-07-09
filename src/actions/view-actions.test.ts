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
    viewedIdea: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/view', () => ({
  markIdeaViewed: vi.fn(),
}))

describe('markIdeaViewedAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  it('marks idea as viewed', async () => {
    const { markIdeaViewed } = await import('@/lib/view')
    vi.mocked(markIdeaViewed).mockResolvedValue(undefined)

    const { markIdeaViewedAction } = await import('@/actions/view-actions')
    const result = await markIdeaViewedAction('idea-1', 'user-1')

    expect(result).toBeUndefined()
    expect(markIdeaViewed).toHaveBeenCalledWith('user-1', 'idea-1')
  })

  it('throws when userId does not match session', async () => {
    const { markIdeaViewedAction } = await import('@/actions/view-actions')
    await expect(markIdeaViewedAction('idea-1', 'user-2')).rejects.toThrow('Non autorisé')
  })

  it('throws when no session', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const { markIdeaViewedAction } = await import('@/actions/view-actions')
    await expect(markIdeaViewedAction('idea-1', 'user-1')).rejects.toThrow('Non autorisé')
  })
})

describe('clearHistoryAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  it('clears all viewed ideas', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.deleteMany).mockResolvedValue({ count: 5 })

    const { clearHistoryAction } = await import('@/actions/view-actions')
    const result = await clearHistoryAction('user-1')

    expect(result).toBeUndefined()
    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.viewedIdea.deleteMany)).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })
  })

  it('throws when userId does not match session', async () => {
    const { clearHistoryAction } = await import('@/actions/view-actions')
    await expect(clearHistoryAction('user-2')).rejects.toThrow('Non autorisé')
  })

  it('throws when no session', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const { clearHistoryAction } = await import('@/actions/view-actions')
    await expect(clearHistoryAction('user-1')).rejects.toThrow('Non autorisé')
  })
})

describe('removeFromHistoryAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  it('removes specific idea from history', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.deleteMany).mockResolvedValue({ count: 1 })

    const { removeFromHistoryAction } = await import('@/actions/view-actions')
    const result = await removeFromHistoryAction('view-1', 'user-1')

    expect(result).toBeUndefined()
    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.viewedIdea.deleteMany)).toHaveBeenCalledWith({
      where: { id: 'view-1', userId: 'user-1' },
    })
  })

  it('throws when userId does not match session', async () => {
    const { removeFromHistoryAction } = await import('@/actions/view-actions')
    await expect(removeFromHistoryAction('view-1', 'user-2')).rejects.toThrow('Non autorisé')
  })

  it('throws when no session', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const { removeFromHistoryAction } = await import('@/actions/view-actions')
    await expect(removeFromHistoryAction('view-1', 'user-1')).rejects.toThrow('Non autorisé')
  })
})
