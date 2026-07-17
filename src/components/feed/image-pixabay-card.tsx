'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { BookOpen, ExternalLink, Bookmark, Filter, EyeOff, RefreshCw, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { useItemShare } from './use-item-share'
import { CardHeader } from './card-header'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { VisibilityButton } from './visibility-button'
import { ImageLoading } from './image-loading'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'

interface PixabayVideo {
  id: number
  pageURL: string
  author: string
  authorProfileUrl: string
  duration: number
  thumbnailUrl: string
  videoUrl: string
  tags: string
}

interface Category {
  id: string
  label: string
  icon: string
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'forest', label: 'Forêt', icon: '🌲' },
  { id: 'sunset', label: 'Coucher de soleil', icon: '🌅' },
  { id: 'landscape', label: 'Paysage', icon: '🏔️' },
  { id: 'sky', label: 'Ciel', icon: '☁️' },
  { id: 'beach', label: 'Plage', icon: '🏖️' },
  { id: 'cat', label: 'Chat', icon: '🐱' },
  { id: 'dog', label: 'Chien', icon: '🐶' },
  { id: 'flowers', label: 'Fleurs', icon: '🌸' },
]

async function fetchRandomVideo(category?: string): Promise<PixabayVideo | null> {
  try {
    const url = category ? `/api/image-pixabay?category=${encodeURIComponent(category)}` : '/api/image-pixabay'
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error || !data?.videoUrl) return null
    return data
  } catch {
    return null
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  return `0:${secs.toString().padStart(2, '0')}`
}

export function ImagePixabayCard({
  userId,
  swipeable = false,
  fullImage = false,
  largeImage = false,
  showLink = true,
  showToggle = true,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'pixabay',
  isVisible,
}: {
  userId?: string
  swipeable?: boolean
  fullImage?: boolean
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
  enableAutoRefresh?: boolean
  storageKey?: string
  isVisible?: boolean
}) {
  const [video, setVideo] = useState<PixabayVideo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [allCategories, setAllCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [activeCategory, setActiveCategory] = useState<string>('forest')
  const [showCategories, setShowCategories] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { hasMounted, handleToggle, buttonColor } = useCardVisibility({
    storageKey: 'image_pixabay_card_visible',
    defaultShow: true,
    userId,
  })

  useEffect(() => {
    setShowCategories(true)
  }, [])

  const show = isVisible !== undefined ? isVisible : true

  const loadVideo = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newVideo = await fetchRandomVideo(activeCategory)
    if (newVideo) {
      setVideo(newVideo)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [activeCategory])

  useEffect(() => {
    if (hasMounted && show && !video && !loading && !error) {
      const timer = setTimeout(() => {
        loadVideo()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, video, loading, error, loadVideo])

  useEffect(() => {
    if (userId && video) {
      isBookmarkedAction('IMAGE_PIXABAY', String(video.id)).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [userId, video])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    el.addEventListener('play', handlePlay)
    el.addEventListener('pause', handlePause)
    return () => {
      el.removeEventListener('play', handlePlay)
      el.removeEventListener('pause', handlePause)
    }
  }, [video?.videoUrl])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [])

  const handleBookmark = useCallback(async () => {
    if (!video) return
    const newFavorite = !isFavorite
    try {
      await toggleBookmarkAction('IMAGE_PIXABAY', String(video.id), newFavorite ? 'add' : 'remove', {
        pageURL: video.pageURL,
        author: video.author,
        authorProfileUrl: video.authorProfileUrl,
        duration: video.duration,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
        tags: video.tags,
      })
      setIsFavorite(newFavorite)
    } catch {
      setIsFavorite(prev => !prev)
    }
  }, [video, isFavorite])

  const handleCategorySelect = useCallback((categoryId: string) => {
    setActiveCategory(categoryId)
    loadVideo()
  }, [loadVideo])

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: video?.pageURL ?? '',
    title: `Pixabay - ${video?.author ?? ''}`,
    text: video?.author ? `Par ${video.author}` : '',
    itemId: String(video?.id ?? ''),
  })

  const {
    bind,
    containerRef,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
  } = useSwipeGesture({
    onSwipeLeft: loadVideo,
    onSwipeRight: loadVideo,
    onRefresh: loadVideo,
    swipeable,
    resetDep: video?.videoUrl,
  })

  if (!hasMounted) return null

  const shareOptions = video ? { onClick: handleShare, copied, shareUrl } : undefined

  const cardContent = (
    <div
      onClick={loadVideo}
      className="rounded-xl border-2 border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-900 dark:from-amber-950/30 dark:to-yellow-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader
        icon={<BookOpen className="h-4 w-4 text-white" />}
        iconBgColor="bg-amber-700"
        iconDarkColor="dark:bg-amber-800"
        title="Pixabay Videos"
        titleColor="text-amber-800"
        titleDarkColor="dark:text-amber-300"
        linkHref={showLink ? '/image-pixabay' : undefined}
        showToggle={false}
        showRefresh={false}
        onRefresh={loadVideo}
        loading={loading || (video ? false : false)}
        shareOptions={shareOptions ? { onClick: handleShare, copied, shareUrl } : undefined}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCategories(prev => !prev) }}
              className="text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors"
              title={showCategories ? 'Masquer les catégories' : 'Afficher les catégories'}
            >
              <Filter className={`h-4 w-4 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            {showToggle && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (onToggle || handleToggle)() }}
                className="text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors"
                title="Masquer la carte"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadVideo() }}
              className="text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {video && userId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                className="text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors"
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
          {allCategories.map(category => (
            <button
              key={category.id}
              onClick={(e) => { e.stopPropagation(); handleCategorySelect(category.id) }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                activeCategory === category.id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-400'
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-100/50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Impossible de charger la vidéo. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {loading && !video && (
        <ImageLoading />
      )}

      {video && !loading && (
        <div className={`mb-3 overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800 relative ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            muted
            loop
            playsInline
            autoPlay
            className={`w-full ${largeImage ? 'h-[28vh] object-cover bg-black' : fullImage ? 'max-h-[60vh] object-contain bg-black' : 'h-48 object-cover'}`}
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
          />
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
            >
              <Play className="h-12 w-12 text-white/80" />
            </div>
          )}
          {video.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
      )}

      {video && (
        <>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Pixabay Video
          </p>
          {video.author && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
              Par <Link href={video.authorProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>{video.author}</Link>
            </p>
          )}
          {video.tags && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              {video.tags.split(',').slice(0, 5).map(tag => tag.trim()).filter(Boolean).join(' · ')}
            </p>
          )}
          {showLink && (
            <Link
              href={video.pageURL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
            >
              Voir sur Pixabay
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
        <VisibilityButton color={buttonColor} label="Afficher Pixabay" onClick={onToggle || handleToggle} />
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
    </>
  )
}
