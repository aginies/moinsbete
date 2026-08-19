import type { BookmarkType } from '@/generated/client'
import { prisma } from '@/lib/db'
import { createBookmarkManager } from '@/lib/bookmark-manager'
import type { BookmarkManager } from '@/lib/bookmark-manager'

export interface AirCrashFavoriteMeta {
  title?: string
  description?: string
  url?: string | null
  imageUrl?: string | null
  asnUrl?: string | null
}

export interface AirCrashFavoriteDoc {
  id: string
  title: string
  description: string
  url: string | null
  imageUrl: string | null
  asnUrl: string | null
  favoritedAt: string
}

export const AIR_CRASH_TYPE: BookmarkType = 'AIR_CRASH'

const baseManager = createBookmarkManager<AirCrashFavoriteDoc>(AIR_CRASH_TYPE, (meta, resourceId) => {
  const m = meta as AirCrashFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    description: m.description || '',
    url: m.url ?? null,
    imageUrl: m.imageUrl ?? null,
    asnUrl: m.asnUrl ?? null,
    favoritedAt: new Date().toISOString(),
  }
})

async function getAirCrashFavorites(userId: string): Promise<AirCrashFavoriteDoc[]> {
  const docs = await baseManager.getFavorites(userId)
  if (docs.length === 0) return docs
  const articles = await prisma.cachedAirCrashArticle.findMany({
    where: { id: { in: docs.map(d => d.id) } },
    select: { id: true, asnUrl: true },
  })
  const asnMap = new Map(articles.map(a => [a.id, a.asnUrl]))
  return docs.map(d => ({ ...d, asnUrl: d.asnUrl ?? asnMap.get(d.id) ?? null }))
}

export const airCrashManager: BookmarkManager<AirCrashFavoriteDoc> = {
  ...baseManager,
  getFavorites: getAirCrashFavorites,
}

export const getAirCrashFavoritesCount = baseManager.getFavoritesCount.bind(baseManager)
