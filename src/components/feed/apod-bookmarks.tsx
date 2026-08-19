'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Trash2 } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { getApodFavoritesAction } from '@/actions/bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { ShareButton } from './share-button'
import { useItemShare } from './use-item-share'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations, useLocale } from 'next-intl'

import { ApodFavoriteDoc } from '@/lib/apod-bookmark'

const APOD_FAVORITES_KEY = 'apod_favorites'

interface ApodBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (item: ApodFavoriteDoc) => void
  isSharing?: string | null
  searchQuery?: string
}

function ApodFavoriteItem({ item, onRemove, onShowFullImage, isShared, onShareToggle, isSharing }: { item: ApodFavoriteDoc; onRemove: () => void; onShowFullImage: (url: string) => void; isShared: boolean; onShareToggle: () => void; isSharing: boolean }) {
  const t = useTranslations('feed')
  const locale = useLocale()
  const titre = locale === 'fr' && item.titreFr ? item.titreFr : item.titre
  const description = locale === 'fr' && item.descriptionFr ? item.descriptionFr : item.description
  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: item.link,
    title: `APOD - ${titre}`,
    text: `${titre}\n${item.auteur}\n\n${description ?? ''}`,
    itemId: item.id,
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
              decoding="async"
              src={sanitizeUrl(item.imageUrl, '')}
              alt={titre}
              loading="lazy"
              className="max-w-full transition-opacity hover:opacity-90 rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="purple" />
          </div>
        )}
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
          {titre}
        </p>
        {item.auteur && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
            {item.auteur}
          </p>
        )}
        {description && (
          <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100 mb-2">
            {description}
          </p>
        )}
        {isValidUrl(item.link) && (
          <Link
            href={sanitizeUrl(item.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
          >
            Voir sur APOD
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <ShareToLobbyButton resourceId={item.id} resourceType="APOD" meta={{ titre: item.titre, auteur: item.auteur, imageUrl: item.imageUrl, link: item.link, droits: item.droits, description: item.description, titreFr: item.titreFr || undefined, descriptionFr: item.descriptionFr || undefined }} />
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

interface ApodBookmarksInnerProps extends ApodBookmarksProps {
  sharedIds: Set<string>
  isSharing: string | null
}

export function ApodBookmarks({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: ApodBookmarksInnerProps) {
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const { handleRemove, getFavorites } = useFavoritesList<ApodFavoriteDoc>({
    userId,
    storageKey: APOD_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'APOD',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getApodFavoritesAction()
      return result.favorites as ApodFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <>
      <PaginatedFavoritesList
        onRemoveComplete={onRemoveComplete}
        fetchFn={fetchFn}
        searchQuery={searchQuery}
        searchFields={(item) => `${item.titre} ${item.titreFr} ${item.description ?? ''} ${item.descriptionFr ?? ''}`}
        renderItem={(item, onRemove) => (
          <ApodFavoriteItem item={item} onRemove={onRemove} onShowFullImage={setShowFullImage} isShared={sharedIds.has(item.id)} onShareToggle={() => onShareToggle && onShareToggle(item)} isSharing={isSharing === item.id} />
        )}
        emptyTitle="Aucune image APOD favorite"
        emptyDescription="Cliquez sur le bookmark d&apos;une image APOD pour la sauvegarder ici."
        storageKey={APOD_FAVORITES_KEY}
        userId={userId}
        removeFavorite={handleRemove}
        borderColor="border-indigo-200"
        bgGradient="bg-gradient-to-br from-indigo-50 to-purple-50"
        darkBorderColor="dark:border-indigo-800"
        darkBgGradient="dark:from-indigo-950/20 dark:to-purple-950/20"
        textColor="text-indigo-900"
        darkTextColor="dark:text-indigo-100"
        buttonColor="text-indigo-600"
        buttonHoverBg="hover:bg-indigo-100"
      />
      {showFullImage && (
        <ImageLightbox
          src={showFullImage}
          alt="APOD"
          onClose={() => setShowFullImage(null)}
        />
      )}
    </>
  )
}
