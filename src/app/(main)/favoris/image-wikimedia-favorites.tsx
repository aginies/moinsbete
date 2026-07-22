'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getWikimediaFavoritesAction } from '@/actions/image-wikimedia-bookmark-actions'
import { type WikimediaImageFavoriteDoc } from '@/lib/image-wikimedia-bookmark'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { ShareButton } from '@/components/feed/share-button'
import { useState, useCallback } from 'react'
import { useItemShare } from '@/components/feed/use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'

const WIKIMEDIA_FAVORITES_KEY = 'image_wikimedia_favorites'

interface ImageWikimediaFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (item: WikimediaImageFavoriteDoc) => void
  isSharing?: string | null
  searchQuery?: string
}

interface WikimediaFavoriteItemProps {
  item: WikimediaImageFavoriteDoc
  onRemove: () => void
  onShowFullImage: (url: string) => void
  isShared: boolean
  onShareToggle: () => void
  isSharing: boolean
}

function WikimediaFavoriteItem({ item, onRemove, onShowFullImage, isShared, onShareToggle, isSharing }: WikimediaFavoriteItemProps) {
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
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800"
            onClick={() => onShowFullImage(item.imageUrl)}
          >
            <img
              src={sanitizeUrl(item.imageUrl, '')}
              alt={item.titre}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <ImageHint color="rose" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
          {item.titre}
        </h3>
        {item.auteur && (
          <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
            {item.auteur}
          </p>
        )}
        {isValidUrl(item.link) && (
          <Link
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <ShareToLobbyButton resourceId={item.docid} resourceType="IMAGE_WIKIMEDIA" />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-rose-600 opacity-60 hover:opacity-100 hover:text-rose-800 hover:bg-rose-100 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-900/40 transition-all"
          title="Retirer des favoris"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface ImageWikimediaFavoritesInnerProps extends ImageWikimediaFavoritesProps {
  sharedIds: Set<string>
  onShareToggle: (item: WikimediaImageFavoriteDoc) => void
  isSharing: string | null
}

export function ImageWikimediaFavorites({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: ImageWikimediaFavoritesInnerProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)

  const { handleRemove, getFavorites } = useFavoritesList<WikimediaImageFavoriteDoc>({
    userId,
    storageKey: WIKIMEDIA_FAVORITES_KEY,
    resourceIdGetter: (item) => item.docid,
    bookmarkType: 'IMAGE_WIKIMEDIA',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getWikimediaFavoritesAction()
      return result.favorites as WikimediaImageFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        searchQuery={searchQuery}
        searchFields={(item) => `${item.titre} ${item.auteur}`}
        renderItem={(item, onRemove) => (
          <WikimediaFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} isShared={sharedIds.has(item.docid)} onShareToggle={() => onShareToggle && onShareToggle(item)} isSharing={isSharing === item.docid} />
        )}
        emptyTitle="Aucun favori Wikimedia"
        emptyDescription="Favorisez des images depuis la page d&apos;accueil pour les voir ici."
        storageKey={WIKIMEDIA_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-rose-200"
        bgGradient="bg-gradient-to-br from-rose-50 to-red-50"
        darkBorderColor="dark:border-rose-800"
        darkBgGradient="dark:from-rose-950/20 dark:to-red-950/20"
        textColor="text-rose-900"
        darkTextColor="dark:text-rose-100"
        buttonColor="text-rose-600"
        buttonHoverBg="hover:bg-rose-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Wikimedia Commons"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
