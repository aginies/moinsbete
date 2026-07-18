'use client'

import { useState, useCallback, useEffect } from 'react'
import { Camera, ExternalLink, AlertCircle, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl, sanitizeUrl, generateImageId } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { VisibilityButton } from './visibility-button'
import { SwipeBackgroundCard } from './swipe-background-card'
import { ImageLoading } from './image-loading'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { encodeImageToUrl } from '@/lib/image-url-encoder'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'

interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

interface WikipediaImageCardProps {
  fullImage?: boolean
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  swipeable?: boolean
  onToggle?: () => void
  enableAutoRefresh?: boolean
  storageKey?: string
  userId?: string
  isVisible?: boolean
}

async function fetchRandomImage(): Promise<ImageData | null> {
  try {
    const res = await fetch('/api/wikipedia-image', { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export const WikipediaImageCard = function WikipediaImageCardInner({
  fullImage,
  largeImage = false,
  showLink = true,
  showToggle = true,
  swipeable = false,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'image_du_jour',
  userId,
  isVisible,
}: WikipediaImageCardProps) {
  const [image, setImage] = useState<ImageData | null>(null)
  const [nextImage, setNextImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const { hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'wikipedia_image_card_visible', userId })
  const show = isVisible !== undefined ? isVisible : true

  // Background pre-fetching
  const prefetchNextImage = useCallback(async () => {
    const fetched = await fetchRandomImage()
    if (fetched) {
      setNextImage(fetched)
    }
  }, [])

  const loadImage = useCallback(async () => {
    if (loading) return
    setIsImageLoaded(false)
    if (nextImage) {
      // Instant transition!
      setImage(nextImage)
      setNextImage(null)
      setError(false)
      setImageError(false)
    } else {
      // Fallback on-demand fetch
      setLoading(true)
      setError(false)
      setImageError(false)
      const newImage = await fetchRandomImage()
      if (newImage) {
        setImage(newImage)
        setError(false)
      } else {
        setError(true)
      }
      setLoading(false)
    }
  }, [loading, nextImage])

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
    if (hasMounted && show && !image && !loading && !error) {
      const timer = setTimeout(() => {
        loadImage()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, image, loading, error, loadImage])

  const hasImage = isValidUrl(image?.imageUrl ?? '') && !imageError

  const shareImageId = image ? generateImageId(image.fileUrl, image.date) : ''
  const encodedData = image ? encodeImageToUrl({ imageUrl: image.imageUrl, description: image.description, fileUrl: image.fileUrl, date: image.date }) : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const shareUrl = image ? `${origin}/image-du-jour/${shareImageId}?d=${encodedData}` : ''

  const { handleShare, copied } = useItemShare({
    shareUrl,
    title: image ? `Image du jour - ${image.description}` : '',
    text: image ? `${image.description}\n\nDate: ${image.date}` : '',
  })

  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriting, setFavoriting] = useState(false)
  const imageId = image?.fileUrl || ''

  useEffect(() => {
    if (!imageId) return
    let mounted = true
    isBookmarkedAction('IMAGE_DU_JOUR', imageId).then((result) => {
      if (mounted) setIsFavorited(result.isBookmarked)
    })
    return () => { mounted = false }
  }, [imageId])

  const handleToggleFavorite = useCallback(async () => {
    if (!image || favoriting) return
    setFavoriting(true)
    const action = isFavorited ? 'remove' : 'add'
    await toggleBookmarkAction('IMAGE_DU_JOUR', image.fileUrl, action, {
      imageUrl: image.imageUrl,
      description: image.description,
      fileUrl: image.fileUrl,
      date: image.date,
    })
    setIsFavorited(!isFavorited)
    setFavoriting(false)
  }, [image, isFavorited, favoriting])

  if (!hasMounted) {
    return null
  }

  const absX = Math.abs(dragX)
  const bgOpacity = isDragging && absX > 0 ? Math.min(0.2 + (absX / 200) * 0.8, 1) : 0

  const cardContent = (
    <div
      onClick={swipeable ? undefined : loadImage}
      className="rounded-xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 dark:border-teal-700 dark:from-teal-950/30 dark:to-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader
         icon={<Camera className="h-4 w-4 text-teal-950" />}
         iconBgColor="bg-teal-400"
         iconDarkColor="dark:bg-teal-600"
         title="Image du jour"
         titleColor="text-teal-800"
         titleDarkColor="dark:text-teal-300"
         linkHref={showLink ? '/image-du-jour' : undefined}
         showToggle={showToggle}
         onToggle={onToggle || handleToggle}
         onRefresh={loadImage}
         loading={loading || (image?.imageUrl ? !isImageLoaded : false)}
          shareOptions={{ onClick: handleShare, copied, shareUrl }}
          enableAutoRefresh={enableAutoRefresh}
          storageKey={storageKey}
          extraActions={
          image && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
                disabled={favoriting}
                className="rounded-full p-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all disabled:opacity-50"
                title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Bookmark
                  className={`h-4 w-4 ${isFavorited ? 'fill-current text-teal-600 dark:text-teal-400' : 'text-teal-600 dark:text-teal-400'}`}
                />
              </button>
              {userId && image.fileUrl && (
                <ShareToLobbyButton
                  resourceId={image.fileUrl}
                  resourceType="IMAGE_DU_JOUR"
                  className="rounded-full p-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all"
                />
              )}
            </>
          )
        }
      />

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-100/50 p-3 dark:border-teal-800 dark:bg-teal-900/20">
          <AlertCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <p className="text-xs text-teal-700 dark:text-teal-300">
            Impossible de charger l&apos;image. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {loading && image?.imageUrl && (
        <ImageLoading
          borderColor="border-teal-200"
          borderDarkColor="dark:border-teal-800"
          iconColor="text-teal-400"
          iconDarkColor="dark:text-teal-400"
        />
      )}

      {hasImage && !loading && (
        <div
          className={`mb-3 overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800 ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={(e) => {
            if (!fullImage) {
              e.stopPropagation()
              setShowFullImage(true)
            }
          }}
        >
          <img
            src={image?.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={image?.description || 'Image'}
            loading="lazy"
            className={`w-full transition-opacity ${largeImage ? 'h-[22vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-48 object-cover pointer-events-none hover:opacity-90'}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!fullImage && <ImageHint color="teal" />}
        </div>
      )}

      {image && (
        <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100">
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
            className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Voir sur Wikimedia Commons
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      {!show && hasMounted && showToggle ? (
        <VisibilityButton color={buttonColor} label="Afficher Image du jour" onClick={onToggle || handleToggle} />
      ) : swipeable ? (
        <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()}>
          {/* Prev hint overlay */}
          {prevHintOpacity > 0 && (
            <div
              className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
              style={{ opacity: prevHintOpacity }}
            >
              ← Précédent
            </div>
          )}

          {/* Next hint overlay */}
          {nextHintOpacity > 0 && (
            <div
              className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
              style={{ opacity: nextHintOpacity }}
            >
              Suivant →
            </div>
          )}

          {/* Background Card Stack (Using pre-fetched nextImage) */}
          {nextImage && bgOpacity > 0 && (
            <SwipeBackgroundCard
              title="Image du jour"
              icon={<Camera className="h-4 w-4 text-teal-950" />}
              iconBgColor="bg-teal-400"
              iconDarkColor="dark:bg-teal-600"
              titleColor="text-teal-800"
              titleDarkColor="dark:text-teal-300"
              borderColor="border-teal-300"
              borderDarkColor="dark:border-teal-700"
              bgGradient="bg-gradient-to-br from-teal-50 to-emerald-50"
              bgGradientDark="dark:from-teal-950/30 dark:to-emerald-950/30"
              textColor="text-teal-900"
              textDarkColor="dark:text-teal-100"
            >
              {nextImage.imageUrl && (
                <div className="mb-3 overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800 h-48">
                  <img
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

      {showFullImage && (
        <ImageLightbox
          src={image?.imageUrl || ''}
          alt={image?.description || 'Image'}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  )
}
