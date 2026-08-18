'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Trash2 } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getAirCrashFavoritesAction } from '@/actions/bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from './share-button'
import { useItemShare } from './use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'
import { ImageLightbox } from './image-lightbox'

export interface AirCrashFavoriteDoc {
  id: string
  title: string
  description: string
  url: string | null
  imageUrl: string | null
  favoritedAt: string
}

const AIR_CRASH_FAVORITES_KEY = 'air_crash_favorites'

interface AirCrashBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
  searchQuery?: string
}

function AirCrashFavoriteItem({ item, onRemove, onShowFullImage }: { item: AirCrashFavoriteDoc; onRemove: () => void; onShowFullImage: (url: string) => void }) {
  const t = useTranslations('feed')
  const { handleShare, copied, shareUrl: itemShareUrl } = useItemShare({
    shareUrl: item.url || '',
    title: item.title,
    text: item.description || item.title,
    itemId: item.id,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {item.imageUrl && isValidUrl(item.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800"
            onClick={() => onShowFullImage(item.imageUrl || '')}
          >
            <img
              src={sanitizeUrl(item.imageUrl, '')}
              alt={item.title}
              loading="lazy"
              className="max-w-full object-cover transition-opacity hover:opacity-90 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <p className={'text-sm font-medium text-blue-900 dark:text-blue-100 mb-1'}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.url && (
          <Link
            href={sanitizeUrl(item.url, '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
          >
            {t('read_article')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={itemShareUrl} />
        <ShareToLobbyButton resourceId={item.id} resourceType="AIR_CRASH" meta={{ title: item.title, description: item.description, url: item.url || '', imageUrl: item.imageUrl }} />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-red-500 opacity-60 hover:opacity-100 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40 transition-all"
          title={t('remove_favorite')}
          aria-label={t('remove_favorite')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function AirCrashBookmarks({ userId, onRemoveComplete, searchQuery }: AirCrashBookmarksProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const { handleRemove, getFavorites } = useFavoritesList<AirCrashFavoriteDoc>({
    userId,
    storageKey: AIR_CRASH_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'AIR_CRASH',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getAirCrashFavoritesAction()
      return result.favorites as AirCrashFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        searchQuery={searchQuery}
        searchFields={(item) => `${item.title} ${item.description}`}
        renderItem={(item, onRemove) => (
          <AirCrashFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} />
        )}
        emptyTitle="Aucun favori Air Crash Investigation"
        emptyDescription="Favorisez des accidents depuis la page d&apos;accueil pour les voir ici."
        storageKey={AIR_CRASH_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-blue-200"
        bgGradient="bg-gradient-to-br from-blue-50 to-sky-50"
        darkBorderColor="dark:border-blue-800"
        darkBgGradient="dark:from-blue-950/20 dark:to-sky-950/20"
        textColor="text-blue-900"
        darkTextColor="dark:text-blue-100"
        buttonColor="text-blue-600"
        buttonHoverBg="hover:bg-blue-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Air Crash Investigation image"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
