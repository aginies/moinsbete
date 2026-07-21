'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Bookmark, Filter, EyeOff, RefreshCw, Settings } from 'lucide-react'
import { useItemShare } from './use-item-share'
import { CardHeader } from './card-header'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { VisibilityButton } from './visibility-button'
import { ImageLoading } from './image-loading'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import type { BookmarkType } from '@/generated/client'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'

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
  fetchFn: (topicIds: string | undefined) => Promise<BaseImage | null>
  defaultTopics: TTopic[]
  cardClassName: string
  icon: React.ReactNode
  iconBgColor: string
  iconDarkColor: string
  title: string
  titleColor: string
  titleDarkColor: string
  linkHref?: string
  enableAutoRefresh?: boolean
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
  settingsButtonTitle: string
  onSettingsClick: () => void
}

interface BaseImageCardProps<TTopic> {
  config: BaseImageCardConfig<TTopic>
  topics: TTopic[]
  showCategories: boolean
  modalOpen: boolean
  onToggleTopic: (topicId: string) => Promise<void>
  onTopicsChange?: () => Promise<void>
  onImageLoaded: () => void
  onToggleCategories: () => void
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
}: BaseImageCardProps<TTopic>) {
  const {
    resourceType,
    fetchFn,
    cardClassName,
    icon,
    iconBgColor,
    iconDarkColor,
    title,
    titleColor,
    titleDarkColor,
    linkHref,
    enableAutoRefresh = false,
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
  } = config

  const [image, setImage] = useState<BaseImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const { show: showFromHook, hasMounted, handleToggle: handleVisibilityToggle, buttonColor: visibilityButtonColor } = useCardVisibility({
    storageKey: visibilityStorageKey,
    defaultShow: true,
  })

  const show = isVisible !== undefined ? isVisible : showFromHook

  const loadImage = useCallback(async () => {
    setLoading(true)
    setError(false)
    setIsImageLoaded(false)
    const activeTopicIds = topics.filter((t: any) => t.active).map((t: any) => t.id)
    const newImage = await fetchFn(activeTopicIds.length > 0 ? activeTopicIds.join(',') : undefined)
    if (newImage) {
      setImage(newImage)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [fetchFn, topics])

  useEffect(() => {
    if (hasMounted && show && !image && !loading && !error) {
      const timer = setTimeout(() => loadImage(), 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, image, loading, error, loadImage])

  useEffect(() => {
    if (image) {
      isBookmarkedAction(resourceType as BookmarkType, image.docid).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [resourceType, image])

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: image?.docid,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      await toggleBookmarkAction(resourceType as BookmarkType, image!.docid, action, {
        titre: image!.titre,
        auteur: image!.auteur,
        imageUrl: image!.imageUrl,
        link: image!.link,
        droits: image!.droits,
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

  const handleShowFullImageChange = useCallback((show: boolean) => {
    setShowFullImage(show)
    onShowFullImageChange?.(show)
  }, [onShowFullImageChange])

  if (!hasMounted) return null

  const shareOptions = image ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined

  const handleToggleVisibility = showToggle ? (onToggle || handleVisibilityToggle) : undefined

  const cardContent = (
    <div
      className={`${cardClassName}`}
    >
      <CardHeader
        icon={icon}
        iconBgColor={iconBgColor}
        iconDarkColor={iconDarkColor}
        title={title}
        titleColor={titleColor}
        titleDarkColor={titleDarkColor}
        linkHref={linkHref}
        showToggle={false}
        showRefresh={false}
        onRefresh={loadImage}
        loading={loading || (image?.imageUrl ? !isImageLoaded : false)}
        shareOptions={shareOptions}
        enableAutoRefresh={enableAutoRefresh}
        storageKey={storageKey}
        extraActions={
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSettingsClick() }}
              className={`${titleColor} rounded-full p-1.5 hover:bg-current/10 transition-all`}
              title={settingsButtonTitle}
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCategories() }}
              className={`${titleColor} rounded-full p-1.5 hover:bg-current/10 transition-all`}
              title={showCategories ? 'Masquer les catégories' : 'Afficher les catégories'}
            >
              <Filter className={`h-4 w-4 ${showCategories ? 'fill-current' : ''}`} />
            </button>
            {handleToggleVisibility && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleVisibility() }}
                className={`${titleColor} rounded-full p-1.5 hover:bg-current/10 transition-all`}
                title="Masquer la carte"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); loadImage() }}
                className={`${titleColor} rounded-full p-1.5 hover:bg-current/10 transition-all`}
                title="Rafraîchir"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
             {image && (
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                 disabled={isPending}
                 className={`${titleColor} rounded-full p-1.5 hover:bg-current/10 transition-all disabled:opacity-50`}
                 title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
               >
                 <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
               </button>
             )}
             {image && config.resourceType && (
               <ShareToLobbyButton resourceId={image.docid} resourceType={config.resourceType} meta={{ titre: image.titre, auteur: image.auteur, imageUrl: image.imageUrl, link: image.link, droits: image.droits }} />
             )}
          </>
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
          className={`mb-3 overflow-hidden rounded-lg border ${imageBorderClass} ${fullImage ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={(e) => {
            if (!fullImage) {
              e.stopPropagation()
              handleShowFullImageChange(true)
            }
          }}
        >
          {renderImage(image)}
          {!fullImage && <ImageHint color={hintColor} />}
        </div>
      )}

      {image && renderMetadata(image)}
    </div>
  )

  const renderCard = () => {
    if (swipeable) {
      return (
        <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()}>
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
      {!show ? (
        <VisibilityButton color={visibilityButtonColor} label={visibilityLabel} onClick={onToggle || handleVisibilityToggle} />
      ) : (
        renderCard()
      )}

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
