'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toggleBookmark, isBookmarked } from '@/lib/favorite'
import type { BookmarkType } from '@/generated/client'
import type { JsonValue } from '@prisma/client/runtime/library'
import { Prisma } from '@/generated/client'

export async function shareToLobby(ideaId: string, sharedWithUserIds?: string[]) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_ideaId: { userId: session.user.id, ideaId } },
  })
  if (!bookmark) return { error: 'Bookmark non trouvé' }

  const communityAlreadyShared = await prisma.sharedLobbyBookmark.findFirst({
    where: { userId: session.user.id, ideaId, sharedWithUserId: null },
  })
  if (communityAlreadyShared) return { error: 'Déjà partagé au lobby' }

  const existingUserShares = await prisma.sharedLobbyBookmark.findMany({
    where: {
      userId: session.user.id,
      ideaId,
      sharedWithUserId: { in: sharedWithUserIds || [] },
    },
  })
  const alreadySharedToUserIds = existingUserShares.map(b => b.sharedWithUserId!).filter(Boolean)
  const newSharedUserIds = (sharedWithUserIds || []).filter(id => !alreadySharedToUserIds.includes(id))

  const data: { userId: string; ideaId: string; resourceType: string; sharedWithUserId?: string | null; meta?: Prisma.InputJsonValue } = {
    userId: session.user.id,
    ideaId,
    resourceType: 'IDEA',
  }

  if (newSharedUserIds.length > 0) {
    await prisma.sharedLobbyBookmark.createMany({
      data: newSharedUserIds.map(userId => ({ ...data, sharedWithUserId: userId })),
    })
  }

  return { success: true, shared: true, sharedToUsers: newSharedUserIds }
}

export async function unshareFromLobby(ideaId: string, sharedWithUserId?: string | null) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const isAdmin = session.user.role === 'ADMIN'

  await prisma.sharedLobbyBookmark.deleteMany({
    where: {
      ...(isAdmin ? {} : { userId: session.user.id }),
      ideaId,
      ...(sharedWithUserId ? { sharedWithUserId } : {}),
    },
  })

  return { success: true, shared: false }
}

export async function isSharedToLobby(ideaId: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false

  const shared = await prisma.sharedLobbyBookmark.findFirst({
    where: { userId: session.user.id, ideaId },
  })
  return !!shared
}

const MAX_META_SIZE = 10 * 1024

function validateMeta(meta: unknown): JsonValue | null {
  if (meta == null) return null
  if (typeof meta === 'string') {
    if (meta.length > MAX_META_SIZE) return null
    try {
      return JSON.parse(meta)
    } catch {
      return null
    }
  }
  if (typeof meta !== 'object') return null
  const serialized = JSON.stringify(meta)
  if (serialized.length > MAX_META_SIZE) return null
  return JSON.parse(serialized)
}

function toPrismaMeta(meta: JsonValue | null) {
  return meta === null ? Prisma.JsonNull : meta
}

export async function shareResourceToLobby(resourceType: string, resourceId: string, meta?: JsonValue | Record<string, unknown>, sharedWithUserIds?: string[]) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const validResourceTypes = ['SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'PROVERBE', 'IDEA']
  if (!validResourceTypes.includes(resourceType)) {
    return { error: 'Type de ressource invalide' }
  }

  const existing = await prisma.sharedLobbyBookmark.findFirst({
    where: {
      userId: session.user.id,
      resourceId,
      resourceType,
    },
  })
  if (existing) return { error: 'Déjà partagé' }

  const validatedMeta = meta ? validateMeta(meta) : null
  const createData = {
    userId: session.user.id,
    resourceId,
    resourceType,
    meta: toPrismaMeta(validatedMeta),
  }

  if (sharedWithUserIds && sharedWithUserIds.length > 0) {
    await prisma.sharedLobbyBookmark.createMany({
      data: sharedWithUserIds.map(userId => ({ ...createData, sharedWithUserId: userId })),
    })
  } else {
    await prisma.sharedLobbyBookmark.create({
      data: { ...createData, sharedWithUserId: null },
    })
  }

  return { success: true, shared: true }
}

const VALID_RESOURCE_TYPES = new Set(['SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'PROVERBE', 'IDEA'])

export async function unshareResourceFromLobby(resourceType: string, resourceId: string, sharedWithUserId?: string | null) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  if (!VALID_RESOURCE_TYPES.has(resourceType)) {
    return { error: 'Type de ressource invalide' }
  }

  const isAdmin = session.user.role === 'ADMIN'

  await prisma.sharedLobbyBookmark.deleteMany({
    where: {
      ...(isAdmin ? {} : { userId: session.user.id }),
      resourceId,
      resourceType,
      ...(sharedWithUserId ? { sharedWithUserId } : {}),
    },
  })

  return { success: true, shared: false }
}

export async function isSharedResourceToLobby(resourceType: string, resourceId: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false

  if (!VALID_RESOURCE_TYPES.has(resourceType)) {
    return false
  }

  const shared = await prisma.sharedLobbyBookmark.findFirst({
    where: {
      userId: session.user.id,
      resourceId,
      resourceType,
    },
  })
  return !!shared
}

export async function addToFavoritesFromLobby(resourceType: string, resourceId: string, meta?: JsonValue) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const result = await toggleBookmark(session.user.id, resourceType as BookmarkType, resourceId, 'add', meta as Record<string, unknown> | undefined)
  if (result.bookmarked) {
    return { success: true, added: true }
  }
  return { success: false, alreadyBookmarked: true }
}

export async function isInFavorites(resourceType: string, resourceId: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  return isBookmarked(session.user.id, resourceType as BookmarkType, resourceId)
}

export async function getSharedWithMe() {
  const session = await getSession()
  if (!session?.user) return { bookmarks: [] as Array<{ id: string; userId: string; ideaId: string | null; resourceId: string | null; resourceType: string; sharedWithUserId: string | null; createdAt: Date; meta: JsonValue | null }> }

  const bookmarks = await prisma.sharedLobbyBookmark.findMany({
    where: { sharedWithUserId: session.user.id },
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      idea: {
        include: {
          ideaTopics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
            },
          },
          source: { select: { title: true, type: true, url: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { bookmarks }
}

export async function getAllUsers() {
  const session = await getSession()
  if (!session?.user) return { users: [] }

  const users = await prisma.user.findMany({
    where: { id: { not: session.user.id }, enabled: true },
    select: { id: true, displayName: true, email: true, role: true },
    orderBy: { displayName: 'asc' },
  })

  return { users }
}

export async function searchUsers(query: string) {
  const session = await getSession()
  if (!session?.user) return { users: [] }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      enabled: true,
      OR: [
        { displayName: { contains: query } },
        { email: { contains: query } },
      ],
    },
    select: { id: true, displayName: true, email: true, role: true },
    orderBy: { displayName: 'asc' },
    take: 20,
  })

  return { users }
}
