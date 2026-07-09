'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, Camera } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getCnrsFavoritesAction, toggleCnrsFavoriteAction } from '@/actions/cnrs-bookmark-actions'
import { FavoritesList, type FavoriteItemBase } from '@/components/feed/favorites-list'
import { getStoredFavorites, removeStoredFavorite } from '@/lib/favorite-storage'

export interface CnrsFavoriteDoc extends FavoriteItemBase {
  id: string
  title: string
  category: string
  imageUrl: string | undefined
  link: string
  date: string
}

const CNRS_FAVORITES_KEY = 'cnrs_favorites'

interface CnrsBookmarksProps {
  userId?: string
}

export function CnrsBookmarks({ userId }: CnrsBookmarksProps) {
  const [favorites, setFavorites] = useState<CnrsFavoriteDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      if (userId) {
        try {
          const result = await getCnrsFavoritesAction()
          setFavorites(result.favorites as CnrsFavoriteDoc[])
        } catch {
          setFavorites(getStoredFavorites(CNRS_FAVORITES_KEY))
        }
      } else {
        setFavorites(getStoredFavorites(CNRS_FAVORITES_KEY))
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId])

  const handleRemove = useCallback(async (item: CnrsFavoriteDoc) => {
    if (userId) {
      try {
        const { toggleFavoriteAction } = await import('@/actions/favorite-actions')
        await toggleFavoriteAction('CNRS_NEWS', item.link, 'remove')
      } catch {
        // localStorage fallback
      }
    }
    setFavorites(prev => removeStoredFavorite(CNRS_FAVORITES_KEY, (f: CnrsFavoriteDoc) => f.link === item.link))
  }, [userId])

  return (
    <FavoritesList<CnrsFavoriteDoc>
      favorites={favorites}
      loading={loading}
      emptyTitle="Aucun favori CNRS"
      emptyDescription="Favorisez des actualites depuis la page d&apos;accueil pour les voir ici."
      storageKey={CNRS_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-green-200"
      bgGradient="bg-gradient-to-br from-green-50 to-emerald-50"
      darkBorderColor="dark:border-green-800"
      darkBgGradient="dark:from-green-950/20 dark:to-emerald-950/20"
      textColor="text-green-900"
      darkTextColor="dark:text-green-100"
      buttonColor="text-green-600"
      buttonHoverBg="hover:bg-green-100"
      renderItem={(item, onRemove) => (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {item.imageUrl && (
              <div className="mb-2 overflow-hidden rounded-lg border border-green-200 dark:border-green-800">
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
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
              {item.title}
            </h3>
            {item.category && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-green-200 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300">
                  {item.category}
                </span>
              </div>
            )}
            {item.date && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {isValidUrl(item.link) && (
              <Link
                href={sanitizeUrl(item.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:underline"
              >
                Lire sur CNRS Le Journal
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button
            onClick={onRemove}
            className="rounded-full p-1.5 text-green-600 opacity-60 hover:opacity-100 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/40 transition-all"
            title="Retirer des favoris"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}
