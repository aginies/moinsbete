'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getSaviezVousFavoritesAction, toggleSaviezVousFavoriteAction } from '@/actions/saviez-vous-bookmark-actions'
import { FavoritesList, type FavoriteItemBase } from '@/components/feed/favorites-list'
import { getStoredFavorites, removeStoredFavorite } from '@/lib/favorite-storage'
import { useShare } from './use-share'
import { ShareButton } from './share-button'

export interface SaviezVousFavoriteDoc extends FavoriteItemBase {
  id: string
  text: string
  sourceUrl: string | null
  imageFilename: string | null
}

const SAVIEZ_VOUS_FAVORITES_KEY = 'saviez_vous_favorites'

interface SaviezVousBookmarksProps {
  userId?: string
}

export function SaviezVousBookmarks({ userId }: SaviezVousBookmarksProps) {
  const [favorites, setFavorites] = useState<SaviezVousFavoriteDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      if (userId) {
        try {
          const result = await getSaviezVousFavoritesAction()
          setFavorites(result.favorites as SaviezVousFavoriteDoc[])
        } catch {
          setFavorites(getStoredFavorites(SAVIEZ_VOUS_FAVORITES_KEY))
        }
      } else {
        setFavorites(getStoredFavorites(SAVIEZ_VOUS_FAVORITES_KEY))
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId])

  const handleRemove = useCallback(async (item: SaviezVousFavoriteDoc) => {
    if (userId) {
      try {
        const { toggleFavoriteAction } = await import('@/actions/favorite-actions')
        await toggleFavoriteAction('SAVIEZ_VOUS', item.id, 'remove')
      } catch {
        // localStorage fallback
      }
    }
    setFavorites(prev => removeStoredFavorite(SAVIEZ_VOUS_FAVORITES_KEY, (f: SaviezVousFavoriteDoc) => f.id === item.id))
  }, [userId])

  return (
    <FavoritesList<SaviezVousFavoriteDoc>
      favorites={favorites}
      loading={loading}
      emptyTitle="Aucun favori Le saviez-vous ?"
      emptyDescription="Favorisez des faits depuis la page d&apos;accueil pour les voir ici."
      storageKey={SAVIEZ_VOUS_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-blue-200"
      bgGradient="bg-gradient-to-br from-blue-50 to-cyan-50"
      darkBorderColor="dark:border-blue-800"
      darkBgGradient="dark:from-blue-950/20 dark:to-cyan-950/20"
      textColor="text-blue-900"
      darkTextColor="dark:text-blue-100"
      buttonColor="text-blue-600"
      buttonHoverBg="hover:bg-blue-100"
      renderItem={(item, onRemove) => {
        const shareOptions = item.sourceUrl ? {
          title: 'Le saviez-vous ?',
          text: item.text,
          url: item.sourceUrl,
        } : null
        const { share, copied, shareUrl } = useShare(shareOptions)
        return (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {item.imageFilename && isValidUrl(item.imageFilename) && (
                <div className="mb-2 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
                  <img
                    src={sanitizeUrl(item.imageFilename, '')}
                    alt="Illustration"
                    loading="lazy"
                    className="w-full h-32 object-contain transition-opacity hover:opacity-90 bg-neutral-100 dark:bg-neutral-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100 mb-2">
                {item.text}
              </p>
              {item.sourceUrl && (
                <Link
                  href={sanitizeUrl(item.sourceUrl, '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
                >
                  Source: Wikipédia
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
              <button
                onClick={onRemove}
                className="rounded-full p-1.5 text-blue-600 opacity-60 hover:opacity-100 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 transition-all"
                title="Retirer des favoris"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      }}
    />
  )
}
