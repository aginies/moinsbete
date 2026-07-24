'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Trash2, Play } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getPixabayFavoritesAction } from '@/actions/image-pixabay-bookmark-actions'
import { type PixabayVideoFavoriteDoc } from '@/lib/image-pixabay-bookmark'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'

const PIXABAY_FAVORITES_KEY = 'image_pixabay_favorites'

interface PixabayFavoriteItemProps {
  item: PixabayVideoFavoriteDoc
  onRemove: () => void
}

function PixabayFavoriteItem({ item, onRemove }: PixabayFavoriteItemProps) {
  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: item.pageURL,
    title: item.author || 'Pixabay',
    text: item.author ? `Par ${item.author}` : '',
    itemId: item.docid,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {isValidUrl(item.thumbnailUrl) && (
          <div className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800 relative">
            <img
              src={sanitizeUrl(item.thumbnailUrl, '')}
              alt="Pixabay video thumbnail"
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-8 w-8 text-white/80" />
            </div>
          </div>
        )}
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
          Pixabay Video
        </h3>
        {item.author && (
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
            Par {item.author}
          </p>
        )}
        {isValidUrl(item.authorProfileUrl) && (
          <Link
            href={item.authorProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
          >
            Profil Pixabay
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
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

export function PixabayFavorites({ userId, onRemoveComplete, searchQuery }: { userId?: string; onRemoveComplete?: () => void; searchQuery?: string }) {
  const { handleRemove } = useFavoritesList<PixabayVideoFavoriteDoc>({
    userId,
    storageKey: PIXABAY_FAVORITES_KEY,
    resourceIdGetter: (item) => item.docid,
    bookmarkType: 'IMAGE_PIXABAY',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getPixabayFavoritesAction()
      return result.favorites as PixabayVideoFavoriteDoc[]
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem(PIXABAY_FAVORITES_KEY) : null
    return stored ? JSON.parse(stored) : []
  }, [userId])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      searchQuery={searchQuery}
      searchFields={(item) => `${item.tags} ${item.author}`}
      renderItem={(item, onRemove) => (
        <PixabayFavoriteItem item={item} onRemove={onRemove} />
      )}
      emptyTitle="Aucun favori Pixabay"
      emptyDescription="Favorisez des vidéos depuis la page d&apos;accueil pour les voir ici."
      storageKey={PIXABAY_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-amber-200"
      bgGradient="bg-gradient-to-br from-amber-50 to-yellow-50"
      darkBorderColor="dark:border-amber-800"
      darkBgGradient="dark:from-amber-950/20 dark:to-yellow-950/20"
      textColor="text-amber-900"
      darkTextColor="dark:text-amber-100"
      buttonColor="text-orange-600"
      buttonHoverBg="hover:bg-amber-100"
    />
  )
}
