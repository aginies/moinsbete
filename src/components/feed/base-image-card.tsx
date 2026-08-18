'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Bookmark, Filter, EyeOff, RefreshCw, Settings } from 'lucide-react'
import { useItemShare } from './use-item-share'
import { CardHeader } from './card-header'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { SwipeBackgroundCard } from './swipe-background-card'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { ImageLoading } from './image-loading'
import { isValidUrl } from '@/lib/utils'
import { toggleWikimediaFavoriteAction, toggleWikiLovesFavoriteAction, toggleApodFavoriteAction, isWikimediaFavoriteAction, isWikiLovesFavoriteAction, isApodFavoriteAction } from '@/actions/bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'
import type { CardColorName, CardShape, CardBorderStyle, CardShadow, CardCompact } from '@/lib/card-theme'
import { getTheme } from '@/lib/card-theme'

interface BaseImage {
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

interface BaseImageCardConfig<TTopic> {
  resourceType: string
  resourceId?: string
  fetchFn: (topicIds: string | undefined, direction?: 'prev' | 'next') => Promise<BaseImage | null>
  defaultTopics: TTopic[]
  icon: React.ReactNode
  title: string
  color: CardColorName
  linkHref?: string
  enableAutoRefresh?: boolean
  enablePrefetch?: boolean
  storageKey?: string
  visibilityStorageKey: string
  categoriesVisibilityStorageKey: string
  loadingProps?: { borderColor: string; borderDarkColor: string; iconColor: string; iconDarkColor: string }
  imageBorderClass: string
  hintColor: 'teal' | 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'orange' | 'cyan'
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald'
  shareTitlePrefix: string
  visibilityLabel: string
  shareTextAuthor: string
  shareTextRights: string
  settingsButtonTitle?: string
  onSettingsClick?: () => void
  showRefresh?: boolean
  shape?: CardShape
  borderStyle?: CardBorderStyle
  shadow?: CardShadow
  compact?: CardCompact
}

interface BaseImageCardProps<TTopic> {
  config: BaseImageCardConfig<TTopic>
  topics: TTopic[]
  showCategories: boolean
  modalOpen: boolean
  onToggleTopic: (topicId: string) => Promise<void>
  onTopicsChange?: () => Promise<void>
  onImageLoaded: () => void
  onToggleCategories?: () => void
  renderTopics: () => React.ReactNode
  renderImage: (image: BaseImage) => React.ReactNode
  renderMetadata: (image: BaseImage) => React.ReactNode
  swipeable?: boolean
  fullImage?: boolean
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
  isVisible?: boolean
  onShowFullImageChange?: (show: boolean) => void
}

export function BaseImageCard<TTopic>({
  config,
  topics,
  showCategories,
  onToggleTopic,
  onTopicsChange,
  onToggleCategories,
  renderTopics,
  renderImage,
  renderMetadata,
  swipeable = false,
  fullImage = false,
  showToggle = true,
  onToggle,
  isVisible,
  onShowFullImageChange,
  onImageLoaded,
}: BaseImageCardProps<TTopic>) {
  const {
    resourceType,
    fetchFn,
    icon,
    title,
    color,
    linkHref,
    enableAutoRefresh = false,
    enablePrefetch = true,
    storageKey,
    visibilityStorageKey,
    loadingProps,
    imageBorderClass,
    hintColor,
    shareTitlePrefix,
    visibilityLabel,
    shareTextAuthor,
    shareTextRights,
    settingsButtonTitle,
    onSettingsClick,
    showRefresh = true,
    shape,
    borderStyle,
    shadow,
    compact,
  } = config

  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme(color)
  const imageStorageKey = storageKey ? `base_image_${storageKey}` : 'base_image'

  const [image, setImage] = useState<BaseImage | null>(() => {
    if (typeof sessionStorage === 'undefined') return null
    const saved = sessionStorage.getItem(imageStorageKey)
    return saved ? JSON.parse(saved) : null
  })
  const [nextImage, setNextImage] = useState<BaseImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const checkedImageIdsRef = useRef<Set<string>>(new Set())

  const prefetchNextImage = useCallback(async (direction?: 'prev' | 'next') => {
    if (enablePrefetch === false) return
    const activeTopicIds = topics.filter((t: any) => t.active).map((t: any) => t.id)
    const data = await fetchFn(activeTopicIds.length > 0 ? activeTopicIds.join(',') : undefined, direction)
    if (data) {
      setNextImage(data)
    }
  }, [fetchFn, topics, enablePrefetch])

  const loadImage = useCallback(async (direction?: 'prev' | 'next') => {
    if (nextImage && direction) {
      setImage(nextImage)
      setNextImage(null)
      setError(false)
      setIsImageLoaded(true)
      onImageLoaded()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(imageStorageKey, JSON.stringify(nextImage))
      }
      return
    }
    setNextImage(null)
    setLoading(true)
    setError(false)
    setIsImageLoaded(false)
    const activeTopicIds = topics.filter((t: any) => t.active).map((t: any) => t.id)
    const newImage = await fetchFn(activeTopicIds.length > 0 ? activeTopicIds.join(',') : undefined, direction)
    if (newImage) {
      setImage(newImage)
      setIsImageLoaded(true)
      onImageLoaded()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(imageStorageKey, JSON.stringify(newImage))
      }
      setError(false)
    } else {
      setError(true)
      sessionStorage.removeItem(imageStorageKey)
    }
    setLoading(false)
  }, [fetchFn, topics, imageStorageKey, nextImage])

  useEffect(() => {
    setNextImage(null)
  }, [topics])

  useAutoRefresh(storageKey || 'base', loadImage)

  useEffect(() => {
    if (isVisible === false) return
    if (!image && !loading && !error) {
      const timer = setTimeout(() => loadImage(), 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, image, loading, error, loadImage])

  useEffect(() => {
    if (image && !checkedImageIdsRef.current.has(image.docid)) {
      checkedImageIdsRef.current.add(image.docid)
      const checkFn = resourceType === 'IMAGE_WIKIMEDIA' ? isWikimediaFavoriteAction : resourceType === 'APOD' ? isApodFavoriteAction : isWikiLovesFavoriteAction
      checkFn(image.docid).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [resourceType, image])

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: image?.docid,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      const toggleFn = resourceType === 'IMAGE_WIKIMEDIA' ? toggleWikimediaFavoriteAction : resourceType === 'APOD' ? toggleApodFavoriteAction : toggleWikiLovesFavoriteAction
      await toggleFn(image!.docid, action, {
        titre: image!.titre,
        auteur: image!.auteur,
        imageUrl: image!.imageUrl,
        link: image!.link,
        droits: image!.droits,
        description: image!.description,
      })
    },
  })

  const shareUrl = image?.link ?? ''
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: `${shareTitlePrefix} - ${image?.titre ?? ''}`,
    text: `${image?.titre ?? ''}\n${image?.auteur ?? shareTextAuthor}\n\n${image?.droits ?? shareTextRights}`,
    itemId: image?.docid,
  })

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
    onSwipeLeft: () => loadImage('next'),
    onSwipeRight: () => loadImage('prev'),
    onDragStart: () => prefetchNextImage(),
    onRefresh: () => loadImage(),
    swipeable,
    resetDep: image?.imageUrl,
  })

  const handleShowFullImageChange = useCallback((show: boolean) => {
    setShowFullImage(show)
    onShowFullImageChange?.(show)
  }, [onShowFullImageChange])

  const absX = Math.abs(dragX)
  const bgOpacity = isDragging && absX > 0 ? Math.min(0.2 + (absX / 200) * 0.8, 1) : 0

  if (!image && !loading) {
    return null
  }

  const shareOptions = image ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined

  const handleToggleVisibility = showToggle ? onToggle : undefined

  const cardContent = (
   <CardShell color={color} shape={shape} borderStyle={borderStyle} shadow={shadow} compact={compact}>
      <CardHeader
         color={color}
         icon={icon}
         title={title}
         linkHref={linkHref}
         showToggle={false}
         showRefresh={false}
         onRefresh={loadImage}
         loading={loading}
         shareOptions={shareOptions}
         enableAutoRefresh={enableAutoRefresh}
         storageKey={storageKey}
         compact={compact !== 'default'}
        extraActions={
          <div className="flex items-center gap-2 sm:gap-3">
            {handleToggleVisibility && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleVisibility() }}
                className={`${c.title} rounded-full p-1.5 hover:bg-current/10 transition-all`}
                title={t('hide_card')}
                aria-label={t('hide_card')}
              >
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            {showRefresh && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); loadImage() }}
                className={`${c.title} rounded-full p-1.5 hover:bg-current/10 transition-all`}
                title={t('refresh_content')}
                aria-label={t('refresh_content')}
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {image && (
                 isLoggedIn && (
                 <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                    disabled={isPending}
                    className={`${c.title} rounded-full p-1.5 hover:bg-current/10 transition-all disabled:opacity-50`}
                    title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                    aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
                 >
                   <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? 'fill-current' : ''}`} />
                 </button>
                 )
               )}
              {image && config.resourceType && (
                <ShareToLobbyButton resourceId={image.docid} resourceType={config.resourceType} meta={{ titre: image.titre, auteur: image.auteur, imageUrl: image.imageUrl, link: image.link, droits: image.droits }} />
              )}
           </div>
        }
      />

      {showCategories && (
        <div className="mb-3 flex gap-1.5 flex-wrap">
          {renderTopics()}
        </div>
      )}

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-100/50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Impossible de charger l&apos;image. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {loading && image?.imageUrl && (
        <ImageLoading {...loadingProps} />
      )}

      {image?.imageUrl && !loading && (
        <div
          className={`mb-3 overflow-hidden rounded-lg border ${imageBorderClass} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation()
            handleShowFullImageChange(true)
          }}
        >
          {renderImage(image)}
          <ImageHint color={hintColor} />
        </div>
      )}

      {image && renderMetadata(image)}

      {image && (onSettingsClick || onToggleCategories) && (
        <div className="flex items-center justify-end gap-2 mt-3">
          {onSettingsClick && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSettingsClick() }}
              className={`${c.title} rounded-full p-1.5 hover:bg-current/10 transition-all`}
              title={settingsButtonTitle}
              aria-label={settingsButtonTitle}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          {onToggleCategories && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCategories() }}
              className={`${c.title} rounded-full p-1.5 hover:bg-current/10 transition-all`}
              title={showCategories ? t('hide_categories') : t('show_categories')}
              aria-label={showCategories ? t('hide_categories') : t('show_categories')}
            >
              <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${showCategories ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      )}
    </CardShell>
  )

  const renderCard = () => {
    if (swipeable) {
      return (
        <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()} suppressHydrationWarning>
          {prevHintOpacity > 0 && (
            <div
              className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
              style={{ opacity: prevHintOpacity }}
            >
              ← Précédent
            </div>
          )}

          {nextHintOpacity > 0 && (
            <div
              className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
              style={{ opacity: nextHintOpacity }}
            >
              Suivant →
            </div>
          )}

          {nextImage && bgOpacity > 0 && (
            <SwipeBackgroundCard
              title={title}
              icon={icon}
              color={color}
            >
              {nextImage.imageUrl && (
                <div className={`mb-3 overflow-hidden rounded-lg border ${imageBorderClass} h-48`}>
                  {renderImage(nextImage)}
                </div>
              )}
              {renderMetadata(nextImage)}
            </SwipeBackgroundCard>
          )}

          <div
            className={`w-full relative z-10 ${isDragging || prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'}`}
            style={swipeStyle}
          >
            {cardContent}
          </div>
        </div>
      )
    }
    return cardContent
  }

  return (
    <>
      <CardVisibilityGuard
        isVisible={isVisible}
        onToggle={onToggle}
        showToggle={showToggle}
        buttonColor={config.buttonColor}
        label={config.visibilityLabel}
      >
        {renderCard()}
      </CardVisibilityGuard>

      {showFullImage && image && (
        <ImageLightbox
          src={image.imageUrl}
          alt={image.titre}
          onClose={() => handleShowFullImageChange(false)}
        />
      )}
    </>
  )
}
