import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' as const } }
const mockUserSession = { user: { id: 'user-1', role: 'USER' as const } }

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [], secret: 'test' },
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('createTopicAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)
  })

  it('creates topic for admin', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.topic.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.topic.create).mockResolvedValue({
      id: 'topic-1',
      name: 'New Topic',
      slug: 'new-topic',
      icon: '📚',
      description: 'Description',
      color: '#6366f1',
      parentId: null,
      createdAt: new Date(),
    } as unknown)

    const { createTopicAction } = await import('@/actions/topic-actions')
    const result = await createTopicAction({
      name: 'New Topic',
      description: 'Description',
    })

    expect(result).toEqual({ success: true })
  })

  it('returns error for non-admin', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession)

    const { createTopicAction } = await import('@/actions/topic-actions')
    const result = await createTopicAction({ name: 'New Topic' })

    expect(result).toEqual({ error: 'Non autorisé' })
  })

  it('returns error when topic already exists', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.topic.findUnique).mockResolvedValue({
      id: 'existing',
      name: 'Existing Topic',
      slug: 'existing-topic',
      icon: '📚',
      description: null,
      color: '#6366f1',
      parentId: null,
      createdAt: new Date(),
    } as unknown)

    const { createTopicAction } = await import('@/actions/topic-actions')
    const result = await createTopicAction({ name: 'Existing Topic' })

    expect(result).toEqual({ error: 'Ce sujet existe déjà' })
  })

  it('uses default icon and color', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.topic.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.topic.create).mockResolvedValue({
      id: 'topic-1',
      name: 'New Topic',
      slug: 'new-topic',
      icon: '📚',
      description: null,
      color: '#6366f1',
      parentId: null,
      createdAt: new Date(),
    } as unknown)

    const { createTopicAction } = await import('@/actions/topic-actions')
    await createTopicAction({ name: 'New Topic' })

    const { prisma: p } = await import('@/lib/db')
    expect(vi.mocked(p.topic.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          icon: '📚',
          color: '#6366f1',
        }),
      })
    )
  })
})

describe('updateTopicAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)
  })

  it('updates topic for admin', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.topic.update).mockResolvedValue({
      id: 'topic-1',
      name: 'Updated Topic',
      slug: 'updated-topic',
      icon: '🔬',
      description: 'New description',
      color: '#ec4899',
      parentId: null,
      createdAt: new Date(),
    } as unknown)

    const { updateTopicAction } = await import('@/actions/topic-actions')
    const result = await updateTopicAction('topic-1', {
      name: 'Updated Topic',
      icon: '🔬',
      description: 'New description',
      color: '#ec4899',
    })

    expect(result).toEqual({ success: true })
  })

  it('returns error for non-admin', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession)

    const { updateTopicAction } = await import('@/actions/topic-actions')
    const result = await updateTopicAction('topic-1', { name: 'Updated' })

    expect(result).toEqual({ error: 'Non autorisé' })
  })
})

describe('deleteTopicAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)
  })

  it('deletes topic for admin', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.topic.delete).mockResolvedValue({
      id: 'topic-1',
      name: 'Deleted Topic',
      slug: 'deleted-topic',
      icon: '📚',
      description: null,
      color: '#6366f1',
      parentId: null,
      createdAt: new Date(),
    } as unknown)

    const { deleteTopicAction } = await import('@/actions/topic-actions')
    const result = await deleteTopicAction('topic-1')

    expect(result).toEqual({ success: true })
  })

  it('returns error for non-admin', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession)

    const { deleteTopicAction } = await import('@/actions/topic-actions')
    const result = await deleteTopicAction('topic-1')

    expect(result).toEqual({ error: 'Non autorisé' })
  })
})
