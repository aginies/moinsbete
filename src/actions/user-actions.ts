'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function markSplashSeen() {
  try {
    const session = await getSession()
    if (!session?.user) return { error: 'Non authentifié' }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasSeenSplash: true },
    })
    return { success: true }
  } catch (e) {
    console.error('markSplashSeen error:', e)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

export async function toggleUserEnabled(userId: string, enabled: boolean) {
  try {
    const session = await getSession()
    if (!session?.user) return { error: 'Non authentifié' }

    await prisma.user.update({
      where: { id: userId },
      data: { enabled },
    })
    return { success: true }
  } catch (e) {
    console.error('toggleUserEnabled error:', e)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getSession()
    if (!session?.user) return { error: 'Non authentifié' }

    await prisma.user.delete({
      where: { id: userId },
    })
    return { success: true }
  } catch (e) {
    console.error('deleteUser error:', e)
    return { error: 'Erreur lors de la suppression' }
  }
}
