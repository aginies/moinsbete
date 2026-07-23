'use client'

import React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Lightbulb, ExternalLink, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl as isValidUrlUtil, sanitizeUrl, decodeHtmlEntities } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { VisibilityButton } from './visibility-button'
import { SwipeBackgroundCard } from './swipe-background-card'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'

interface SaviezVousCardProps {
  id: string
  text: string
  sourceUrl?: string | null
  imageFilename?: string | null
  showLink?: boolean
  showToggle?: boolean
  showBookmark?: boolean
  showRefresh?: boolean
  showShare?: boolean
  imageHeight?: string
  swipeable?: boolean
  onToggle?: () => void
  enableAutoRefresh?: boolean
  storageKey?: string
  userId?: string
  isVisible?: boolean
  linkAs?: string
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
  showBookmark = true,
  showRefresh = true,
  showShare = true,
  imageHeight = 'h-48',
  swipeable = false,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'saviez_vous',
  userId,
  isVisible,
  linkAs,
}: SaviezVousCardProps) {
  const [fact, setFact] = useState(() => {
    if (typeof sessionStorage === 'undefined') return { id, text, sourceUrl, imageFilename }
    const saved = sessionStorage.getItem('saviez_vous_fact')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.id === id) return parsed
      } catch { /* ignore */ }
    }
    return { id, text, sourceUrl, imageFilename }
  })

  useEffect(() => {
    setFact({ id, text, sourceUrl, imageFilename })
  }, [id, text, sourceUrl, imageFilename])
  const [nextFact, setNextFact] = useState<{ id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageKey, setImageKey] = useState(0)
  const [showFullImage, setShowFullImage] = useState(false)
  const { show: showFromHook, hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'saviez_vous_card_visible', userId, initialShow: isVisible })
  const show = isVisible !== undefined ? isVisible : showFromHook
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

  const handleClick = useCallback(async () => {
    if (loading) return
    setIsImageLoaded(false)
    if (nextFact) {
      // Instant transition!
      setFact(nextFact)
      sessionStorage.setItem('saviez_vous_fact', JSON.stringify(nextFact))
      setNextFact(null)
      setImageKey(prev => prev + 1)
    } else {
      // Fallback on-demand fetch
      setLoading(true)
      setImageError(false)
      const newFact = await fetchRandomFact()
      if (newFact) {
        const factData = { id: newFact.id, text: newFact.text, sourceUrl: newFact.sourceUrl, imageFilename: newFact.imageFilename }
        setFact(factData)
        sessionStorage.setItem('saviez_vous_fact', JSON.stringify(factData))
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
    onRefresh: handleClick,
    swipeable,
    resetDep: fact.id,
  })

  const resolvedImageFilename = fact.imageFilename || imageFilename
  const hasImage = isValidUrlUtil(resolvedImageFilename) && !imageError

  const cachedImageUrl = useMemo(() => {
    if (!resolvedImageFilename || !isValidUrlUtil(resolvedImageFilename)) return resolvedImageFilename
    const separator = resolvedImageFilename.includes('?') ? '&' : '?'
    return `${resolvedImageFilename}${separator}imageKey=${imageKey}`
  }, [resolvedImageFilename, imageKey])

  const shareUrl = fact.id ? `${typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'}/saviez-vous/${fact.id}` : ''
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: 'Le saviez-vous ?',
    text: fact.text,
  })

  const { isPending, handleBookmark: handleToggleFavorite, isFavorite } = useSimpleBookmarkToggle({
    resourceId: fact?.id,
    guard: () => !fact,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await toggleBookmarkAction('SAVIEZ_VOUS', fact!.id, action, {
        text: fact!.text,
        sourceUrl: fact!.sourceUrl,
        imageFilename: fact!.imageFilename,
      })
    },
  })

  if (!hasMounted) {
    return null
  }

  const absX = Math.abs(dragX)
  const bgOpacity = isDragging && absX > 0 ? Math.min(0.2 + (absX / 200) * 0.8, 1) : 0

  const cardContent = (
    <div
      className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-700 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-md transition-shadow"
    >
      <CardHeader
        icon={<Lightbulb className="h-4 w-4 text-blue-950" />}
        iconBgColor="bg-blue-400"
        iconDarkColor="dark:bg-blue-600"
        title="saviez-vous ?"
        titleColor="text-blue-800"
        titleDarkColor="dark:text-blue-300"
        linkHref={showLink ? (linkAs || '/le-saviez-vous') : undefined}
        showToggle={showToggle}
        onToggle={onToggle || handleToggle}
        onRefresh={handleClick}
        showRefresh={showRefresh}
        loading={loading || (hasImage ? !isImageLoaded : false)}
        shareOptions={showShare ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={showBookmark ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <ShareToLobbyButton resourceId={fact.id} resourceType="SAVIEZ_VOUS" meta={{ text: fact.text, sourceUrl: fact.sourceUrl, imageFilename: fact.imageFilename }} />
            <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
            disabled={isPending || !fact}
            className="rounded-full p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50"
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Bookmark
              className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? 'fill-current text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}
            />
            </button>
          </div>
        ) : undefined}
      />

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
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <ImageHint color="blue" />
        </div>
      )}

      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
        {decodeHtmlEntities(fact.text)}
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
        <VisibilityButton color={buttonColor} label="Afficher saviez-vous ?" onClick={onToggle || handleToggle} />
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
            <SwipeBackgroundCard
        title="saviez-vous ?"
              icon={<Lightbulb className="h-4 w-4 text-blue-950" />}
              iconBgColor="bg-blue-400"
              iconDarkColor="dark:bg-blue-600"
              titleColor="text-blue-800"
              titleDarkColor="dark:text-blue-300"
              borderColor="border-blue-300"
              borderDarkColor="dark:border-blue-700"
              bgGradient="bg-gradient-to-br from-blue-50 to-cyan-50"
              bgGradientDark="dark:from-blue-950/30 dark:to-cyan-950/30"
              textColor="text-blue-900"
              textDarkColor="dark:text-blue-100"
            >
              <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                {decodeHtmlEntities(nextFact.text)}
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
          src={cachedImageUrl || ''}
          alt="Illustration"
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  )
})
