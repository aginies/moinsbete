'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getImageDuJourFavoritesAction } from '@/actions/image-du-jour-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { ShareButton } from './share-button'
import { useItemShare } from './use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'

import { ImageDuJourFavoriteDoc } from '@/lib/image-du-jour-bookmark'

const IMAGE_DU_JOUR_FAVORITES_KEY = 'image_du_jour_favorites'

interface ImageDuJourBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (item: ImageDuJourFavoriteDoc) => void
  isSharing?: string | null
  searchQuery?: string
}

function ImageDuJourFavoriteItem({ item, onRemove, onShowFullImage, isShared, onShareToggle, isSharing }: { item: ImageDuJourFavoriteDoc; onRemove: () => void; onShowFullImage: (url: string) => void; isShared: boolean; onShareToggle: () => void; isSharing: boolean }) {
  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: item.fileUrl,
    title: `Image du jour - ${item.description}`,
    text: item.description,
    itemId: item.id,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {isValidUrl(item.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800"
            onClick={() => onShowFullImage(item.imageUrl)}
          >
            <img
              decoding="async"
              src={sanitizeUrl(item.imageUrl, '')}
              alt={item.description}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="teal" />
          </div>
        )}
        <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100 mb-2">
          {item.description}
        </p>
        {isValidUrl(item.fileUrl) && (
          <Link
            href={sanitizeUrl(item.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <ShareToLobbyButton resourceId={item.fileUrl} resourceType="IMAGE_DU_JOUR" meta={{ imageUrl: item.imageUrl, description: item.description, fileUrl: item.fileUrl, date: item.date }} />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-teal-600 opacity-60 hover:opacity-100 hover:text-teal-800 hover:bg-teal-100 dark:text-teal-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 transition-all"
          title="Retirer des favoris"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface ImageDuJourBookmarksInnerProps extends ImageDuJourBookmarksProps {
  sharedIds: Set<string>
  isSharing: string | null
}

export function ImageDuJourBookmarks({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: ImageDuJourBookmarksInnerProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const { handleRemove, getFavorites } = useFavoritesList<ImageDuJourFavoriteDoc>({
    userId,
    storageKey: IMAGE_DU_JOUR_FAVORITES_KEY,
    resourceIdGetter: (item) => item.fileUrl,
    bookmarkType: 'IMAGE_DU_JOUR',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getImageDuJourFavoritesAction()
      return result.favorites as ImageDuJourFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        searchQuery={searchQuery}
        searchFields={(item) => item.description}
        renderItem={(item, onRemove) => (
          <ImageDuJourFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} isShared={sharedIds.has(item.fileUrl)} onShareToggle={() => onShareToggle && onShareToggle(item)} isSharing={isSharing === item.fileUrl} />
        )}
        emptyTitle="Aucune image favoris"
        emptyDescription="Cliquez sur le bookmark d&apos;une image du jour pour la sauvegarder ici."
        storageKey={IMAGE_DU_JOUR_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-teal-200"
        bgGradient="bg-gradient-to-br from-teal-50 to-emerald-50"
        darkBorderColor="dark:border-teal-800"
        darkBgGradient="dark:from-teal-950/20 dark:to-emerald-950/20"
        textColor="text-teal-900"
        darkTextColor="dark:text-teal-100"
        buttonColor="text-teal-600"
        buttonHoverBg="hover:bg-teal-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Image du jour"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
