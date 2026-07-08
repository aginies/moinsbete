'use client'

import { useState, useCallback, useEffect } from 'react'
import { Camera, ExternalLink, RefreshCw, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'

interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
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

export const WikipediaImageCard = function WikipediaImageCardInner() {
  const [image, setImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  const loadImage = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadImage()
  }, [])

  const hasImage = isValidUrl(image?.imageUrl ?? '') && !imageError

  const shareOptions = image ? {
    title: `Image du jour - ${image.description}`,
    text: `${image.description}\n\nDate: ${image.date}`,
    url: image.fileUrl,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  return (
    <>
      <div
        onClick={loadImage}
        className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/30 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 dark:bg-amber-600">
              <Camera className="h-4 w-4 text-amber-950" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Image du jour
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
          </div>
        </div>

        {error && !loading && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-100/50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Impossible de charger l'image. Cliquez pour réessayer.
            </p>
          </div>
        )}

        {hasImage && (
          <div
            className="mb-3 cursor-pointer overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800"
            onClick={(e) => {
              e.stopPropagation()
              setShowFullImage(true)
            }}
          >
            <img
              src={image?.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt={image?.description || 'Image'}
              className="w-full h-48 object-contain transition-opacity hover:opacity-90 pointer-events-none bg-neutral-100 dark:bg-neutral-800"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {image && (
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
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
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Voir sur Wikimedia Commons
            </Link>
          </div>
        )}
      </div>

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
