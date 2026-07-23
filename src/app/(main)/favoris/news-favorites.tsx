'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { getNewsFavoritesAction } from '@/actions/news-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { useCallback } from 'react'

export interface BbcFavorite {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  source: string
  category: string
  publishedAt: string
  favoritedAt: string
}

const FAVORITES_KEY = 'news_favorites'

interface NewsFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
  searchQuery?: string
}

export function NewsFavorites({ userId, onRemoveComplete, searchQuery }: NewsFavoritesProps) {
  const { handleRemove, getFavorites } = useFavoritesList<BbcFavorite>({
    userId,
    storageKey: FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'NEWS',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getNewsFavoritesAction()
      return result.favorites as BbcFavorite[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      searchQuery={searchQuery}
      searchFields={(item) => `${item.title} ${item.description} ${item.source}`}
      renderItem={(item, onRemove) => (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {item.imageUrl && (
              <div className="mb-2 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
                <img
                  src={sanitizeUrl(item.imageUrl, '')}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-32 object-cover transition-opacity hover:opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {item.title}
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {item.source}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {item.category}
              </span>
            </div>
            <Link
              href={sanitizeUrl(item.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
            >
              Lire l'article
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <button
            onClick={onRemove}
            className="rounded-full p-1.5 text-blue-600 opacity-60 hover:opacity-100 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 transition-all"
            title="Retirer des favoris"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      emptyTitle="Aucun favori NEWS"
      emptyDescription="Ajoutez des articles NEWS depuis la page d'accueil pour les voir ici."
      storageKey={FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-blue-200"
      bgGradient="bg-gradient-to-br from-blue-50 to-indigo-50"
      darkBorderColor="dark:border-blue-800"
      darkBgGradient="dark:from-blue-950/20 dark:to-indigo-950/20"
      textColor="text-blue-900"
      darkTextColor="dark:text-blue-100"
      buttonColor="text-blue-600"
      buttonHoverBg="hover:bg-blue-100"
    />
  )
}
