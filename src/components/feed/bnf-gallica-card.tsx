'use client'

import { useState, useCallback, useEffect } from 'react'
import { BookOpen, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { VisibilityButton } from './visibility-button'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'

interface GallicaImage {
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

interface BnFGallicaCardProps {
  userId?: string
  swipeable?: boolean
  fullImage?: boolean
  showLink?: boolean
  showToggle?: boolean
}

async function fetchRandomImage(): Promise<GallicaImage | null> {
  try {
    const res = await fetch('/api/bnf-gallica', {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 300 },
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export function BnFGallicaCard({ userId, swipeable = false, fullImage = false, showLink = true, showToggle = true }: BnFGallicaCardProps) {
  const [image, setImage] = useState<GallicaImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const FAVORITES_KEY = 'bnf_gallica_favorites'

  const { show, hasMounted, handleToggle, buttonColor } = useCardVisibility({
    storageKey: 'bnf_gallica_card_visible',
    defaultShow: true,
  })

  const getFavorites = useCallback(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [FAVORITES_KEY])

  const loadImage = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newImage = await fetchRandomImage()
    if (newImage) {
      setImage(newImage)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadImage()
  }, [])

  useEffect(() => {
    if (userId && image) {
      isBookmarkedAction('BNF_GALICA', image.docid).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    } else if (!userId && image) {
      const favorites = getFavorites()
      setIsFavorite(favorites.some((f: { docid: string }) => f.docid === image.docid))
    }
  }, [userId, image, getFavorites])

  const handleBookmark = useCallback(async () => {
    if (!image) return
    const newFavorite = !isFavorite

    if (userId) {
      try {
        await toggleBookmarkAction('BNF_GALICA', image.docid, newFavorite ? 'add' : 'remove', {
          titre: image.titre,
          auteur: image.auteur,
          imageUrl: image.imageUrl,
          link: image.link,
          droits: image.droits,
        })
        setIsFavorite(newFavorite)
      } catch {
        setIsFavorite(prev => !prev)
      }
    } else {
      const favorites = getFavorites()
      const exists = favorites.some((f: { docid: string }) => f.docid === image.docid)
      if (newFavorite && !exists) {
        const newFav = {
          id: image.docid,
          docid: image.docid,
          titre: image.titre,
          auteur: image.auteur,
          imageUrl: image.imageUrl,
          link: image.link,
          droits: image.droits,
          favoritedAt: new Date().toISOString(),
        }
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites, newFav]))
      } else if (!newFavorite && exists) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.filter((f: { docid: string }) => f.docid !== image.docid)))
      }
      setIsFavorite(newFavorite)
    }
  }, [image, isFavorite, userId, getFavorites, FAVORITES_KEY])

  const shareOptions = image ? {
    title: `Gallica - ${image.titre}`,
    text: `${image.titre}\n${image.auteur || 'Bibliothèque nationale de France'}\n\n${image.droits || ''}`,
    url: image.link,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  const {
    bind,
    containerRef,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
  } = useSwipeGesture({
    onSwipeLeft: loadImage,
    onSwipeRight: loadImage,
    onRefresh: loadImage,
    swipeable,
    resetDep: image?.imageUrl,
  })

  const cardContent = (
    <div
      onClick={loadImage}
      className="rounded-xl border-2 border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 p-5 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-700 dark:bg-rose-800">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <Link
            href="/gallica-bnf"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-bold uppercase tracking-wide text-rose-800 dark:text-rose-300 hover:underline"
          >
            Gallica — BnF
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle() }}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors"
            title="Masquer la carte"
          >
            <EyeOff className="h-4 w-4" />
          </button>
          <RefreshCw className={`h-4 w-4 text-rose-600 dark:text-rose-400 ${loading ? 'animate-spin' : ''}`} />
          {image && (
            <button
              onClick={(e) => { e.stopPropagation(); handleBookmark() }}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          {shareOptions && (
            <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-100/50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Impossible de charger l&apos;image. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {image?.imageUrl && (
        <div
          className={`mb-3 overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800 ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={(e) => {
            if (!fullImage) {
              e.stopPropagation()
              setShowFullImage(true)
            }
          }}
        >
          <img
            src={image.imageUrl}
            alt={image.titre}
            loading="lazy"
            className={`w-full transition-opacity ${fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-48 object-cover pointer-events-none hover:opacity-90'}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {!fullImage && <ImageHint color="amber" />}
        </div>
      )}

     {image && (
        <>
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
            {image.titre}
          </p>
          {image.auteur && (
            <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
              {image.auteur}
            </p>
          )}
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">
            {image.droits || 'Bibliothèque nationale de France'}
          </p>
          {showLink && (
            <Link
              href={`https://images.bnf.fr/#/home/gallery/${image.docid}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
            >
              Voir sur images.bnf.fr
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      {!show && hasMounted ? (
        <div className="mb-6">
          <VisibilityButton color={buttonColor} label="Afficher Gallica" onClick={handleToggle} />
        </div>
      ) : swipeable ? (
        <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()}>
          <div
            className={`w-full relative z-10 ${isDragging || prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'}`}
            style={swipeStyle}
          >
            {cardContent}
          </div>
        </div>
      ) : (
        cardContent
      )}

      {showFullImage && image && (
        <ImageLightbox
          src={image.imageUrl}
          alt={image.titre}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  )
}
