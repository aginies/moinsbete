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
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { WikimediaTopicsModal } from './wikimedia-topics-modal'

interface WikimediaImage {
  docid: string
  exemplaire: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

interface ImageWikimediaCardProps {
  userId?: string
  swipeable?: boolean
  fullImage?: boolean
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
  enableAutoRefresh?: boolean
  storageKey?: string
}

interface Topic {
  id: string
  label: string
  icon: string
  searchTerms: string[]
  enabled: boolean
  active: boolean
  default: boolean
}

const DEFAULT_TOPICS: Topic[] = [
  { id: 'paintings', label: 'Peintures', icon: '🎨', searchTerms: ['Painting', 'Oil painting', 'Watercolor', 'Dali'], enabled: true, active: false, default: true },
  { id: 'aviation', label: 'Aviation Militaire', icon: '✈️', searchTerms: ['Avion Chasse', 'Armée Air', 'Air force'], enabled: true, active: true, default: true },
  { id: 'nasa', label: 'NASA', icon: '🚀', searchTerms: ['NASA', 'Apollo program'], enabled: true, active: false, default: true },
  { id: 'posters', label: 'Affiches', icon: '📋', searchTerms: ['Poster', 'Movie poster'], enabled: true, active: false, default: true },
  { id: 'ww', label: 'Guerre', icon: '🪖', searchTerms: ['World War II', 'Second World War', '1939-1945', 'World War I', 'First World War', 'Great War', '1914-1918'], enabled: true, active: false, default: true },
  { id: 'art', label: 'Art', icon: '🎭', searchTerms: ['Art', 'Sculpture', 'Illustration', 'Drawing', 'Musé Louvre', 'Musé Ermitage', 'Musée national de Chine', 'Metropolitan Museum of Art', 'Musées du Vatican'], enabled: true, active: false, default: true },
  { id: 'advertisements', label: 'Publicités', icon: '📰', searchTerms: ['Vintage advertisement', 'Vintage ad', 'Retro ad', 'Poster advertisement'], enabled: true, active: false, default: true },
  { id: 'maps', label: 'Cartes', icon: '🗺️', searchTerms: ['Historical map', 'Old map', 'Antique map', 'Cartography'], enabled: true, active: false, default: true },
  { id: 'sports-car', label: 'Voitures de sport', icon: '🏎️', searchTerms: ['Classic sports car', 'Sports car', 'Racing car', 'Rolls-Royce', 'Bentley', 'Ferrari', 'Lamborghini', 'Porsche'], enabled: true, active: false, default: true },
  { id: 'design', label: 'Design', icon: '📐', searchTerms: ['Industrial design', 'Graphic design', 'Product design', 'Modernist design', 'objets design', 'architecture design'], enabled: true, active: false, default: true },
  { id: 'deep-space', label: 'Espace', icon: '🌌', searchTerms: ['Deep space', 'Nebula', 'Hubble space telescope', 'Andromeda galaxy', 'Supernova'], enabled: true, active: false, default: true },
]

async function fetchTopics(userId: string): Promise<Topic[]> {
  try {
    const res = await fetch('/api/wikimedia-topics')
    if (!res.ok) return DEFAULT_TOPICS
    const data = await res.json()
    return data.topics?.length > 0 ? data.topics : DEFAULT_TOPICS
  } catch {
    return DEFAULT_TOPICS
  }
}

async function fetchRandomImage(topic?: string): Promise<WikimediaImage | null> {
  try {
    const url = topic ? `/api/image-wikimedia?topic=${encodeURIComponent(topic)}` : '/api/image-wikimedia'
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    if (!data?.imageUrl) return null
    return data
  } catch {
    return null
  }
}

export function ImageWikimediaCard({
  userId,
  swipeable = false,
  fullImage = false,
  largeImage = false,
  showLink = true,
  showToggle = true,
  onToggle,
  enableAutoRefresh = false,
  storageKey = 'wikimedia',
}: ImageWikimediaCardProps) {
  const [image, setImage] = useState<WikimediaImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTopics, setActiveTopics] = useState<string[]>(['aviation'])
  const [allTopics, setAllTopics] = useState<Topic[]>(DEFAULT_TOPICS)
  const [modalOpen, setModalOpen] = useState(false)

  const { show: showCategories, handleToggle: toggleCategories } = useCardVisibility({
    storageKey: 'image_wikimedia_show_categories',
    defaultShow: true,
    userId,
  })

