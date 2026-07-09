'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BookmarkType } from '@/generated/client'
import { toggleFavoriteAction, isFavoriteAction } from '@/actions/favorite-actions'
import { getSaviezVousFavorites } from '@/lib/saviez-vous-bookmark'
import type { SaviezVousFavoriteMeta } from '@/lib/saviez-vous-bookmark'

const TYPE: BookmarkType = 'SAVIEZ_VOUS'

export async function toggleSaviezVousFavoriteAction(factId: string, action?: 'add' | 'remove', meta?: SaviezVousFavoriteMeta) {
  return toggleFavoriteAction(TYPE, factId, action, meta as Record<string, unknown>)
}

export async function getSaviezVousFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getSaviezVousFavorites(session.user.id) }
}

export async function isSaviezVousFavoriteAction(factId: string) {
  return isFavoriteAction(TYPE, factId)
}
