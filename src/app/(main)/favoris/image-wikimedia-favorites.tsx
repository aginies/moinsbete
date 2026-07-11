'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getWikimediaFavoritesAction } from '@/actions/image-wikimedia-bookmark-actions'
import { type WikimediaImageFavoriteDoc } from '@/lib/image-wikimedia-bookmark'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { ShareButton } from '@/components/feed/share-button'
import { useState, useCallback } from 'react'

const WIKIMEDIA_FAVORITES_KEY = 'image_wikimedia_favorites'

interface ImageWikimediaFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
}

export function ImageWikimediaFavorites({ userId, onRemoveComplete }: ImageWikimediaFavoritesProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleShare = useCallback(async (item: WikimediaImageFavoriteDoc) => {
    if (copiedId === item.id) return

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(item.link)
        setCopiedId(item.id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch {
        // Clipboard write failed
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.titre,
          text: item.auteur ? `Par ${item.auteur}` : '',
          url: item.link,
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [copiedId])

  const handleRemove = async (item: WikimediaImageFavoriteDoc) => {
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
            const result = await getWikimediaFavoritesAction()
            return result.favorites as WikimediaImageFavoriteDoc[]
          }
          try {
            const stored = localStorage.getItem(WIKIMEDIA_FAVORITES_KEY)
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
                  Voir sur Wikimedia Commons
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <ShareButton onClick={() => handleShare(item)} copied={copiedId === item.id} shareUrl={item.link} />
              <button
                onClick={onRemove}
                className="rounded-full p-1.5 text-rose-600 opacity-60 hover:opacity-100 hover:text-rose-800 hover:bg-rose-100 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-900/40 transition-all"
                title="Retirer des favoris"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        emptyTitle="Aucun favori Wikimedia"
        emptyDescription="Favorisez des images depuis la page d&apos;accueil pour les voir ici."
        storageKey={WIKIMEDIA_FAVORITES_KEY}
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
          alt="Wikimedia Commons"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
