import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@/generated/client'
import { prisma } from '@/lib/db'

const mockSession = {
  user: { id: 'user-1', email: 'user@test.com', name: 'User', role: 'USER' as const },
  expires: '2026-12-31T23:59:59.000Z',
}

const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' as const },
  expires: '2026-12-31T23:59:59.000Z',
}

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      findUnique: vi.fn(),
    },
    sharedLobbyBookmark: {
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    idea: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/favorite', () => ({
  toggleBookmark: vi.fn(),
  isBookmarked: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendShareNotificationEmail: vi.fn(),
}))

describe('lobby-share-actions — auth guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shareToLobby returns error when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { shareToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareToLobby('idea-1', ['user-2'])
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('unshareFromLobby returns error when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { unshareFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareFromLobby('idea-1')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('shareResourceToLobby returns error when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('unshareResourceFromLobby returns error when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { unshareResourceFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareResourceFromLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('isSharedToLobby returns false when no session', async () => {
    vi.mocked((await import('@/lib/auth')). getSession).mockResolvedValue(null)
    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(false)
  })

  it('isSharedResourceToLobby returns false when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { isSharedResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(false)
  })

  it('getShareDetails returns empty defaults when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { getShareDetails } = await import('@/actions/lobby-share-actions')
    const result = await getShareDetails('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ shared: false, shareToCommunity: false, sharedWithUserIds: [] })
  })

  it('addToFavoritesFromLobby returns error when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { addToFavoritesFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await addToFavoritesFromLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ error: 'Non authentifié' })
  })

  it('isInFavorites returns false when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { isInFavorites } = await import('@/actions/lobby-share-actions')
    const result = await isInFavorites('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(false)
  })

  it('getSharedWithMe returns empty bookmarks when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { getSharedWithMe } = await import('@/actions/lobby-share-actions')
    const result = await getSharedWithMe()
    expect(result).toEqual({ bookmarks: [] })
  })

  it('getAllUsers returns empty users when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { getAllUsers } = await import('@/actions/lobby-share-actions')
    const result = await getAllUsers()
    expect(result).toEqual({ users: [] })
  })

  it('searchUsers returns empty when no session', async () => {
    vi.mocked((await import('@/lib/auth')).getSession).mockResolvedValue(null)
    const { searchUsers } = await import('@/actions/lobby-share-actions')
    const result = await searchUsers('test')
    expect(result).toEqual({ users: [] })
  })
})

