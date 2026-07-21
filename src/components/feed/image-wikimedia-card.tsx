'use client'

import { useState, useCallback, useEffect } from 'react'
import { Camera, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { BaseImageCard } from './base-image-card'
import { sanitizeUrl } from '@/lib/utils'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useRef } from 'react'

interface WikimediaImage {
  docid: string
  reference?: string
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
  { id: 'design', label: 'Design', icon: '📐', searchTerms: ['Industrial design', 'Graphic design', 'Product design', 'objets design', 'architecture design'], enabled: true, active: false, default: true },
  { id: 'deep-space', label: 'Espace', icon: '🌌', searchTerms: ['Deep space', 'Nebula', 'Hubble space telescope', 'Andromeda galaxy', 'Supernova'], enabled: true, active: false, default: true },
]

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
  isVisible?: boolean
}

async function fetchTopics(): Promise<Topic[]> {
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
  isVisible,
}: ImageWikimediaCardProps) {
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS)
  const [modalOpen, setModalOpen] = useState(false)

  const { show: showCategoriesState, handleToggle: toggleCategories } = useCardVisibility({
    storageKey: 'image_wikimedia_show_categories',
    defaultShow: true,
    userId,
  })

  useEffect(() => {
    if (userId) {
      fetchTopics().then(loadedTopics => {
        setTopics(loadedTopics)
      })
    }
  }, [userId])

  const refreshTopics = useCallback(async () => {
    if (userId) {
      const topics = await fetchTopics()
      setTopics(topics)
    }
  }, [userId])

  const handleTopicToggle = useCallback(async (topicId: string) => {
    setTopics(prev =>
      prev.map(t =>
        t.id === topicId
          ? { ...t, active: !t.active }
          : t
      )
    )

    if (userId) {
      try {
        await fetch('/api/wikimedia-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_active', topicId }),
        })
      } catch (error) {
        console.error('Failed to toggle topic active status:', error)
      }
      await refreshTopics()
    }
  }, [userId, refreshTopics])

  const cardClassName = fullImage
    ? 'rounded-xl border-2 border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 p-5 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30'
    : 'rounded-xl border-2 border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 p-5 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30 cursor-pointer hover:shadow-md transition-shadow'

  return (
    <>
      <BaseImageCard
        config={{
          resourceType: 'IMAGE_WIKIMEDIA',
          fetchFn: fetchRandomImage,
          defaultTopics: DEFAULT_TOPICS,
          cardClassName,
          icon: <Camera className="h-4 w-4 text-rose-950" />,
          iconBgColor: 'bg-rose-400',
          iconDarkColor: 'dark:bg-rose-500',
          title: 'Wikimedia',
          titleColor: 'text-rose-800',
          titleDarkColor: 'dark:text-rose-300',
          linkHref: showLink ? '/image-wikimedia' : undefined,
          enableAutoRefresh,
          storageKey,
          visibilityStorageKey: 'image_wikimedia_card_visible',
          categoriesVisibilityStorageKey: 'image_wikimedia_show_categories',
          loadingProps: {
            borderColor: 'border-rose-200',
            borderDarkColor: 'dark:border-rose-800',
            iconColor: 'text-rose-400',
            iconDarkColor: 'dark:text-rose-400',
          },
          imageBorderClass: 'border-rose-200 dark:border-rose-800',
          hintColor: 'rose',
          buttonColor: 'rose',
          shareTitlePrefix: 'Wikimedia',
          visibilityLabel: 'Afficher Wikimedia',
          shareTextAuthor: 'Wikimedia',
          shareTextRights: '',
          settingsButtonTitle: 'Gérer les catégories',
          onSettingsClick: () => setModalOpen(true),
        }}
        topics={topics}
        showCategories={showCategoriesState}
        modalOpen={modalOpen}
        onToggleTopic={handleTopicToggle}
        onImageLoaded={() => {}}
        onToggleCategories={toggleCategories}
        swipeable={swipeable}
        fullImage={fullImage}
        largeImage={largeImage}
        showLink={showLink}
        showToggle={showToggle}
        onToggle={onToggle}
        isVisible={isVisible}
        renderTopics={() => {
          const enabledTopics = topics.filter((t): t is Topic & { active: boolean } => t.active)

          return (
            <div className="flex flex-wrap gap-1.5 w-full">
              {enabledTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => { e.stopPropagation(); handleTopicToggle(topic.id) }}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    topic.active
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white dark:bg-neutral-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                  }`}
                >
                  {topic.icon} {topic.label}
                </button>
              ))}
            </div>
          )
        }}
        renderImage={(img) => (
          <img
            src={img.imageUrl}
            alt={img.titre}
            loading="lazy"
            className={`w-full transition-opacity ${largeImage ? 'h-[40vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-56 object-cover pointer-events-none hover:opacity-90'}`}
            onLoad={() => {}}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        renderMetadata={(img) => (
          <>
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
              {img.titre}
            </p>
            {img.auteur && (
              <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
                {img.auteur}
              </p>
            )}
            {img.description && (
              <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-100 mb-2">
                {img.description}
              </p>
            )}
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">
              {img.droits || 'Wikimedia Commons'}
            </p>
            {showLink && (
              <Link
                href={sanitizeUrl(img.link)}
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
      />

      <WikiLovesTopicsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        topics={topics}
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
  const prevTopicsRef = useRef(topics)

  useEffect(() => {
    if (prevTopicsRef.current !== topics) {
      setLocalTopics(topics)
      prevTopicsRef.current = topics
    }
  }, [topics, open])

  const toggle = async (topicId: string) => {
    setLocalTopics(prev => prev.map(t => t.id === topicId ? { ...t, active: !t.active } : t))
    await onToggleActive(topicId)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-[90vw] sm:w-[500px] max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold mb-4 pr-8">Gérer les catégories Wikimedia</h2>
        <div className="space-y-2">
          {localTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                topic.active
                  ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700'
                  : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <span className="text-xl">{topic.icon}</span>
              <span className="text-sm font-medium">{topic.label}</span>
              <span className="ml-auto text-xs">{topic.active ? 'Actif' : 'Inactif'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
