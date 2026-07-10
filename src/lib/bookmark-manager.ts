import type { BookmarkType } from '@/generated/client'
import { toggleBookmark, isBookmarked, getBookmarks, getBookmarksCount } from '@/lib/favorite'

export interface BookmarkMapper<Doc extends { id: string }> {
  (meta: unknown, resourceId: string): Doc | null
}

export interface BookmarkManager<Doc extends { id: string }> {
  toggle(userId: string, resourceId: string, action?: 'add' | 'remove', meta?: Record<string, unknown>): Promise<{ bookmarked: boolean; wasBookmarked: boolean }>
  isBookmarked(userId: string, resourceId: string): Promise<boolean>
  getFavorites(userId: string): Promise<Doc[]>
  getFavoritesCount(userId: string): Promise<number>
}

export function createBookmarkManager<Doc extends { id: string }>(
  type: BookmarkType,
  mapMeta: BookmarkMapper<Doc>,
): BookmarkManager<Doc> {
  return {
    async toggle(userId, resourceId, action, meta) {
      return toggleBookmark(userId, type, resourceId, action, meta)
    },
    async isBookmarked(userId, resourceId) {
      return isBookmarked(userId, type, resourceId)
    },
    async getFavorites(userId) {
      const items = await getBookmarks(userId, type)
      return items
        .map(item => mapMeta(item.meta, item.resourceId || ''))
        .filter((d): d is Doc => d !== null)
    },
    async getFavoritesCount(userId) {
      return getBookmarksCount(userId, type)
    },
  }
}
