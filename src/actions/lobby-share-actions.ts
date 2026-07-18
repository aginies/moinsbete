'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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