  // Load active topics preference from DB after mounting
  useEffect(() => {
    if (userId) {
      fetchTopics(userId).then(loadedTopics => {
        setAllTopics(loadedTopics)
        const active = loadedTopics.filter(t => t.active).map(t => t.id)
        setActiveTopics(active.length > 0 ? active : ['aviation'])
      })
    }
  }, [userId])

  const handleToggleCategories = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCategories()
  }, [toggleCategories])

  const { show, hasMounted, handleToggle, buttonColor } = useCardVisibility({
    storageKey: 'image_wikimedia_card_visible',
    defaultShow: true,
    userId,
  })

  const loadImage = useCallback(async () => {
    setLoading(true)
    setError(false)
    setIsImageLoaded(false)
    const activeTopicIds = activeTopics.filter(id => {
      const topic = allTopics.find(t => t.id === id)
      return topic?.enabled
    })
    const newImage = await fetchRandomImage(activeTopicIds.join(','))
    if (newImage) {
      setImage(newImage)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [activeTopics, allTopics])

  useEffect(() => {
    if (hasMounted && show && !image && !loading && !error) {
      const timer = setTimeout(() => {
        loadImage()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, image, loading, error, loadImage])

  useEffect(() => {
    if (userId && image) {
      isBookmarkedAction('BNF_GALICA', image.docid).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [userId, image])

  const handleBookmark = useCallback(async () => {
    if (!image) return
    const newFavorite = !isFavorite

    try {
      await toggleBookmarkAction('BNF_GALICA', image.docid, newFavorite ? 'add' : 'remove', {
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
    const isActive = activeTopics.includes(topicId)
    
    setActiveTopics(prev =>
      isActive
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
    
    if (userId) {
      fetch('/api/wikimedia-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', topicId, active: isActive }),
      }).catch(() => {})
    }
    setImage(null)
  }, [activeTopics, userId])

  const refreshTopics = useCallback(async () => {
    if (userId) {
      const topics = await fetchTopics(userId)
      setAllTopics(topics)
    }
  }, [userId])

  const { share, copied, shareUrl } = useItemShare({
    shareUrl: image?.link ?? '',
    title: `Wikimedia - ${image?.titre ?? ''}`,
    text: `${image?.titre ?? ''}\n${image?.auteur ?? 'Wikimedia'}\n\n${image?.droits ?? ''}`,
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

  const cardContent = (
    <div
      onClick={loadImage}
      className="rounded-xl border-2 border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 p-5 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader
        icon={<BookOpen className="h-4 w-4 text-white" />}
        iconBgColor="bg-rose-700"
        iconDarkColor="dark:bg-rose-800"
        title="Wikimedia"
        titleColor="text-rose-800"
        titleDarkColor="dark:text-rose-300"
        linkHref={showLink ? '/image-wikimedia' : undefined}
        showToggle={false}
        showRefresh={false}
        onRefresh={loadImage}
        loading={loading || (image?.imageUrl ? !isImageLoaded : false)}
        shareOptions={shareOptions ? { onClick: share, copied, shareUrl } : undefined}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
              className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
              title="Gérer les catégories"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleCategories}
              className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
              title={showCategories ? 'Masquer les thèmes' : 'Afficher les thèmes'}
            >
              <Filter className={`h-4 w-4 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            {showToggle && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (onToggle || handleToggle)() }}
                className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
                title="Masquer la carte"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadImage() }}
              className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {image && userId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                className="text-rose-800 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 transition-colors"
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
          {allTopics.filter(t => t.enabled).map(topic => {
            const isActive = activeTopics.includes(topic.id)
            return (
              <button
                key={topic.id}
                onClick={(e) => { e.stopPropagation(); handleTopicToggle(topic.id) }}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-neutral-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                }`}
              >
                {topic.icon} {topic.label}
              </button>
            )
          })}
        </div>
      )}

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-100/50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Impossible de charger l&apos;image. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {image?.imageUrl && (
        <div
          className={`mb-3 overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800 ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}
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
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
            {image.titre}
          </p>
          {image.auteur && (
            <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
              {image.auteur}
            </p>
          )}
          {image.description && (
            <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-100 mb-2">
              {image.description}
            </p>
          )}
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">
            {image.droits || 'Wikimedia Commons'}
          </p>
          {showLink && (
            <Link
              href={image.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
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
        <VisibilityButton color={buttonColor} label="Afficher Wikimedia" onClick={onToggle || handleToggle} />
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

      <WikimediaTopicsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        topics={allTopics}
        activeTopics={activeTopics}
        userId={userId}
        onActiveTopicsChange={setActiveTopics}
        onToggleActive={handleTopicToggle}
        onRefresh={refreshTopics}
      />
    </>
  )
}
