'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function toggleUserEnabled(userId: string, enabled: boolean) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { enabled },
    })
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(userId: string) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la suppression' }
  }
}
