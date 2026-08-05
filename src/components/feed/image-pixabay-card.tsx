'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { BookOpen, ExternalLink, Bookmark, Filter, EyeOff, RefreshCw, Play, Maximize, Minimize } from 'lucide-react'
import Link from 'next/link'
import { useItemShare } from './use-item-share'
import { CardHeader } from './card-header'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { usePixabayActiveCategory } from '@/hooks/use-pixabay-active-category'
import { ImageLoading } from './image-loading'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useTranslations } from 'next-intl'

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
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'rain', label: 'Pluie', icon: '🌧️' },
  { id: 'sky', label: 'Ciel', icon: '☁️' },
  { id: 'sunset', label: 'Coucher de soleil', icon: '🌅' },
  { id: 'forest', label: 'Forêt', icon: '🌲' },
  { id: 'ocean', label: 'Océan', icon: '🌊' },
  { id: 'space', label: 'Espace', icon: '🌌' },
  { id: 'landscape', label: 'Paysage', icon: '🏞️' },
  { id: 'mountain', label: 'Montagne', icon: '🏔️' },
  { id: 'bird', label: 'Oiseau', icon: '🐦' },
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

function formatTime(seconds: number, empty = '0:00'): string {
  if (!seconds || seconds <= 0) return empty
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  return `0:${secs.toString().padStart(2, '0')}`
}

