'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Globe, ExternalLink, Trash2 } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { getPortailWikipediaFavoritesAction } from '@/actions/portail-wikipedia-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { useTranslations } from 'next-intl'

export interface PortailWikipediaFavoriteDoc {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string | null
  favoritedAt: string
}

const PORTAIL_WIKIPEDIA_FAVORITES_KEY = 'portail_wikipedia_favorites'

interface PortailWikipediaBookmarksProps {
  userId?: string
  onRemoveComplete: () => void
  searchQuery: string
}

export function PortailWikipediaBookmarks({ userId, onRemoveComplete, searchQuery }: PortailWikipediaBookmarksProps) {
  const t = useTranslations('feed')
  const { handleRemove, getFavorites } = useFavoritesList<PortailWikipediaFavoriteDoc>({
    userId,
    storageKey: PORTAIL_WIKIPEDIA_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'PORTAIL_WIKIPEDIA',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getPortailWikipediaFavoritesAction()
      return result.favorites as PortailWikipediaFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      searchQuery={searchQuery}
      searchFields={(item) => `${item.title} ${item.extract || ''}`}
      renderItem={(item, onRemove) => (
        <div className="flex gap-3 p-1">
          {item.imageUrl && (
            <div className="flex-shrink-0 w-40">
              <Link
                href={sanitizeUrl(item.pageUrl || '#')}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={item.imageUrl}
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
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1 line-clamp-2">
                  {item.title}
                </h3>
                {item.extract && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed line-clamp-3">
                    {item.extract}
                  </p>
                )}
                {item.pageUrl && (
                  <Link
                    href={sanitizeUrl(item.pageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
                  >
                    {t('read_article')}
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
      emptyTitle="Aucun favori Portail Wikipédia"
      emptyDescription="Sélectionnez des articles de qualité depuis la page d'accueil pour les voir ici."
      storageKey={PORTAIL_WIKIPEDIA_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-indigo-200"
      bgGradient="bg-gradient-to-br from-indigo-50 to-violet-50"
      darkBorderColor="dark:border-indigo-800"
      darkBgGradient="dark:from-indigo-950/20 dark:to-violet-950/20"
      textColor="text-indigo-900"
      darkTextColor="dark:text-indigo-100"
      buttonColor="text-indigo-600"
      buttonHoverBg="hover:bg-indigo-100"
    />
  )
}
