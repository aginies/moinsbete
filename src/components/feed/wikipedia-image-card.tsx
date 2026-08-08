'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Camera, ExternalLink, AlertCircle, Bookmark, Filter } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl, sanitizeUrl, generateImageId } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { SwipeBackgroundCard } from './swipe-background-card'
import { ImageLoading } from './image-loading'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { encodeImageToUrl } from '@/lib/image-url-encoder'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'

interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

interface WikipediaImageCardProps {
  fullImage?: boolean
  largeImage?: boolean
  mediumImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  showBookmark?: boolean
  swipeable?: boolean
  onToggle?: () => void
  enableAutoRefresh?: boolean
  storageKey?: string
  isVisible?: boolean
  wikipediaImageShowEn?: boolean
}

async function fetchRandomImage(showFr: boolean, showEn: boolean): Promise<{ data: ImageData | null; error: string | null }> {
  try {
    const params = new URLSearchParams()
    if (showFr) params.set('lang', 'fr')
    if (showEn) params.set('lang', params.get('lang') ? `${params.get('lang')},en` : 'en')
    const url = `/api/wikipedia-image?${params.toString()}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (data.error) return { data: null, error: data.error }
    return { data, error: null }
  } catch {
    return { data: null, error: null }
  }
}

export const WikipediaImageCard = React.memo(function WikipediaImageCardInner({
  fullImage,
  largeImage = false,
  mediumImage = false,
  showLink = true,
  showToggle = true,
  showBookmark = true,
  swipeable = false,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'image_du_jour',
  isVisible,
  wikipediaImageShowEn: initialShowEn,
}: WikipediaImageCardProps) {
  const isLoggedIn = useIsLoggedIn()
  const t = useTranslations('feed')
  const [showFr, setShowFr] = useState(true)
  const [showEn, setShowEn] = useState(initialShowEn ?? false)
  const [showFilter, setShowFilter] = useState(false)
  const [image, setImage] = useState<ImageData | null>(() => {
    if (typeof sessionStorage === 'undefined') return null
    const saved = sessionStorage.getItem('wikipedia_image')
    return saved ? JSON.parse(saved) : null
  })
  const [nextImage, setNextImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  const prefetchNextImage = useCallback(async () => {
    const { data, error } = await fetchRandomImage(showFr, showEn)
    if (data) {
      setNextImage(data)
    }
    if (error) {
      setRateLimitError(error)
    }
  }, [showFr, showEn])

  const loadImage = useCallback(async () => {
    if (loading) return
    setIsImageLoaded(false)
    if (nextImage) {
      setImage(nextImage)
      setNextImage(null)
      setError(false)
      setImageError(false)
      setRateLimitError(null)
    } else {
      setLoading(true)
      setError(false)
      setImageError(false)
      setRateLimitError(null)
      const { data: newImage, error } = await fetchRandomImage(showFr, showEn)
      if (newImage) {
        setImage(newImage)
        sessionStorage.setItem('wikipedia_image', JSON.stringify(newImage))
        setError(false)
      } else {
        setError(true)
        if (error) {
          setRateLimitError(error)
        }
      }
      setLoading(false)
    }
  }, [loading, nextImage, showFr, showEn])

  useAutoRefresh('imageDuJour', loadImage)

  const handleToggleLang = useCallback(async (lang: 'fr' | 'en') => {
    const nextFr = lang === 'fr' ? !showFr : showFr
    const nextEn = lang === 'en' ? !showEn : showEn
    if (!nextFr && !nextEn) return
    setShowFr(nextFr)
    setShowEn(nextEn)
    try {
      await fetch('/api/user-card-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'wikipediaImageShowEn', value: nextEn }),
      })
    } catch (err) {
      console.error('Failed to toggle language filter:', err)
    }
  }, [showFr, showEn])

  const {
    bind,
    containerRef,
    dragX,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
    prevHintOpacity,
    nextHintOpacity,
  } = useSwipeGesture({
    onSwipeLeft: loadImage,
    onSwipeRight: loadImage,
    onDragStart: prefetchNextImage,
    onRefresh: loadImage,
    swipeable,
    resetDep: image?.imageUrl,
  })

  useEffect(() => {
    if (isVisible === false) return
    if (!image && !loading && !error) {
      const timer = setTimeout(() => {
        loadImage()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, image, loading, error, loadImage])

  const hasImage = isValidUrl(image?.imageUrl ?? '') && !imageError
  const c = getTheme('teal')

  const shareImageId = image ? generateImageId(image.fileUrl, image.date) : ''
  const encodedData = image ? encodeImageToUrl({ imageUrl: image.imageUrl, description: image.description, fileUrl: image.fileUrl, date: image.date }) : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const shareUrl = image ? `${origin}/image-du-jour/${shareImageId}?d=${encodedData}` : ''

  const { handleShare, copied } = useItemShare({
    shareUrl,
    title: image ? `Image du jour - ${image.description}` : '',
    text: image ? `${image.description}\n\nDate: ${image.date}` : '',
  })

  const { isPending, handleBookmark: handleToggleFavorite, isFavorite } = useSimpleBookmarkToggle({
    resourceId: image?.fileUrl,
    guard: () => !image,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await toggleBookmarkAction('IMAGE_DU_JOUR', image!.fileUrl, action, {
        imageUrl: image!.imageUrl,
        description: image!.description,
        fileUrl: image!.fileUrl,
        date: image!.date,
      })
    },
  })

  const absX = Math.abs(dragX)
  const bgOpacity = isDragging && absX > 0 ? Math.min(0.2 + (absX / 200) * 0.8, 1) : 0

  const cardContent = (
    <CardShell color="teal">
     <CardHeader
         color="teal"
         icon={<Camera className={'h-4 w-4 ' + c.iconForeground} />}
         title="Image du jour"
         linkHref={showLink ? '/image-du-jour' : undefined}
         showToggle={showToggle}
         onToggle={onToggle}
         onRefresh={loadImage}
         loading={loading || (image?.imageUrl ? !isImageLoaded : false)}
         shareOptions={{ onClick: handleShare, copied, shareUrl }}
         enableAutoRefresh={enableAutoRefresh}
         storageKey={storageKey}
extraActions={
             image && showBookmark && (
               <div className="flex items-center gap-2">
                 <ShareToLobbyButton resourceId={image.fileUrl} resourceType="IMAGE_DU_JOUR" meta={{ imageUrl: image.imageUrl, description: image.description, fileUrl: image.fileUrl, date: image.date }} />
                 {isLoggedIn && (
                   <button
                     type="button"
                     onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
                     disabled={isPending}
                     className={'rounded-full p-1.5 ' + c.hoverBg + ' ' + c.hoverBgDark + ' transition-all disabled:opacity-50'}
                     title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                     aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
                   >
                     <Bookmark
                       className={'h-4 w-4 sm:h-5 sm:w-5 ' + (isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark)}
                     />
                   </button>
                 )}
               </div>
             )
           }
      />

      {error && !loading && (
        <div className={'mb-3 flex items-center gap-2 rounded-lg border ' + c.errorBorder + ' ' + c.errorBg + ' p-3 ' + c.errorBorderDark + ' ' + c.errorBgDark}>
          <AlertCircle className={'h-4 w-4 ' + c.action + ' ' + c.actionDark} />
          <p className={'text-xs ' + c.errorText + ' ' + c.errorTextDark}>
            {rateLimitError || "Impossible de charger l&apos;image. Cliquez pour réessayer."}
          </p>
        </div>
      )}

      {loading && image?.imageUrl && (
        <ImageLoading
          borderColor={c.imageBorder}
          borderDarkColor={c.imageBorderDark}
          iconColor={c.action}
          iconDarkColor={c.actionDark}
        />
      )}

      {showFilter && (
        <div className="mb-3 flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleLang('fr') }}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              showFr
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-neutral-800 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:border-teal-400'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleLang('en') }}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              showEn
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-neutral-800 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:border-teal-400'
            }`}
          >
            EN
          </button>
        </div>
      )}

      {hasImage && !loading && (
        <div
          className={'mb-3 overflow-hidden rounded-lg border ' + c.imageBorder + ' ' + c.imageBorderDark + ' cursor-pointer'}
          onClick={(e) => {
            e.stopPropagation()
            setShowFullImage(true)
          }}
        >
          <img
            decoding="async"
            src={image?.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={image?.description || 'Image'}
            loading="lazy"
            className={`w-full transition-opacity ${largeImage ? 'h-[40vh] object-cover bg-neutral-100 dark:bg-neutral-800' : mediumImage ? 'h-[38vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-64 object-cover pointer-events-none hover:opacity-90'}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <ImageHint color="teal" />
        </div>
      )}

      {image && (
        <p className={'text-sm leading-relaxed ' + c.body + ' ' + c.bodyDark}>
          {image.description}
        </p>
      )}
       {image && (
        <div className="mt-3">
          <Link
            href={sanitizeUrl(image.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={'inline-flex items-center gap-1 text-xs ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
          >
            <ExternalLink className="h-3 w-3" />
            Voir sur Wikimedia Commons
          </Link>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowFilter(prev => !prev) }}
          className={'rounded-full p-1.5 ' + c.hoverBg + ' ' + c.hoverBgDark + ' transition-all'}
          title={showFilter ? t('hide_categories') : t('show_categories')}
          aria-label={showFilter ? t('hide_categories') : t('show_categories')}
        >
          <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${showFilter ? 'fill-current' : ''}`} />
        </button>
      </div>
    </CardShell>
  )

  return (
    <>
      <CardVisibilityGuard
        isVisible={isVisible}
        onToggle={onToggle}
        showToggle={showToggle}
        buttonColor="teal"
        label="Afficher Image du jour"
      >
        {swipeable ? (
          <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()}>
            {prevHintOpacity > 0 && (
              <div
                className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
                style={{ opacity: prevHintOpacity }}
              >
                ← Précédent
              </div>
            )}

            {nextHintOpacity > 0 && (
              <div
                className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
                style={{ opacity: nextHintOpacity }}
              >
                Suivant →
              </div>
            )}

            {nextImage && bgOpacity > 0 && (
              <SwipeBackgroundCard
                title="Image du jour"
                icon={<Camera className="h-4 w-4 text-teal-950" />}
                color="teal"
              >
                {nextImage.imageUrl && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800 h-48">
                    <img
                      decoding="async"
                      src={nextImage.imageUrl}
                      alt="Next Preview"
                      className="w-full h-full object-cover pointer-events-none opacity-90"
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100">
                  {nextImage.description}
                </p>
              </SwipeBackgroundCard>
            )}

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

      {showFullImage && (
        <ImageLightbox
          src={image?.imageUrl || ''}
          alt={image?.description || 'Image'}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  )
})
