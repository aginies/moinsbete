'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Trash2, ArrowUpRight } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getInsoliteFavoritesAction } from '@/actions/bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from './share-button'
import { useItemShare } from './use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'
import { ImageLightbox } from './image-lightbox'

export interface InsoliteFavoriteDoc {
  id: string
  title: string
  description: string
  url: string | null
  imageUrl: string | null
  favoritedAt: string
}

const INSOLITE_FAVORITES_KEY = 'insolite_favorites'

interface InsoliteBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (resourceId: string) => void
  isSharing?: string | null
  searchQuery?: string
}

function InsoliteFavoriteItem({ item, onRemove, onShowFullImage, isShared, onShareToggle, isSharing }: { item: InsoliteFavoriteDoc; onRemove: () => void; onShowFullImage: (url: string) => void; isShared: boolean; onShareToggle: () => void; isSharing: boolean }) {
  const t = useTranslations('feed')
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'
  const shareUrl = `${baseUrl}/insolite/${item.id}`
  const { handleShare, copied, shareUrl: itemShareUrl } = useItemShare({
    shareUrl,
    title: item.title,
    text: item.description || item.title,
    itemId: item.id,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {item.imageUrl && isValidUrl(item.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800"
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
        <p className={'text-sm font-medium text-purple-900 dark:text-purple-100 mb-1'}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.url && (
          <Link
            href={sanitizeUrl(item.url, '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline"
          >
            {t('read_article')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={itemShareUrl} />
        <ShareToLobbyButton resourceId={item.id} resourceType="INSOLITE" meta={{ title: item.title, description: item.description, url: item.url || '', imageUrl: item.imageUrl }} />
        <Link
          href={`/insolite/${item.id}`}
          className="rounded-full p-1.5 text-purple-600 opacity-60 hover:opacity-100 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-900/40 transition-all"
          title="Voir l&apos;article"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
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

export function InsoliteBookmarks({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: InsoliteBookmarksProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const { handleRemove, getFavorites } = useFavoritesList<InsoliteFavoriteDoc>({
    userId,
    storageKey: INSOLITE_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'INSOLITE',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getInsoliteFavoritesAction()
      return result.favorites as InsoliteFavoriteDoc[]
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
          <InsoliteFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} isShared={sharedIds?.has(item.id) || false} onShareToggle={() => onShareToggle?.(item.id)} isSharing={isSharing === item.id} />
        )}
        emptyTitle="Aucun favori Articles insolites"
        emptyDescription="Favorisez des articles depuis la page d&apos;accueil pour les voir ici."
        storageKey={INSOLITE_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-purple-200"
        bgGradient="bg-gradient-to-br from-purple-50 to-violet-50"
        darkBorderColor="dark:border-purple-800"
        darkBgGradient="dark:from-purple-950/20 dark:to-violet-950/20"
        textColor="text-purple-900"
        darkTextColor="dark:text-purple-100"
        buttonColor="text-purple-600"
        buttonHoverBg="hover:bg-purple-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="Article image"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
