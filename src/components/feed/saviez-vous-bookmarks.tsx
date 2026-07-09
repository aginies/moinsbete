'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, ArrowUpRight } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getSaviezVousFavoritesAction } from '@/actions/saviez-vous-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { ShareButton } from './share-button'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'

export interface SaviezVousFavoriteDoc {
  id: string
  text: string
  sourceUrl: string | null
  imageFilename: string | null
  favoritedAt: string
}

const SAVIEZ_VOUS_FAVORITES_KEY = 'saviez_vous_favorites'

interface SaviezVousBookmarksProps {
  userId?: string
}

export function SaviezVousBookmarks({ userId }: SaviezVousBookmarksProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleShare = useCallback(async (item: SaviezVousFavoriteDoc) => {
    if (copiedId === item.id) return
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'
    const shareUrl = `${baseUrl}/saviez-vous/${item.id}`
    
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopiedId(item.id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch {
        // Clipboard write failed
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Le saviez-vous ?',
          text: item.text,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [copiedId])

  const handleRemove = async (item: SaviezVousFavoriteDoc) => {
    if (userId) {
      try {
        const { toggleFavoriteAction } = await import('@/actions/favorite-actions')
        await toggleFavoriteAction('SAVIEZ_VOUS', item.id, 'remove')
      } catch {
        // localStorage fallback
      }
    }
  }

  return (
    <>
      <PaginatedFavoritesList
        fetchFn={async () => {
          if (userId) {
            const result = await getSaviezVousFavoritesAction()
            return result.favorites as SaviezVousFavoriteDoc[]
          }
          try {
            const stored = localStorage.getItem(SAVIEZ_VOUS_FAVORITES_KEY)
            return stored ? JSON.parse(stored) : []
          } catch {
            return []
          }
        }}
        renderItem={(item, onRemove) => {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'
          const shareUrl = `${baseUrl}/saviez-vous/${item.id}`
          return (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {item.imageFilename && isValidUrl(item.imageFilename) && (
                  <div
                    className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800"
                    onClick={() => setShowFullImage(item.imageFilename)}
                  >
                    <img
                      src={sanitizeUrl(item.imageFilename, '')}
                      alt="Illustration"
                      loading="lazy"
                      className="w-full h-32 object-contain transition-opacity hover:opacity-90 bg-neutral-100 dark:bg-neutral-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <ImageHint color="blue" />
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
              <div className="flex flex-col gap-2">
                <ShareButton onClick={() => handleShare(item)} copied={copiedId === item.id} shareUrl={shareUrl} />
                <Link
                  href={`/saviez-vous/${item.id}`}
                  className="rounded-full p-1.5 text-blue-600 opacity-60 hover:opacity-100 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 transition-all"
                  title="Voir le fait"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
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
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Illustration"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
