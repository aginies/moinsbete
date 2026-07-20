'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Camera, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { BaseImageCard } from './base-image-card'
import { useCardVisibility } from '@/hooks/use-card-visibility'

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

interface ImageWikiLovesCardProps {
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
}: ImageWikiLovesCardProps) {
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS)
  const [modalOpen, setModalOpen] = useState(false)

  const { show: showCategoriesState, handleToggle: toggleCategories } = useCardVisibility({
    storageKey: 'image_wikiloves_show_categories',
    defaultShow: true,
    userId,
  })

  const handleTopicToggle = useCallback(async (topicId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, active: !t.active } : t))
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
  }, [userId])

  const cardClassName = fullImage
    ? 'rounded-xl border-2 border-indigo-800 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:border-indigo-900 dark:from-indigo-950/30 dark:to-emerald-950/30'
    : 'rounded-xl border-2 border-indigo-800 bg-gradient-to-br from-indigo-50 to-emerald-50 p-5 dark:border-indigo-900 dark:from-indigo-950/30 dark:to-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow'

  return (
    <>
      <BaseImageCard
        config={{
          resourceType: 'IMAGE_WIKILOVES',
          fetchFn: fetchRandomImage,
          defaultTopics: DEFAULT_TOPICS,
          cardClassName,
          icon: <Camera className="h-4 w-4 text-indigo-950" />,
          iconBgColor: 'bg-indigo-400',
          iconDarkColor: 'dark:bg-indigo-500',
          title: 'Wiki Loves',
          titleColor: 'text-indigo-800',
          titleDarkColor: 'dark:text-indigo-300',
          linkHref: showLink ? '/image-wikiloves' : undefined,
          enableAutoRefresh,
          storageKey,
          visibilityStorageKey: 'image_wikiloves_card_visible',
          categoriesVisibilityStorageKey: 'image_wikiloves_show_categories',
          loadingProps: {
            borderColor: 'border-indigo-200',
            borderDarkColor: 'dark:border-indigo-800',
            iconColor: 'text-indigo-400',
            iconDarkColor: 'dark:text-indigo-400',
          },
          imageBorderClass: 'border-indigo-200 dark:border-indigo-800',
          hintColor: 'cyan',
          buttonColor: 'purple',
          shareTitlePrefix: 'Wiki Loves',
          visibilityLabel: 'Afficher Wiki Loves',
          shareTextAuthor: 'Wiki Loves',
          shareTextRights: '',
          settingsButtonTitle: 'Gérer les événements',
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
        renderTopics={() =>
          topics.filter((t): t is Topic & { enabled: boolean } => t.enabled).map((topic: Topic) => (
            <button
              key={topic.id}
              onClick={(e) => { e.stopPropagation(); handleTopicToggle(topic.id) }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                topic.active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-neutral-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
              }`}
            >
              {topic.icon} {topic.label}
            </button>
          ))
        }
        renderImage={(img) => (
          <img
            src={img.imageUrl}
            alt={img.titre}
            loading="lazy"
            className={`w-full transition-opacity ${largeImage ? 'h-[28vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-48 object-cover pointer-events-none hover:opacity-90'}`}
            onLoad={() => {}}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        renderMetadata={(img) => (
          <>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
              {img.titre}
            </p>
            {img.auteur && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
                {img.auteur}
              </p>
            )}
            {img.description && (
              <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100 mb-2">
                {img.description}
              </p>
            )}
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
              {img.droits || 'Wikimedia Commons'}
            </p>
            {showLink && (
              <Link
                href={img.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
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
        <h2 className="text-lg font-bold mb-4 pr-8">🌿 Gérer les événements Wiki Loves</h2>
        <div className="space-y-2">
          {localTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                topic.active
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
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