describe('lobby-share-actions — shareToLobby', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('returns error when bookmark not found', async () => {
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null)

    const { shareToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareToLobby('idea-1', ['user-2'])

    expect(result).toEqual({ error: 'Bookmark non trouvé' })
  })

  it('returns error when already shared to community', async () => {
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue({
      id: 'bm-1', ideaId: 'idea-1', resourceId: null,
      type: 'IDEA' as any, userId: 'user-1',
      meta: null, createdAt: new Date(), lastReviewAt: null, nextReviewAt: null, reviewCount: 0, easeFactor: 2.5,
    } as any)
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })

    const { shareToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareToLobby('idea-1', ['user-2'])

    expect(result).toEqual({ error: 'Déjà partagé au lobby' })
  })

  it('creates many for new users only, dedups existing', async () => {
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue({
      id: 'bm-1', ideaId: 'idea-1', resourceId: null,
      type: 'IDEA' as any, userId: 'user-1',
      meta: null, createdAt: new Date(), lastReviewAt: null, nextReviewAt: null, reviewCount: 0, easeFactor: 2.5,
    } as any)
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.findMany).mockResolvedValue([
      {
        id: 'slbm-2', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
        resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: 'user-2',
      },
    ])
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-2', email: 'user2@test.com', displayName: 'User2', emailNotificationsEnabled: true } as any,
      { id: 'user-3', email: 'user3@test.com', displayName: 'User3', emailNotificationsEnabled: false } as any,
    ])
    vi.mocked(prisma.sharedLobbyBookmark.createMany).mockResolvedValue({ count: 2 })
    vi.mocked((await import('next/cache')).revalidatePath).mockReturnValue(undefined)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', displayName: 'User', email: 'user@test.com',
    } as any)
    vi.mocked(prisma.idea.findUnique).mockResolvedValue({
      id: 'idea-1', title: 'Test Idea', slug: 'test-idea', content: '', sourceId: '',
      takeaway: '', saviezVous: null, orderIndex: 0, isPublished: false, isEnhanced: false,
      createdAt: new Date(), updatedAt: new Date(),
    } as any)

    const { shareToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareToLobby('idea-1', ['user-2', 'user-3'])

    expect(result).toEqual({ success: true, shared: true, sharedToUsers: ['user-3'] })
    expect((vi.mocked(prisma.sharedLobbyBookmark.createMany).mock.calls?.[0]?.[0]?.data as any[])?.length).toBe(1)
  })

  it('sends email to recipients with emailNotificationsEnabled=true', async () => {
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue({
      id: 'bm-1', ideaId: 'idea-1', resourceId: null,
      type: 'IDEA' as any, userId: 'user-1',
      meta: null, createdAt: new Date(), lastReviewAt: null, nextReviewAt: null, reviewCount: 0, easeFactor: 2.5,
    } as any)
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-2', email: 'user2@test.com', displayName: 'User2', emailNotificationsEnabled: true } as any,
      { id: 'user-3', email: 'user3@test.com', displayName: 'User3', emailNotificationsEnabled: false } as any,
    ])
    vi.mocked(prisma.sharedLobbyBookmark.createMany).mockResolvedValue({ count: 2 })
    vi.mocked((await import('next/cache')).revalidatePath).mockReturnValue(undefined)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', displayName: 'User', email: 'user@test.com',
    } as any)
    vi.mocked(prisma.idea.findUnique).mockResolvedValue({
      id: 'idea-1', title: 'Test Idea', slug: 'test-idea', content: '', sourceId: '',
      takeaway: '', saviezVous: null, orderIndex: 0, isPublished: false, isEnhanced: false,
      createdAt: new Date(), updatedAt: new Date(),
    } as any)

    const { shareToLobby } = await import('@/actions/lobby-share-actions')
    await shareToLobby('idea-1', ['user-2', 'user-3'])

    expect((await import('@/lib/email')).sendShareNotificationEmail).toHaveBeenCalledWith(
      'user2@test.com',
      'User2',
      'User',
      'Test Idea',
      'IDEA',
    )
  })
})

describe('lobby-share-actions — unshareFromLobby', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('admin deletes any user share (no userId filter)', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { ideaId: 'idea-1', userId: 'user-1' } })
      return { count: 1 }
    })

    const { unshareFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareFromLobby('idea-1')

    expect(result).toEqual({ success: true, shared: false })
  })

  it('regular user deletes only own shares', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { ideaId: 'idea-1', userId: 'user-1' } })
      return { count: 1 }
    })

    const { unshareFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareFromLobby('idea-1')

    expect(result).toEqual({ success: true, shared: false })
  })

  it('deletes by ideaId + sharedWithUserId when specified', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { ideaId: 'idea-1', sharedWithUserId: 'target-user', userId: 'user-1' } })
      return { count: 1 }
    })

    const { unshareFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareFromLobby('idea-1', 'target-user')

    expect(result).toEqual({ success: true, shared: false })
  })
})