function ImagePixabayCardInner({
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
  const t = useTranslations('feed')
  const [video, setVideo] = useState<PixabayVideo | null>(() => {
    if (typeof sessionStorage === 'undefined') return null
    const saved = sessionStorage.getItem('pixabay_video')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { activeCategory, handleCategoryChange } = usePixabayActiveCategory(userId)
  const [showCategories, setShowCategories] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadVideo = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newVideo = await fetchRandomVideo(activeCategory)
    if (newVideo) {
      setVideo(newVideo)
      sessionStorage.setItem('pixabay_video', JSON.stringify(newVideo))
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [activeCategory])

  useAutoRefresh('pixabay', loadVideo)

  useEffect(() => {
    if (isVisible === false) return
    if (!video && !loading && !error) {
      const timer = setTimeout(() => {
        loadVideo()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, video, loading, error, loadVideo])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !video || loading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)

    return () => {
      observer.unobserve(el)
      observer.disconnect()
    }
  }, [video, loading])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const { isPending, handleBookmark, isFavorite } = useSimpleBookmarkToggle({
    resourceId: video ? String(video.id) : undefined,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await toggleBookmarkAction('IMAGE_PIXABAY', String(video!.id), action, {
        pageURL: video!.pageURL,
        author: video!.author,
        authorProfileUrl: video!.authorProfileUrl,
        duration: video!.duration,
        thumbnailUrl: video!.thumbnailUrl,
        videoUrl: video!.videoUrl,
        tags: video!.tags,
      })
    },
  })

  const handleCategorySelect = useCallback(async (categoryId: string) => {
    await handleCategoryChange(categoryId)
    loadVideo()
  }, [handleCategoryChange, loadVideo])

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

  const shareOptions = video ? { onClick: handleShare, copied, shareUrl } : undefined
  const c = getTheme('orange')

  const cardContent = (
    <CardShell color="orange">
      <CardHeader
        color="orange"
        icon={<BookOpen className={'h-4 w-4 ' + c.iconForeground} />}
        title="Pixabay Videos"
        linkHref={showLink ? '/image-pixabay' : undefined}
        showToggle={false}
        showRefresh={false}
        onRefresh={loadVideo}
        loading={loading || (video ? false : false)}
        shareOptions={shareOptions ? { onClick: handleShare, copied, shareUrl } : undefined}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={
          <div className="flex items-center justify-between sm:justify-end sm:gap-3">
            {showToggle && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggle?.() }}
                className={'mr-2 sm:mr-4 ' + c.title + ' hover:bg-current/10 transition-colors ' + c.titleDark}
                title={t('hide_card')}
                aria-label={t('hide_card')}
              >
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadVideo() }}
              className={c.title + ' hover:bg-current/10 transition-colors ' + c.titleDark}
              title={t('refresh_content')}
              aria-label={t('refresh_content')}
            >
              <RefreshCw className={'h-4 w-4 sm:h-5 sm:w-5 ' + (loading ? 'animate-spin' : '')} />
            </button>
            {video && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                disabled={isPending}
                className={'ml-2 sm:ml-4 ' + c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors disabled:opacity-50'}
                title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
              >
                <Bookmark className={'h-4 w-4 sm:h-5 sm:w-5 ' + (isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark)} />
              </button>
            )}
          </div>
        }
      />

      {showCategories && (
        <div className="mb-3 flex gap-1.5 flex-wrap">
          {DEFAULT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={(e) => { e.stopPropagation(); handleCategorySelect(category.id) }}
              className={'px-2.5 py-1 text-xs rounded-full border transition-colors ' + (
                activeCategory === category.id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-neutral-800 ' + c.headingSecondary + ' ' + c.headingSecondaryDark + ' border-amber-200 dark:border-amber-800 hover:border-amber-400'
              )}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className={'mb-3 flex items-center gap-2 rounded-lg border ' + c.errorBorder + ' ' + c.errorBg + ' p-3 ' + c.errorBorderDark + ' ' + c.errorBgDark}>
          <p className={'text-xs ' + c.errorText + ' ' + c.errorTextDark}>
            Impossible de charger la vidéo. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {loading && !video && (
        <ImageLoading />
      )}

      {video && !loading && (
        <div className={'mb-3 overflow-hidden rounded-lg border ' + c.imageBorder + ' ' + c.imageBorderDark + ' relative ' + (fullImage ? 'cursor-default' : 'cursor-pointer')}>
          <video
            key={video.videoUrl}
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            muted
            loop
            playsInline
            onTimeUpdate={() => {
              const el = videoRef.current
              if (el) setCurrentTime(el.currentTime)
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className={`w-full ${largeImage ? 'h-[28vh] object-cover bg-black' : fullImage ? 'max-h-[60vh] object-contain bg-black' : 'h-48 object-cover'}`}
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
          />
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
            >
              <Play className="h-12 w-12 sm:h-14 sm:w-14 text-white/80" />
            </div>
          )}
          {video.duration > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {formatTime(currentTime)} / {formatTime(video.duration, '')}
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCategories(prev => !prev) }}
              className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              title={showCategories ? t('hide_categories') : t('show_categories')}
              aria-label={showCategories ? t('hide_categories') : t('show_categories')}
            >
              <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
              className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              title={isFullscreen ? t('exit_fullscreen') : t('fullscreen')}
              aria-label={isFullscreen ? t('exit_fullscreen') : t('fullscreen')}
            >
              {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>
      )}

      {video && (
        <>
          <p className={'text-sm font-semibold ' + c.bodyBold + ' ' + c.bodyBoldDark + ' mb-1'}>
            Pixabay Video
          </p>
          {video.author && (
            <p className={'text-xs ' + c.headingSecondary + ' ' + c.headingSecondaryDark + ' mb-1'}>
              Par <Link href={video.authorProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>{video.author}</Link>
            </p>
          )}
          {video.tags && (
            <p className={'text-xs ' + c.muted + ' ' + c.mutedDark + ' mb-2'}>
              {video.tags.split(',').slice(0, 5).map(tag => tag.trim()).filter(Boolean).join(' · ')}
            </p>
          )}
          {showLink && (
            <Link
              href={video.pageURL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={'inline-flex items-center gap-1 text-xs ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
            >
              Voir sur Pixabay
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </>
      )}
    </CardShell>
  )

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="orange"
      label="Afficher Pixabay"
    >
      {swipeable ? (
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
    </CardVisibilityGuard>
  )
}
export const ImagePixabayCard = React.memo(ImagePixabayCardInner)
