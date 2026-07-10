'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getPicrylFavoritesAction } from '@/actions/image-picryl-bookmark-actions'
import { type ImagePicrylFavoriteDoc } from '@/lib/image-picryl-bookmark'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { useState } from 'react'

const PICRYL_FAVORITES_KEY = 'image_picryl_favorites'

interface ImagePicrylFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
}

export function ImagePicrylFavorites({ userId, onRemoveComplete }: ImagePicrylFavoritesProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)

  const handleRemove = async (item: ImagePicrylFavoriteDoc) => {
    if (userId) {
      try {
        const { toggleBookmarkAction } = await import('@/actions/favorite-actions')
        await toggleBookmarkAction('BNF_GALICA', item.docid, 'remove')
      } catch {
        // localStorage fallback
      }
    }
  }

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={async () => {
          if (userId) {
            const result = await getPicrylFavoritesAction()
            return result.favorites as ImagePicrylFavoriteDoc[]
          }
          try {
            const stored = localStorage.getItem(PICRYL_FAVORITES_KEY)
            return stored ? JSON.parse(stored) : []
          } catch {
            return []
          }
        }}
        renderItem={(item, onRemove) => (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isValidUrl(item.imageUrl) && (
                <div
                  className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800"
                  onClick={() => setShowFullImage(item.imageUrl)}
                >
                  <img
                    src={sanitizeUrl(item.imageUrl, '')}
                    alt={item.titre}
                    loading="lazy"
                    className="w-full h-32 object-cover transition-opacity hover:opacity-90"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <ImageHint color="amber" />
                </div>
              )}
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
                {item.titre}
              </h3>
              {item.auteur && (
                <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
                  {item.auteur}
                </p>
              )}
              {isValidUrl(item.link) && (
                <Link
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
                >
                  Voir sur Picryl
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              onClick={onRemove}
              className="rounded-full p-1.5 text-rose-600 opacity-60 hover:opacity-100 hover:text-rose-800 hover:bg-rose-100 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-900/40 transition-all"
              title="Retirer des favoris"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        emptyTitle="Aucun favori Picryl"
        emptyDescription="Favorisez des images depuis la page d&apos;accueil pour les voir ici."
        storageKey={PICRYL_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-rose-200"
        bgGradient="bg-gradient-to-br from-rose-50 to-red-50"
        darkBorderColor="dark:border-rose-800"
        darkBgGradient="dark:from-rose-950/20 dark:to-red-950/20"
        textColor="text-rose-900"
        darkTextColor="dark:text-rose-100"
        buttonColor="text-rose-600"
        buttonHoverBg="hover:bg-rose-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Picryl"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