describe('lobby-share-actions — shareResourceToLobby', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.clearAllMocks()
  })

  it('returns error for invalid resourceType', async () => {
    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('INVALID', 'resource-1')
    expect(result).toEqual({ error: 'Type de ressource invalide' })
  })

  it('returns error when already shared', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ error: 'Déjà partagé' })
  })

  it('validates meta: all-string keys/values allowed', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: { key: 'val' }, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', { key: 'val' })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toEqual({ key: 'val' })
  })

  it('rejects meta with non-string value (number)', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', { key: 42 })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toBe(Prisma.JsonNull)
  })

  it('rejects meta with non-string value (array)', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', { key: [1, 2] })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toBe(Prisma.JsonNull)
  })

  it('rejects meta with non-string value (null)', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', { key: null })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toBe(Prisma.JsonNull)
  })

  it('rejects meta with key > 50 chars', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', {
      ['a'.repeat(51)]: 'val',
    })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toBe(Prisma.JsonNull)
  })

  it('rejects meta with value > 200 chars', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', {
      key: 'a'.repeat(201),
    })
    expect(result).toEqual({ success: true, shared: true })
    const createCall = vi.mocked(prisma.sharedLobbyBookmark.create).mock.calls[0][0]
    expect(createCall.data.meta).toBe(Prisma.JsonNull)
  })

  it('creates community share when no recipientIds', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.create).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ success: true, shared: true })
  })

  it('creates many for recipientIds', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.sharedLobbyBookmark.createMany).mockResolvedValue({ count: 2 })
    vi.mocked((await import('next/cache')).revalidatePath).mockImplementation(() => {})

    const { shareResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await shareResourceToLobby('SAVIEZ_VOUS', 'resource-1', undefined, ['user-2', 'user-3'])
    expect(result).toEqual({ success: true, shared: true })
    expect((vi.mocked(prisma.sharedLobbyBookmark.createMany).mock.calls?.[0]?.[0]?.data as any[])?.length).toBe(2)
  })
})

describe('lobby-share-actions — unshareResourceFromLobby', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('admin deletes all shares for resource', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { resourceId: 'resource-1', resourceType: 'SAVIEZ_VOUS', userId: 'user-1' } })
      return { count: 2 }
    })

    const { unshareResourceFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareResourceFromLobby('SAVIEZ_VOUS', 'resource-1')

    expect(result).toEqual({ success: true, shared: false })
  })

  it('regular user deletes only own shares', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { resourceId: 'resource-1', resourceType: 'SAVIEZ_VOUS', userId: 'user-1' } })
      return { count: 1 }
    })

    const { unshareResourceFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareResourceFromLobby('SAVIEZ_VOUS', 'resource-1')

    expect(result).toEqual({ success: true, shared: false })
  })

  it('deletes specific sharedWithUserId when provided', async () => {
    (vi.mocked(prisma.sharedLobbyBookmark.deleteMany) as any).mockImplementation(async (args) => {
      expect(args).toEqual({ where: { resourceId: 'resource-1', resourceType: 'SAVIEZ_VOUS', sharedWithUserId: 'target-user', userId: 'user-1' } })
      return { count: 1 }
    })

    const { unshareResourceFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await unshareResourceFromLobby('SAVIEZ_VOUS', 'resource-1', 'target-user')

    expect(result).toEqual({ success: true, shared: false })
  })
})

describe('lobby-share-actions — isSharedToLobby / isSharedResourceToLobby', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('isSharedToLobby returns true when share exists', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })

    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(true)
  })

  it('isSharedToLobby returns false when no share', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)

    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(false)
  })

  it('isSharedResourceToLobby returns true when share exists', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: null, resourceId: 'resource-1',
      resourceType: 'SAVIEZ_VOUS', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })

    const { isSharedResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(true)
  })

  it('isSharedResourceToLobby returns false when no share', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)

    const { isSharedResourceToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedResourceToLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(false)
  })

  it('returns shareToCommunity=false for private shares only', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: 'user-2',
    })

    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(true)
  })

  it('returns shareToCommunity=true when any share has null sharedWithUserId', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })

    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(true)
  })

  it('returns false when no shares', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue(null)

    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('idea-1')
    expect(result).toBe(false)
  })

  it('returns false for invalid resourceType', async () => {
    const { isSharedToLobby } = await import('@/actions/lobby-share-actions')
    const result = await isSharedToLobby('invalid-resource')
    expect(result).toBe(false)
  })
})

