'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toggleBookmark, isBookmarked } from '@/lib/favorite'

export async function shareToLobby(ideaId: string) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_ideaId: { userId: session.user.id, ideaId } },
  })
  if (!bookmark) return { error: 'Bookmark non trouvé' }

  const existing = await prisma.sharedLobbyBookmark.findFirst({
    where: { userId: session.user.id, ideaId },
  })
  if (existing) return { error: 'Déjà partagé' }

  await prisma.sharedLobbyBookmark.create({
    data: { userId: session.user.id, ideaId, resourceType: 'IDEA' },
  })

  return { success: true, shared: true }
}

export async function unshareFromLobby(ideaId: string) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  await prisma.sharedLobbyBookmark.deleteMany({
    where: { userId: session.user.id, ideaId },
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

function validateMeta(meta: any): any {
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

export async function shareResourceToLobby(resourceType: string, resourceId: string, meta?: any) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const validResourceTypes = ['SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES']
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

  await prisma.sharedLobbyBookmark.create({
    data: {
      userId: session.user.id,
      resourceId,
      resourceType,
      meta: validateMeta(meta),
    },
  })

  return { success: true, shared: true }
}

const VALID_RESOURCE_TYPES = new Set(['SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES'])

export async function unshareResourceFromLobby(resourceType: string, resourceId: string) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  if (!VALID_RESOURCE_TYPES.has(resourceType)) {
    return { error: 'Type de ressource invalide' }
  }

  await prisma.sharedLobbyBookmark.deleteMany({
    where: {
      userId: session.user.id,
      resourceId,
      resourceType,
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

export async function addToFavoritesFromLobby(resourceType: string, resourceId: string, meta?: any) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const result = await toggleBookmark(session.user.id, resourceType as any, resourceId, 'add', meta)
  if (result.bookmarked) {
    return { success: true, added: true }
  }
  return { success: false, alreadyBookmarked: true }
}

export async function isInFavorites(resourceType: string, resourceId: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  return isBookmarked(session.user.id, resourceType as any, resourceId)
}
