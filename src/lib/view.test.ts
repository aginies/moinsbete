import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => {
  const mockViewedIdea = {
    upsert: vi.fn(),
  }
  const mockGrowthPlan = {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  }
  const mockPrisma = {
    viewedIdea: mockViewedIdea,
    growthPlan: mockGrowthPlan,
    $transaction: vi.fn(async (cb) => cb(mockPrisma)),
  }
  return { prisma: mockPrisma }
})

describe('markIdeaViewed', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockReset()
    vi.mocked(prisma.growthPlan.findUnique).mockReset()
    vi.mocked(prisma.growthPlan.upsert).mockReset()
  })

  it('calls upsert with correct parameters', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockResolvedValue({
      id: 'view-1',
      userId: 'u1',
      ideaId: 'i1',
      viewedAt: new Date(),
    })
    vi.mocked(prisma.growthPlan.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.growthPlan.upsert).mockResolvedValue({
      id: 'gp-1',
      userId: 'u1',
      streakDays: 1,
      lastActiveDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { markIdeaViewed } = await import('@/lib/view')
    await markIdeaViewed('u1', 'i1')

    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.viewedIdea.upsert)).toHaveBeenCalledWith({
      where: { userId_ideaId: { userId: 'u1', ideaId: 'i1' } },
      create: { userId: 'u1', ideaId: 'i1' },
      update: {},
    })
    expect(vi.mocked(p.growthPlan.findUnique)).toHaveBeenCalledWith({ where: { userId: 'u1' } })
    expect(vi.mocked(p.growthPlan.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        create: expect.objectContaining({ streakDays: 1 }),
        update: expect.objectContaining({ streakDays: 1 }),
      }),
    )
  })

  it('increments streak when last active was yesterday', async () => {
    const { prisma } = await import('@/lib/db')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    vi.mocked(prisma.viewedIdea.upsert).mockResolvedValue({
      id: 'view-1',
      userId: 'u1',
      ideaId: 'i1',
      viewedAt: new Date(),
    })
    vi.mocked(prisma.growthPlan.findUnique).mockResolvedValue({
      id: 'gp-1',
      userId: 'u1',
      streakDays: 5,
      lastActiveDate: yesterday,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.growthPlan.upsert).mockResolvedValue({
      id: 'gp-1',
      userId: 'u1',
      streakDays: 6,
      lastActiveDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { markIdeaViewed } = await import('@/lib/view')
    await markIdeaViewed('u1', 'i1')

    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.growthPlan.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ streakDays: 6 }) }),
    )
  })

  it('resets streak when last active was more than yesterday', async () => {
    const { prisma } = await import('@/lib/db')
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(0, 0, 0, 0)

    vi.mocked(prisma.viewedIdea.upsert).mockResolvedValue({
      id: 'view-1',
      userId: 'u1',
      ideaId: 'i1',
      viewedAt: new Date(),
    })
    vi.mocked(prisma.growthPlan.findUnique).mockResolvedValue({
      id: 'gp-1',
      userId: 'u1',
      streakDays: 10,
      lastActiveDate: twoDaysAgo,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.growthPlan.upsert).mockResolvedValue({
      id: 'gp-1',
      userId: 'u1',
      streakDays: 1,
      lastActiveDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { markIdeaViewed } = await import('@/lib/view')
    await markIdeaViewed('u1', 'i1')

    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.growthPlan.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ streakDays: 1 }) }),
    )
  })

  it('handles upsert errors', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockRejectedValue(new Error('DB error'))

    const { markIdeaViewed } = await import('@/lib/view')
    await expect(markIdeaViewed('u1', 'i1')).rejects.toThrow('DB error')
  })
})
