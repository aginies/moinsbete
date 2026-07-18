'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getWikiLovesFavoritesAction } from '@/actions/image-wikiloves-bookmark-actions'
import { type WikiLovesImageFavoriteDoc } from '@/lib/image-wikiloves-bookmark'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { ShareButton } from '@/components/feed/share-button'
import { useState, useCallback } from 'react'
import { useItemShare } from '@/components/feed/use-item-share'
import { ShareToLobbyFavoritesButton } from './share-to-lobby-button'

const WIKILOVES_FAVORITES_KEY = 'image_wikiloves_favorites'

interface WikiLovesFavoriteItemProps {
  item: WikiLovesImageFavoriteDoc
  onRemove: () => void
  onShowFullImage: (url: string) => void
  isShared: boolean
  onShareToggle: () => void
  isSharing: boolean
}

function WikiLovesFavoriteItem({ item, onRemove, onShowFullImage, isShared, onShareToggle, isSharing }: WikiLovesFavoriteItemProps) {
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
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-indigo-200 dark:border-indigo-800"
            onClick={() => onShowFullImage(item.imageUrl)}
          >
            <img
              src={sanitizeUrl(item.imageUrl, '')}
              alt={item.titre}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <ImageHint color="cyan" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
          {item.titre}
        </h3>
        {item.auteur && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
            {item.auteur}
          </p>
        )}
        {isValidUrl(item.link) && (
          <Link
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <ShareToLobbyFavoritesButton
          isShared={isShared}
          onToggle={onShareToggle}
          loading={isSharing}
          resourceId={item.docid}
        />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-indigo-600 opacity-60 hover:opacity-100 hover:text-indigo-800 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-200 dark:hover:bg-indigo-900/40 transition-all"
          title="Retirer des favoris"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ImageWikiLovesFavorites({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing }: { userId?: string; onRemoveComplete?: () => void; sharedIds: Set<string>; onShareToggle: (resourceId: string) => void; isSharing: string | null }) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)

  const { handleRemove, getFavorites } = useFavoritesList<WikiLovesImageFavoriteDoc>({
    userId,
    storageKey: WIKILOVES_FAVORITES_KEY,
    resourceIdGetter: (item) => item.docid,
    bookmarkType: 'IMAGE_WIKILOVES',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getWikiLovesFavoritesAction()
      return result.favorites as WikiLovesImageFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        renderItem={(item, onRemove) => (
          <WikiLovesFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} isShared={sharedIds.has(item.docid)} onShareToggle={() => onShareToggle(item.docid)} isSharing={isSharing === item.docid} />
        )}
        emptyTitle="Aucun favori Wiki Loves"
        emptyDescription="Favorisez des images depuis la page d&apos;accueil pour les voir ici."
        storageKey={WIKILOVES_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-indigo-200"
        bgGradient="bg-gradient-to-br from-indigo-50 to-emerald-50"
        darkBorderColor="dark:border-indigo-800"
        darkBgGradient="dark:from-indigo-950/20 dark:to-emerald-950/20"
        textColor="text-indigo-900"
        darkTextColor="dark:text-indigo-100"
        buttonColor="text-purple-600"
        buttonHoverBg="hover:bg-indigo-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Wiki Loves"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
