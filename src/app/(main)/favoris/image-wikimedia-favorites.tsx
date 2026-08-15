'use client'

import { getWikimediaFavoritesAction } from '@/actions/bookmark-actions'
import { type WikimediaImageFavoriteDoc } from '@/lib/image-wikimedia-bookmark'
import { ImageSourceFavorites } from '@/components/feed/image-source-favorites'

interface ImageWikimediaFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (item: WikimediaImageFavoriteDoc) => void
  isSharing?: string | null
  searchQuery?: string
}

export function ImageWikimediaFavorites({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: ImageWikimediaFavoritesProps) {
  return (
    <ImageSourceFavorites
      userId={userId}
      onRemoveComplete={onRemoveComplete}
      sharedIds={sharedIds || new Set()}
      onShareToggle={onShareToggle || (() => {})}
      isSharing={isSharing || null}
      searchQuery={searchQuery}
      config={{
        storageKey: 'image_wikimedia_favorites',
        bookmarkType: 'IMAGE_WIKIMEDIA',
        color: 'rose',
        hintColor: 'rose',
        resourceType: 'IMAGE_WIKIMEDIA',
        emptyTitle: "Aucun favori Wikimedia",
        emptyDescription: "Favorisez des images depuis la page d'accueil pour les voir ici.",
        linkText: 'Voir sur Wikimedia Commons',
        lightboxAlt: 'Wikimedia Commons',
        searchFields: (item) => `${item.titre} ${item.auteur}`,
        fetchAction: getWikimediaFavoritesAction,
      }}
    />
  )
}
