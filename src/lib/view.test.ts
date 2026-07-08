import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    viewedIdea: {
      upsert: vi.fn(),
    },
  },
}))

describe('markIdeaViewed', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockReset()
  })

  it('calls upsert with correct parameters', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockResolvedValue({
      id: 'view-1',
      userId: 'u1',
      ideaId: 'i1',
      viewedAt: new Date(),
    })

    const { markIdeaViewed } = await import('@/lib/view')
    await markIdeaViewed('u1', 'i1')

    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.viewedIdea.upsert)).toHaveBeenCalledWith({
      where: { userId_ideaId: { userId: 'u1', ideaId: 'i1' } },
      create: { userId: 'u1', ideaId: 'i1' },
      update: {},
    })
  })

  it('handles upsert errors', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.viewedIdea.upsert).mockRejectedValue(new Error('DB error'))

    const { markIdeaViewed } = await import('@/lib/view')
    await expect(markIdeaViewed('u1', 'i1')).rejects.toThrow('DB error')
  })
})
