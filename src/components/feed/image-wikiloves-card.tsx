'use client'

import { useState, useCallback, useEffect } from 'react'
import { BookOpen, ExternalLink, Bookmark, Filter, EyeOff, RefreshCw, Settings } from 'lucide-react'
import Link from 'next/link'
import { useItemShare } from './use-item-share'
import { CardHeader } from './card-header'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { VisibilityButton } from './visibility-button'
import { ImageLoading } from './image-loading'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'

interface WikiLovesImage {
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

interface Topic {
  id: string
  label: string
  icon: string
  enabled: boolean
  active: boolean
  default: boolean
}

const DEFAULT_TOPICS: Topic[] = [
  { id: 'wle', label: 'Wiki Loves Earth', icon: '🌿', enabled: true, active: true, default: true },
  { id: 'wlm', label: 'Wiki Loves Monuments', icon: '🏛️', enabled: true, active: true, default: true },
]

async function fetchRandomImage(event?: string): Promise<WikiLovesImage | null> {
  try {
    const url = event ? `/api/image-wikiloves?event=${encodeURIComponent(event)}` : '/api/image-wikiloves'
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error || !data?.imageUrl) return null
    return data
  } catch {
    return null
  }
}

export function ImageWikiLovesCard({
  userId,
  swipeable = false,
  fullImage = false,
  largeImage = false,
  showLink = true,
  showToggle = true,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'wikiloves',
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
  const [image, setImage] = useState<WikiLovesImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [allTopics, setAllTopics] = useState<Topic[]>(DEFAULT_TOPICS)
  const [modalOpen, setModalOpen] = useState(false)

  const { show: showCategories, handleToggle: toggleCategories } = useCardVisibility({
    storageKey: 'image_wikiloves_show_categories',
    defaultShow: true,
    userId,
  })

  const handleToggleCategories = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCategories()
  }, [toggleCategories])

  const { hasMounted, handleToggle, buttonColor } = useCardVisibility({
    storageKey: 'image_wikiloves_card_visible',
    defaultShow: true,
    userId,
  })
  const show = isVisible !== undefined ? isVisible : true

  const loadImage = useCallback(async () => {
    setLoading(true)
    setError(false)
    setIsImageLoaded(false)
    const activeTopicIds = allTopics.filter(t => t.active).map(t => t.id)
    const newImage = await fetchRandomImage(activeTopicIds.join(','))
    if (newImage) {
      setImage(newImage)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [allTopics])

  useEffect(() => {
    if (hasMounted && show && !image && !loading && !error) {
      const timer = setTimeout(() => loadImage(), 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, image, loading, error, loadImage])

  useEffect(() => {
    if (userId && image) {
      isBookmarkedAction('IMAGE_WIKILOVES', image.docid).then(result => setIsFavorite(result.isBookmarked)).catch(() => {})
    }
  }, [userId, image])

  const handleBookmark = useCallback(async () => {
    if (!image) return
    const newFavorite = !isFavorite
    try {
      await toggleBookmarkAction('IMAGE_WIKILOVES', image.docid, newFavorite ? 'add' : 'remove', {
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

  const handleTopicToggle = useCallback(async (topicId: string) => {
    setAllTopics(prev => prev.map(t => t.id === topicId ? { ...t, active: !t.active } : t))
    if (userId) {
      try {
        await fetch('/api/image-wikiloves-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_active', topicId }),
        })
      } catch (error) {
        console.error('Failed to toggle topic active status:', error)
      }
    }
    setImage(null)
  }, [userId])

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: image?.link ?? '',
    title: `Wiki Loves - ${image?.titre ?? ''}`,
    text: `${image?.titre ?? ''}\n${image?.auteur ?? 'Wiki Loves'}\n\n${image?.droits ?? ''}`,
  })

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

  if (!hasMounted) return null

  const shareOptions = image ? { onClick: handleShare, copied, shareUrl } : undefined

  const cardContent = (
    <div
      onClick={loadImage}
      className="rounded-xl border-2 border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 p-5 dark:border-green-900 dark:from-green-950/30 dark:to-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader
        icon={<BookOpen className="h-4 w-4 text-white" />}
        iconBgColor="bg-green-700"
        iconDarkColor="dark:bg-green-800"
        title="Wiki Loves"
        titleColor="text-green-800"
        titleDarkColor="dark:text-green-300"
        linkHref={showLink ? '/image-wikiloves' : undefined}
        showToggle={false}
        showRefresh={false}
        onRefresh={loadImage}
        loading={loading || (image?.imageUrl ? !isImageLoaded : false)}
        shareOptions={shareOptions ? { onClick: handleShare, copied, shareUrl } : undefined}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
              className="text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
              title="Gérer les événements"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleCategories}
              className="text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
              title={showCategories ? 'Masquer les événements' : 'Afficher les événements'}
            >
              <Filter className={`h-4 w-4 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            {showToggle && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (onToggle || handleToggle)() }}
                className="text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
                title="Masquer la carte"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadImage() }}
              className="text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {image && userId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                className="text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
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
          {allTopics.filter(t => t.enabled).map(topic => (
            <button
              key={topic.id}
              onClick={(e) => { e.stopPropagation(); handleTopicToggle(topic.id) }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                topic.active
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-neutral-800 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:border-green-400'
              }`}
            >
              {topic.icon} {topic.label}
            </button>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-100/50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-xs text-green-700 dark:text-green-300">
            Impossible de charger l&apos;image. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {loading && image?.imageUrl && <ImageLoading />}

      {image?.imageUrl && !loading && (
        <div
          className={`mb-3 overflow-hidden rounded-lg border border-green-200 dark:border-green-800 ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}
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
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {!fullImage && <ImageHint color="amber" />}
        </div>
      )}

      {image && (
        <>
          <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
            {image.titre}
          </p>
          {image.auteur && (
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">
              {image.auteur}
            </p>
          )}
          {image.description && (
            <p className="text-sm leading-relaxed text-green-900 dark:text-green-100 mb-2">
              {image.description}
            </p>
          )}
          <p className="text-xs text-green-600 dark:text-green-400 mb-2">
            {image.droits || 'Wikimedia Commons'}
          </p>
          {showLink && (
            <Link
              href={image.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:underline"
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
        <VisibilityButton color={buttonColor} label="Afficher Wiki Loves" onClick={onToggle || handleToggle} />
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

      <WikiLovesTopicsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        topics={allTopics}
        onToggleActive={handleTopicToggle}
      />
    </>
  )
}

function WikiLovesTopicsModal({
  open,
  onOpenChange,
  topics,
  onToggleActive,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  topics: Topic[]
  onToggleActive: (topicId: string) => void | Promise<void>
}) {
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics)

  useEffect(() => { setLocalTopics(topics) }, [topics, open])

  const toggle = async (topicId: string) => {
    setLocalTopics(prev => prev.map(t => t.id === topicId ? { ...t, active: !t.active } : t))
    await onToggleActive(topicId)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-[90vw] sm:w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">🌿 Gérer les événements Wiki Loves</h2>
        <div className="space-y-2">
          {localTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                topic.active
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                  : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <span className="text-xl">{topic.icon}</span>
              <span className="text-sm font-medium">{topic.label}</span>
              <span className="ml-auto text-xs">{topic.active ? 'Actif' : 'Inactif'}</span>
            </button>
          ))}
        </div>
        <button
          className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
