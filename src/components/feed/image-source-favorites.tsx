'use client'

import Link from 'next/link'
import { ExternalLink, Trash2 } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { ShareButton } from '@/components/feed/share-button'
import { useState, useCallback } from 'react'
import { useItemShare } from '@/components/feed/use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { getTheme, type CardColorName, type CardTheme } from '@/lib/card-theme'
import type { ImageHintProps } from '@/components/feed/image-hint'

interface ImageSourceItem {
  id: string
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  link: string
  droits: string
}

interface ImageSourceFavoritesConfig<T extends ImageSourceItem> {
  storageKey: string
  bookmarkType: string
  color: CardColorName
  hintColor: ImageHintProps['color']
  resourceType: string
  emptyTitle: string
  emptyDescription: string
  linkText: string
  lightboxAlt: string
  searchFields: (item: T) => string
  fetchAction: () => Promise<{ favorites: T[] }>
}

function ImageSourceFavoriteItem<T extends ImageSourceItem>({
  item,
  onRemove,
  onShowFullImage,
  isShared,
  onShareToggle,
  isSharing,
  theme,
  hintColor,
  resourceType,
  linkText,
}: {
  item: T
  onRemove: () => void
  onShowFullImage: (url: string) => void
  isShared: boolean
  onShareToggle: () => void
  isSharing: boolean
  theme: CardTheme
  hintColor: ImageHintProps['color']
  resourceType: string
  linkText: string
}) {
  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: item.link,
    title: item.titre,
    text: item.auteur ? `Par ${item.auteur}` : '',
    itemId: item.docid,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {isValidUrl(item.imageUrl) && (
          <div
            className={`mb-2 cursor-pointer overflow-hidden rounded-lg border ${theme.imageBorder} ${theme.imageBorderDark}`}
            onClick={() => onShowFullImage(item.imageUrl)}
          >
            <img
              src={sanitizeUrl(item.imageUrl, '')}
              alt={item.titre}
              loading="lazy"
              className="max-w-full transition-opacity hover:opacity-90 rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <ImageHint color={hintColor} />
          </div>
        )}
        <h3 className={`text-sm font-semibold ${theme.bodyBold} ${theme.bodyBoldDark} mb-1`}>
          {item.titre}
        </h3>
        {item.auteur && (
          <p className={`text-xs ${theme.muted} ${theme.mutedDark} mb-1`}>
            {item.auteur}
          </p>
        )}
        {isValidUrl(item.link) && (
          <Link
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs ${theme.link} ${theme.linkHover} ${theme.linkDark} ${theme.linkHoverDark} hover:underline`}
          >
            {linkText}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <ShareToLobbyButton resourceId={item.docid} resourceType={resourceType} />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-red-500 opacity-60 hover:opacity-100 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40 transition-all"
          title="Retirer des favoris"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ImageSourceFavorites<T extends ImageSourceItem>({
  userId,
  onRemoveComplete,
  sharedIds,
  onShareToggle,
  isSharing,
  searchQuery,
  config,
}: {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds: Set<string>
  onShareToggle: (item: T) => void
  isSharing: string | null
  searchQuery?: string
  config: ImageSourceFavoritesConfig<T>
}) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const theme = getTheme(config.color)

  const { handleRemove, getFavorites } = useFavoritesList<T>({
    userId,
    storageKey: config.storageKey,
    resourceIdGetter: (item) => item.docid,
    bookmarkType: config.bookmarkType as any,
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await config.fetchAction()
      return result.favorites as T[]
    }
    return getFavorites()
  }, [userId, config.fetchAction, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        searchQuery={searchQuery}
        searchFields={config.searchFields}
        renderItem={(item, onRemove) => (
          <ImageSourceFavoriteItem
            item={item}
            onRemove={onRemove}
            onShowFullImage={setShowFullImage}
            isShared={sharedIds.has(item.docid)}
            onShareToggle={() => onShareToggle(item)}
            isSharing={isSharing === item.docid}
            theme={theme}
            hintColor={config.hintColor}
            resourceType={config.resourceType}
            linkText={config.linkText}
          />
        )}
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
        storageKey={config.storageKey}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor={theme.itemBorder}
        bgGradient={theme.shellBgGradient}
        darkBorderColor={theme.itemBorderDark}
        darkBgGradient={theme.shellBgGradientDark}
        textColor={theme.body}
        darkTextColor={theme.bodyDark}
        buttonColor={theme.action}
        buttonHoverBg={theme.hoverBg}
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt={config.lightboxAlt}
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