describe('lobby-share-actions — favorites integration', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('addToFavoritesFromLobby calls toggleBookmark and adds', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    const { toggleBookmark } = await import('@/lib/favorite')
    vi.mocked(toggleBookmark).mockResolvedValue({ bookmarked: true } as any)

    const { addToFavoritesFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await addToFavoritesFromLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ success: true, added: true })
    expect(toggleBookmark).toHaveBeenCalledWith('user-1', 'SAVIEZ_VOUS' as any, 'resource-1', 'add', undefined)
  })

  it('returns alreadyBookmarked when toggle returns bookmarked=false', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findFirst).mockResolvedValue({
      id: 'slbm-1', userId: 'user-1', ideaId: 'idea-1', resourceId: null,
      resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: null,
    })
    const { toggleBookmark } = await import('@/lib/favorite')
    vi.mocked(toggleBookmark).mockResolvedValue({ bookmarked: false } as any)

    const { addToFavoritesFromLobby } = await import('@/actions/lobby-share-actions')
    const result = await addToFavoritesFromLobby('SAVIEZ_VOUS', 'resource-1')
    expect(result).toEqual({ success: false, alreadyBookmarked: true })
  })

  it('isInFavorites returns true when bookmark exists', async () => {
    const { isBookmarked } = await import('@/lib/favorite')
    vi.mocked(isBookmarked).mockResolvedValue(true)

    const { isInFavorites } = await import('@/actions/lobby-share-actions')
    const result = await isInFavorites('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(true)
  })

  it('isInFavorites returns false when bookmark not found', async () => {
    const { isBookmarked } = await import('@/lib/favorite')
    vi.mocked(isBookmarked).mockResolvedValue(false)

    const { isInFavorites } = await import('@/actions/lobby-share-actions')
    const result = await isInFavorites('SAVIEZ_VOUS', 'resource-1')
    expect(result).toBe(false)
  })
})

describe('lobby-share-actions — getSharedWithMe', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('returns bookmarks shared to current user', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findMany).mockResolvedValue([
      {
        id: 'slbm-1', userId: 'user-2', ideaId: 'idea-1', resourceId: null,
        resourceType: '', createdAt: new Date(), meta: null, sharedWithUserId: 'user-1',
      },
    ])

    const { getSharedWithMe } = await import('@/actions/lobby-share-actions')
    const result = await getSharedWithMe()
    expect(result).toEqual({ bookmarks: [{ id: 'slbm-1', userId: 'user-2', ideaId: 'idea-1', resourceId: null, resourceType: '', createdAt: expect.any(Date), meta: null, sharedWithUserId: 'user-1' }] })
  })

  it('returns empty bookmarks when nothing shared to user', async () => {
    vi.mocked(prisma.sharedLobbyBookmark.findMany).mockResolvedValue([])

    const { getSharedWithMe } = await import('@/actions/lobby-share-actions')
    const result = await getSharedWithMe()
    expect(result).toEqual({ bookmarks: [] })
  })
})

describe('lobby-share-actions — user discovery', () => {
  beforeEach(async () => {
    const { getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('getAllUsers excludes current user and returns enabled users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-2', email: 'user2@test.com', displayName: 'User2' } as any,
      { id: 'user-3', email: 'user3@test.com', displayName: 'User3' } as any,
    ])

    const { getAllUsers } = await import('@/actions/lobby-share-actions')
    const result = await getAllUsers()
    expect(result).toEqual({ users: [{ id: 'user-2', displayName: 'User2', email: 'user2@test.com' }, { id: 'user-3', displayName: 'User3', email: 'user3@test.com' }] })
  })

  it('searchUsers matches displayName contains', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-2', email: 'user2@test.com', displayName: 'Tester' } as any,
    ])

    const { searchUsers } = await import('@/actions/lobby-share-actions')
    const result = await searchUsers('test')
    expect(result).toEqual({ users: [{ id: 'user-2', displayName: 'Tester', email: 'user2@test.com' }] })
  })

  it('searchUsers matches email contains', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-2', email: 'user@example.com', displayName: 'User' } as any,
    ])

    const { searchUsers } = await import('@/actions/lobby-share-actions')
    const result = await searchUsers('example')
    expect(result).toEqual({ users: [{ id: 'user-2', email: 'user@example.com', displayName: 'User' }] })
  })

  it('searchUsers returns empty when no matches', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    const { searchUsers } = await import('@/actions/lobby-share-actions')
    const result = await searchUsers('zzzz')
    expect(result).toEqual({ users: [] })
  })
})
