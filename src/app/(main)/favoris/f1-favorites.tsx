'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Trash2 } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getF1FavoritesAction } from '@/actions/f1-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { useTranslations } from 'next-intl'

export interface F1FavoriteDoc {
  id: string
  title: string
  section: string
  imageUrl: string | undefined
  link: string
  favoritedAt: string
  date?: string
  content?: string
  summary?: string
}

const F1_FAVORITES_KEY = 'f1_favorites'

interface F1FavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
  searchQuery?: string
}

export function F1Favorites({ userId, onRemoveComplete, searchQuery }: F1FavoritesProps) {
  const t = useTranslations('feed')
  const { handleRemove, getFavorites } = useFavoritesList<F1FavoriteDoc>({
    userId,
    storageKey: F1_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'F1',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getF1FavoritesAction()
      return result.favorites as F1FavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      searchQuery={searchQuery}
      searchFields={(item) => `${item.title} ${item.section}`}
      renderItem={(item, onRemove) => (
        <div className="flex gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 transition-colors overflow-hidden">
          {item.imageUrl && (
            <div className="flex-shrink-0 w-40">
              <Link
                href={sanitizeUrl(item.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={sanitizeUrl(item.imageUrl, '')}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-24 object-cover transition-opacity hover:opacity-90 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </Link>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1 line-clamp-2">
                  {item.title}
                </h3>
                {item.date && (
                  <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                    {item.date}
                  </p>
                )}
                {item.content && (
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed line-clamp-3 mb-2">
                    {item.content}
                  </p>
                )}
                {isValidUrl(item.link) && (
                  <Link
                    href={sanitizeUrl(item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:underline"
                  >
                    Voir l&apos;article
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <button
                onClick={onRemove}
                className="rounded-full p-1.5 text-red-500 opacity-60 hover:opacity-100 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40 transition-all"
                title={t('remove_favorite')}
                aria-label={t('remove_favorite')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      emptyTitle="Aucun favori F1"
      emptyDescription="Favorisez des articles depuis la carte Formule 1 pour les voir ici."
      storageKey={F1_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-red-200"
      bgGradient="bg-gradient-to-br from-red-50 to-rose-50"
      darkBorderColor="dark:border-red-800"
      darkBgGradient="dark:from-red-950/20 dark:to-rose-950/20"
      textColor="text-red-900"
      darkTextColor="dark:text-red-100"
      buttonColor="text-red-600"
      buttonHoverBg="hover:bg-red-100"
    />
  )
}
