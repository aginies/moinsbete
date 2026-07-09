'use client'

import React from 'react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Lightbulb, ExternalLink, RefreshCw, ImageIcon, X, EyeOff, Eye } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl as isValidUrlUtil, sanitizeUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'

interface SaviezVousCardProps {
  id: string
  text: string
  sourceUrl?: string | null
  imageFilename?: string | null
  showLink?: boolean
  showToggle?: boolean
  imageHeight?: string
  swipeable?: boolean
}

async function fetchRandomFact() {
  try {
    const res = await fetch('/api/saviez-vous?count=1', { cache: 'no-store' })
    const data = await res.json()
    if (data.facts?.length > 0) {
      return data.facts[0]
    }
  } catch {}
  return null
}

export const SaviezVousCard = React.memo(function SaviezVousCardInner({
  id,
  text,
  sourceUrl,
  imageFilename,
  showLink = true,
  showToggle = true,
  imageHeight = 'h-48',
  swipeable = false,
}: SaviezVousCardProps) {
  const [fact, setFact] = useState({ id, text, sourceUrl, imageFilename })
  const [nextFact, setNextFact] = useState<{ id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageKey, setImageKey] = useState(0)
  const [showFullImage, setShowFullImage] = useState(false)
  const [show, setShow] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  // Background pre-fetching
  const prefetchNextFact = useCallback(async () => {
    const fetched = await fetchRandomFact()
    if (fetched) {
      setNextFact({
        id: fetched.id,
        text: fetched.text,
        sourceUrl: fetched.sourceUrl,
        imageFilename: fetched.imageFilename,
      })
    }
  }, [])

  useEffect(() => {
    setHasMounted(true)
    const stored = localStorage.getItem('saviez_vous_card_visible')
    if (stored !== null) {
      setShow(stored === 'true')
    }
  }, [])

  const handleToggle = useCallback(() => {
    setShow(prev => {
      const next = !prev
      localStorage.setItem('saviez_vous_card_visible', String(next))
      return next
    })
  }, [])

  const handleClick = useCallback(async () => {
    if (loading) return
    
    if (nextFact) {
      // Instant transition!
      setFact(nextFact)
      setNextFact(null)
      setImageKey(prev => prev + 1)
    } else {
      // Fallback on-demand fetch
      setLoading(true)
      setImageError(false)
      const newFact = await fetchRandomFact()
      if (newFact) {
        setFact({ id: newFact.id, text: newFact.text, sourceUrl: newFact.sourceUrl, imageFilename: newFact.imageFilename })
        setImageKey(prev => prev + 1)
      }
      setLoading(false)
    }
  }, [loading, nextFact])

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
    onSwipeLeft: handleClick,
    onSwipeRight: handleClick,
    onDragStart: prefetchNextFact,
    swipeable,
    resetDep: fact.id,
  })

  // Desktop keyboard accessibility listener
  useEffect(() => {
    if (!swipeable) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        if (e.key === ' ') e.preventDefault() // prevent spacebar page scroll
        handleClick()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [swipeable, handleClick])

  const resolvedImageFilename = fact.imageFilename || imageFilename
  const hasImage = isValidUrlUtil(resolvedImageFilename) && !imageError

  const cachedImageUrl = useMemo(() => {
    if (!resolvedImageFilename || !isValidUrlUtil(resolvedImageFilename)) return resolvedImageFilename
    const separator = resolvedImageFilename.includes('?') ? '&' : '?'
    return `${resolvedImageFilename}${separator}imageKey=${imageKey}`
  }, [resolvedImageFilename, imageKey])

  const shareOptions = fact.id ? {
    title: 'Le saviez-vous ?',
    text: fact.text,
    url: `${typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'}/saviez-vous/${fact.id}`,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  const absX = Math.abs(dragX)
  const bgScale = Math.min(0.95 + (absX / 1000) * 0.05, 1)
  const bgOpacity = isDragging && absX > 0 ? Math.min(0.2 + (absX / 200) * 0.8, 1) : 0

  const cardContent = (
    <div
      onClick={swipeable ? undefined : handleClick}
      className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-700 dark:from-blue-950/30 dark:to-cyan-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 dark:bg-blue-600">
            <Lightbulb className="h-4 w-4 text-blue-950" />
          </div>
          {showLink ? (
            <Link href="/le-saviez-vous" className="text-sm font-bold uppercase tracking-wide text-blue-800 hover:underline dark:text-blue-300">
              Le saviez-vous ?
            </Link>
          ) : (
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
              Le saviez-vous ?
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
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
              title="Masquer la carte"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
        </div>
      </div>

      {hasImage && (
        <div
          className="mb-3 cursor-pointer overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800"
          onClick={(e) => {
            e.stopPropagation()
            setShowFullImage(true)
          }}
        >
          <img
            src={cachedImageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt="Illustration"
            loading="lazy"
            className={`w-full ${imageHeight} object-contain transition-opacity hover:opacity-90 pointer-events-none bg-neutral-100 dark:bg-neutral-800`}
            onError={() => setImageError(true)}
          />
          <div className="flex items-center justify-center gap-1 bg-blue-100/80 px-3 py-1.5 dark:bg-blue-900/40">
            <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">Cliquez pour agrandir</span>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
        {fact.text}
      </p>
      {fact.sourceUrl && (
        <div className="mt-3">
          <Link
            href={sanitizeUrl(fact.sourceUrl, '#')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Source: Wikipédia
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
            className="w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <Eye className="h-4 w-4" />
              <span>Afficher Le saviez-vous ?</span>
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

          {/* Background Card Stack (Using pre-fetched nextFact) */}
          {nextFact && bgOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out z-0"
              style={{
                transform: `scale(${bgScale})`,
                opacity: bgOpacity,
              }}
            >
              <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-700 dark:from-blue-950/30 dark:to-cyan-950/30 h-full opacity-60 overflow-hidden">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 dark:bg-blue-600">
                      <Lightbulb className="h-4 w-4 text-blue-950" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                      Le saviez-vous ?
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                  {nextFact.text}
                </p>
              </div>
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
              src={cachedImageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt="Illustration"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
})
