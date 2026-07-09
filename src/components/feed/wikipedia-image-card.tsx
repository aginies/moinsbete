'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Camera, ExternalLink, RefreshCw, X, AlertCircle, EyeOff, Eye } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [show, setShow] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const prevShowRef = useRef<boolean>(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
    const stored = localStorage.getItem('wikipedia_image_card_visible')
    if (stored !== null) {
      setShow(stored === 'true')
    }
    prevShowRef.current = show
  }, [])

  const hasLoadedRef = useRef(false)

  const loadImage = useCallback(async () => {
    if (loading) return
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
  }, [loading])

  const {
    bind,
    containerRef,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
    prevHintOpacity,
    nextHintOpacity,
  } = useSwipeGesture({
    onSwipeLeft: loadImage,
    onSwipeRight: loadImage,
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

  const handleToggle = useCallback(() => {
    setShow(prev => {
      const next = !prev
      localStorage.setItem('wikipedia_image_card_visible', String(next))
      return next
    })
  }, [])

  const hasImage = isValidUrl(image?.imageUrl ?? '') && !imageError

  const shareOptions = image ? {
    title: `Image du jour - ${image.description}`,
    text: `${image.description}\n\nDate: ${image.date}`,
    url: image.fileUrl,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  const cardContent = (
    <div
      onClick={swipeable ? undefined : loadImage}
      className="rounded-xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 dark:border-teal-700 dark:from-teal-950/30 dark:to-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400 dark:bg-teal-600">
            <Camera className="h-4 w-4 text-teal-950" />
          </div>
          {showLink ? (
            <Link href="/image-du-jour" className="text-sm font-bold uppercase tracking-wide text-teal-800 hover:underline dark:text-teal-300">
              Image du jour
            </Link>
          ) : (
            <h3 className="text-sm font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
              Image du jour
            </h3>
          )}
        </div>
        <div className="flex items-center gap-6">
          {showToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggle()
              }}
              className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 transition-colors"
              title="Masquer la carte"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              loadImage()
            }}
            className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
        </div>
      </div>

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
            href={image.fileUrl}
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
          <button
            onClick={handleToggle}
            className="w-full rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 p-4 dark:border-teal-800 dark:bg-teal-950/20 hover:border-teal-400 hover:bg-teal-50 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-teal-700 dark:text-teal-400">
              <Eye className="h-4 w-4" />
              <span>Afficher Image du jour</span>
            </div>
          </button>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] p-4">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={image?.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt={image?.description || 'Image'}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
