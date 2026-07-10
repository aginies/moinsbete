import type { BookmarkType } from '@/generated/client'
import {
  toggleBookmark,
  isBookmarked,
  getBookmarks,
  getBookmarksCount,
} from '@/lib/favorite'
import type { CnrsFavoriteDoc } from '@/components/feed/cnrs-bookmarks'

export interface CnrsFavoriteMeta {
  title?: string
  category?: string
  imageUrl?: string
  link?: string
  date?: string
}

const TYPE: BookmarkType = 'CNRS_NEWS'

function mapMeta(meta: unknown, resourceId: string): CnrsFavoriteDoc | null {
  const m = meta as CnrsFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    category: m.category || '',
    imageUrl: m.imageUrl,
    link: m.link || '',
    date: m.date || '',
    favoritedAt: new Date().toISOString(),
  }
}

export async function toggleCnrsFavorite(
  userId: string,
  articleId: string,
  action?: 'add' | 'remove',
  meta?: CnrsFavoriteMeta,
) {
  return toggleBookmark(userId, TYPE, articleId, action, meta as Record<string, unknown>)
}

export async function isCnrsFavorite(userId: string, articleId: string): Promise<boolean> {
  return isBookmarked(userId, TYPE, articleId)
}

export async function getCnrsFavorites(userId: string): Promise<CnrsFavoriteDoc[]> {
  const items = await getBookmarks(userId, TYPE)
  return items
    .map((item) => mapMeta(item.meta, item.resourceId || ''))
    .filter((d): d is CnrsFavoriteDoc => d !== null)
}

export async function getCnrsFavoritesCount(userId: string): Promise<number> {
  return getBookmarksCount(userId, TYPE)
}
