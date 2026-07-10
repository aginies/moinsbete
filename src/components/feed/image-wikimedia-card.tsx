'use client'

import { useState, useCallback, useEffect } from 'react'
import { BookOpen, ExternalLink, Bookmark, Filter, EyeOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useShare } from './use-share'
import { CardHeader } from './card-header'
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
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
}

const TOPICS = [
  { id: 'paintings', label: 'Peintures', icon: '🎨' },
  { id: 'aviation', label: 'Aviation', icon: '✈️' },
  { id: 'nasa', label: 'NASA', icon: '🚀' },
  { id: 'posters', label: 'Affiches', icon: '📋' },
  { id: 'wwi', label: 'Guerre 14-18', icon: '🎖️' },
  { id: 'wwii', label: 'Guerre 39-45', icon: '🪖' },
  { id: 'art', label: 'Art', icon: '🎭' },
  { id: 'advertisements', label: 'Publicités', icon: '📰' },
  { id: 'maps', label: 'Cartes', icon: '🗺️' },
  { id: 'sports-car', label: 'Voitures de sport', icon: '🏎️' },
  { id: 'design', label: 'Design', icon: '📐' },
  { id: 'deep-space', label: 'Espace', icon: '🌌' },
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

export function ImageWikimediaCard({ userId, swipeable = false, fullImage = false, largeImage = false, showLink = true, showToggle = true, onToggle }: ImageWikimediaCardProps) {
  const [image, setImage] = useState<WikimediaImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTopics, setActiveTopics] = useState<string[]>(['aviation'])
  const [showCategories, setShowCategories] = useState(true)

  // Load showCategories and active topics preference from localStorage after mounting
  useEffect(() => {
    const storedTopics = localStorage.getItem('image_wikimedia_active_topics')
    if (storedTopics) {
      try {
        const parsed = JSON.parse(storedTopics)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(id => TOPICS.some(t => t.id === id))
          if (valid.length > 0) {
            setActiveTopics(valid)
          }
        }
      } catch {}
    }

    const storedShow = localStorage.getItem('image_wikimedia_show_categories')
    if (storedShow !== null) {
      setShowCategories(storedShow === 'true')
    }
  }, [])

  const handleToggleCategories = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowCategories(prev => {
      const next = !prev
      localStorage.setItem('image_wikimedia_show_categories', String(next))
      return next
    })
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
      <CardHeader
        icon={<BookOpen className="h-4 w-4 text-white" />}
        iconBgColor="bg-rose-700"
        iconDarkColor="dark:bg-rose-800"
        title="Wikimedia"
        titleColor="text-rose-800"
        titleDarkColor="dark:text-rose-300"
        linkHref={showLink ? '/image-wikimedia' : undefined}
        showToggle={false}
        showRefresh={false}
        shareOptions={shareOptions ? { onClick: share, copied, shareUrl } : undefined}
        extraActions={
          <>
            <button
              type="button"
              onClick={handleToggleCategories}
              className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
              title={showCategories ? 'Masquer les thèmes' : 'Afficher les thèmes'}
            >
              <Filter className={`h-4 w-4 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            {showToggle && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (onToggle || handleToggle)() }}
                className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
                title="Masquer la carte"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadImage() }}
              className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {image && userId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </>
        }
      />

      {showCategories && (
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
      )}

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
            className={`w-full transition-opacity ${largeImage ? 'h-[28vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-48 object-cover pointer-events-none hover:opacity-90'}`}
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
