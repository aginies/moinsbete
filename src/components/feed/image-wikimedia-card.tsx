'use client'

import { useState, useCallback, useEffect } from 'react'
import { BookOpen, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { VisibilityButton } from './visibility-button'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'

interface WikimediaImage {
  docid: string
  exemplaire: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

interface ImageWikimediaCardProps {
  userId?: string
  swipeable?: boolean
  fullImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
}

const TOPICS = [
  { id: 'paintings', label: 'Paintings', icon: '🎨' },
  { id: 'aviation', label: 'Aviation', icon: '✈️' },
  { id: 'nasa', label: 'NASA', icon: '🚀' },
  { id: 'posters', label: 'Posters', icon: '📋' },
  { id: 'wwi', label: 'WWI', icon: '🎖️' },
  { id: 'wwii', label: 'WWII', icon: '🪖' },
  { id: 'art', label: 'Art', icon: '🎭' },
  { id: 'art-nouveau', label: 'Art Nouveau', icon: '🌺' },
] as const

async function fetchRandomImage(topic?: string): Promise<WikimediaImage | null> {
  try {
    const url = topic ? `/api/image-wikimedia?topic=${encodeURIComponent(topic)}` : '/api/image-wikimedia'
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    if (!data?.imageUrl) return null
    return data
  } catch {
    return null
  }
}

export function ImageWikimediaCard({ userId, swipeable = false, fullImage = false, showLink = true, showToggle = true, onToggle }: ImageWikimediaCardProps) {
  const [image, setImage] = useState<WikimediaImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTopics, setActiveTopics] = useState<string[]>(['aviation'])

  // Load active topics from localStorage after mounting (client-side only to prevent hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('image_wikimedia_active_topics')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(id => TOPICS.some(t => t.id === id))
          if (valid.length > 0) {
            setActiveTopics(valid)
          }
        }
      } catch {}
    }
  }, [])

  const { show, hasMounted, handleToggle, buttonColor } = useCardVisibility({
    storageKey: 'image_wikimedia_card_visible',
    defaultShow: true,
  })

  const loadImage = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newImage = await fetchRandomImage(activeTopics.join(','))
    if (newImage) {
      setImage(newImage)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [activeTopics])

  useEffect(() => {
    if (hasMounted && show && !image && !loading && !error) {
      const timer = setTimeout(() => {
        loadImage()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, image, loading, error, loadImage])

  useEffect(() => {
    if (userId && image) {
      isBookmarkedAction('BNF_GALICA', image.docid).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [userId, image])

  const handleBookmark = useCallback(async () => {
    if (!image) return
    const newFavorite = !isFavorite

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
  }, [image, isFavorite])

  const handleTopicToggle = useCallback((topicId: string) => {
    setActiveTopics(prev => {
      let next: string[]
      if (prev.includes(topicId)) {
        if (prev.length === 1) return prev
        next = prev.filter(id => id !== topicId)
      } else {
        next = [...prev, topicId]
      }
      localStorage.setItem('image_wikimedia_active_topics', JSON.stringify(next))
      return next
    })
    setImage(null) // Reset image to trigger a fresh load of the new topics
  }, [])

  const shareOptions = image ? {
    title: `Wikimedia - ${image.titre}`,
    text: `${image.titre}\n${image.auteur || 'Wikimedia'}\n\n${image.droits || ''}`,
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
            href="/image-wikimedia"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-bold uppercase tracking-wide text-rose-800 dark:text-rose-300 hover:underline"
          >
            Wikimedia
          </Link>
        </div>
        <div className="flex items-center gap-6">
           {showToggle && (
             <button
               onClick={(e) => { e.stopPropagation(); (onToggle || handleToggle)() }}
               className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors"
               title="Masquer la carte"
             >
              <EyeOff className="h-4 w-4" />
            </button>
          )}
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

      <div className="mb-3 flex gap-1.5 flex-wrap">
        {TOPICS.map(topic => {
          const isActive = activeTopics.includes(topic.id)
          return (
            <button
              key={topic.id}
              onClick={(e) => { e.stopPropagation(); handleTopicToggle(topic.id) }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                isActive
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-neutral-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400'
              }`}
            >
              {topic.icon} {topic.label}
            </button>
          )
        })}
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
          {image.description && (
            <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-100 mb-2">
              {image.description}
            </p>
          )}
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">
            {image.droits || 'Wikimedia Commons'}
          </p>
          {showLink && (
            <Link
              href={image.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
            >
              Voir sur Wikimedia Commons
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
        <VisibilityButton color={buttonColor} label="Afficher Wikimedia" onClick={onToggle || handleToggle} />
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
