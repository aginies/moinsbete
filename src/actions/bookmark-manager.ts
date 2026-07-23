import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BookmarkManager } from '@/lib/bookmark-manager'

export interface BookmarkManagerActions<Doc extends { id: string }> {
  toggle(docId: string, action?: 'add' | 'remove', meta?: Record<string, unknown>): Promise<{ bookmarked: boolean; wasBookmarked: boolean; error?: string }>
  getFavorites(): Promise<{ favorites: Doc[] }>
  isBookmarked(docId: string): Promise<{ isBookmarked: boolean; error?: string }>
  isBookmarkedBatch(docIds: string[]): Promise<{ bookmarkedIds: string[]; error?: string }>
}

export function createBookmarkManagerActions<Doc extends { id: string }>(
  libManager: BookmarkManager<Doc>,
): BookmarkManagerActions<Doc> {
  return {
    async toggle(docId, action, meta) {
      const session = await getServerSession(authOptions)
      if (!session?.user) return { bookmarked: false, wasBookmarked: false, error: 'Non authentifié' }
      return libManager.toggle(session.user.id, docId, action, meta)
    },
    async getFavorites() {
      const session = await getServerSession(authOptions)
      if (!session?.user) return { favorites: [] }
      return { favorites: await libManager.getFavorites(session.user.id) }
    },
    async isBookmarked(docId) {
      const session = await getServerSession(authOptions)
      if (!session?.user) return { isBookmarked: false }
      return { isBookmarked: await libManager.isBookmarked(session.user.id, docId) }
    },
    async isBookmarkedBatch(docIds) {
      const session = await getServerSession(authOptions)
      if (!session?.user) return { bookmarkedIds: [] }
      const result = await libManager.isBookmarkedBatch(session.user.id, docIds)
      return { bookmarkedIds: Array.from(result) }
    },
  }
}
