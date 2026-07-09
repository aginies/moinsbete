'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getImageDuJourFavoritesAction, toggleImageDuJourFavoriteAction } from '@/actions/image-du-jour-bookmark-actions'
import { FavoritesList, type FavoriteItemBase } from '@/components/feed/favorites-list'
import { getStoredFavorites, removeStoredFavorite } from '@/lib/favorite-storage'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'

export interface ImageDuJourFavoriteDoc extends FavoriteItemBase {
  id: string
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

const IMAGE_DU_JOUR_FAVORITES_KEY = 'image_du_jour_favorites'

interface ImageDuJourBookmarksProps {
  userId?: string
}

export function ImageDuJourBookmarks({ userId }: ImageDuJourBookmarksProps) {
  const [favorites, setFavorites] = useState<ImageDuJourFavoriteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showFullImage, setShowFullImage] = useState<string | null>(null)

  useEffect(() => {
    async function loadFavorites() {
      if (userId) {
        try {
          const result = await getImageDuJourFavoritesAction()
          setFavorites(result.favorites as ImageDuJourFavoriteDoc[])
        } catch {
          setFavorites(getStoredFavorites(IMAGE_DU_JOUR_FAVORITES_KEY))
        }
      } else {
        setFavorites(getStoredFavorites(IMAGE_DU_JOUR_FAVORITES_KEY))
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId])

  const handleRemove = useCallback(async (item: ImageDuJourFavoriteDoc) => {
    if (userId) {
      try {
        const { toggleFavoriteAction } = await import('@/actions/favorite-actions')
        await toggleFavoriteAction('IMAGE_DU_JOUR', item.fileUrl, 'remove')
      } catch {
        // localStorage fallback
      }
    }
    setFavorites(prev => removeStoredFavorite(IMAGE_DU_JOUR_FAVORITES_KEY, (f: ImageDuJourFavoriteDoc) => f.fileUrl === item.fileUrl))
  }, [userId])

 return (
    <>
      <FavoritesList<ImageDuJourFavoriteDoc>
        favorites={favorites}
        loading={loading}
        emptyTitle="Aucune image favoris"
        emptyDescription="Cliquez sur le bookmark d&apos;une image du jour pour la sauvegarder ici."
        storageKey={IMAGE_DU_JOUR_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-teal-200"
        bgGradient="bg-gradient-to-br from-teal-50 to-emerald-50"
        darkBorderColor="dark:border-teal-800"
        darkBgGradient="dark:from-teal-950/20 dark:to-emerald-950/20"
        textColor="text-teal-900"
        darkTextColor="dark:text-teal-100"
        buttonColor="text-teal-600"
        buttonHoverBg="hover:bg-teal-100"
        renderItem={(item, onRemove) => {
          const shareOptions = item.fileUrl ? {
            title: `Image du jour - ${item.description}`,
            text: item.description,
            url: item.fileUrl,
          } : null
          const { share, copied, shareUrl } = useShare(shareOptions)
          return (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isValidUrl(item.imageUrl) && (
                  <div
                    className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800"
                    onClick={() => setShowFullImage(item.imageUrl)}
                  >
                    <img
                      src={sanitizeUrl(item.imageUrl, '')}
                      alt={item.description}
                      loading="lazy"
                      className="w-full h-32 object-cover transition-opacity hover:opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <ImageHint color="teal" />
                  </div>
                )}
                <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100 mb-2">
                  {item.description}
                </p>
                {isValidUrl(item.fileUrl) && (
                  <Link
                    href={sanitizeUrl(item.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
                  >
                    Voir sur Wikimedia Commons
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2">
                {shareOptions && (
                  <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
                )}
                <button
                  onClick={onRemove}
                  className="rounded-full p-1.5 text-teal-600 opacity-60 hover:opacity-100 hover:text-teal-800 hover:bg-teal-100 dark:text-teal-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 transition-all"
                  title="Retirer des favoris"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        }}
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Image du jour"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
