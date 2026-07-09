'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Camera, ExternalLink, AlertCircle, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl, sanitizeUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { VisibilityButton } from './visibility-button'
import { SwipeBackgroundCard } from './swipe-background-card'
import { toggleFavoriteAction, isFavoriteAction } from '@/actions/favorite-actions'

interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

interface WikipediaImageCardProps {
  fullImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  swipeable?: boolean
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
  showLink = true,
  showToggle = true,
  swipeable = false,
}: WikipediaImageCardProps) {
  const [image, setImage] = useState<ImageData | null>(null)
  const [nextImage, setNextImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const { show, hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'wikipedia_image_card_visible' })
  const prevShowRef = useRef<boolean>(true)

  const hasLoadedRef = useRef(false)

  // Background pre-fetching
  const prefetchNextImage = useCallback(async () => {
    const fetched = await fetchRandomImage()
    if (fetched) {
      setNextImage(fetched)
    }
  }, [])

  const loadImage = useCallback(async () => {
    if (loading) return
    
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
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      if (show) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadImage()
      }
    }
  }, [show, loadImage])

  useEffect(() => {
    if (!image && prevShowRef.current && !show) {
      prevShowRef.current = show
    } else if (!image && !prevShowRef.current && show) {
      prevShowRef.current = show
      loadImage()
    }
  }, [show, image, loadImage])

  const hasImage = isValidUrl(image?.imageUrl ?? '') && !imageError

  const shareOptions = image ? {
    title: `Image du jour - ${image.description}`,
    text: `${image.description}\n\nDate: ${image.date}`,
    url: image.fileUrl,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriting, setFavoriting] = useState(false)
  const imageId = image?.fileUrl || ''

  useEffect(() => {
    if (!imageId) return
    let mounted = true
    isFavoriteAction('IMAGE_DU_JOUR', imageId).then((result) => {
      if (mounted) setIsFavorited(result.isFavorite)
    })
    return () => { mounted = false }
  }, [imageId])

  const handleToggleFavorite = useCallback(async () => {
    if (!image || favoriting) return
    setFavoriting(true)
    const action = isFavorited ? 'remove' : 'add'
    await toggleFavoriteAction('IMAGE_DU_JOUR', image.fileUrl, action, {
      imageUrl: image.imageUrl,
      description: image.description,
      fileUrl: image.fileUrl,
      date: image.date,
    })
    setIsFavorited(!isFavorited)
    setFavoriting(false)
  }, [image, isFavorited, favoriting])

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
        onToggle={handleToggle}
        onRefresh={loadImage}
        loading={loading}
        shareOptions={{ onClick: share, copied, shareUrl }}
        extraActions={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
            disabled={Boolean(favoriting || !image)}
            className="rounded-full p-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all disabled:opacity-50"
            title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Bookmark
              className={`h-4 w-4 ${isFavorited ? 'fill-current text-teal-600 dark:text-teal-400' : 'text-teal-600 dark:text-teal-400'}`}
            />
          </button>
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

      {hasImage && (
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
            className={`w-full transition-opacity ${fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-48 object-cover pointer-events-none hover:opacity-90'}`}
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
        <div className="mb-6">
          <VisibilityButton color={buttonColor} label="Afficher Image du jour" onClick={handleToggle} />
        </div>
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
