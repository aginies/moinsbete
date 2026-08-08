'use client'

import { getWikiLovesFavoritesAction } from '@/actions/image-wikiloves-bookmark-actions'
import { type WikiLovesImageFavoriteDoc } from '@/lib/image-wikiloves-bookmark'
import { ImageSourceFavorites } from '@/components/feed/image-source-favorites'

interface ImageWikiLovesFavoritesProps {
  userId?: string
  onRemoveComplete?: () => void
  sharedIds?: Set<string>
  onShareToggle?: (item: WikiLovesImageFavoriteDoc) => void
  isSharing?: string | null
  searchQuery?: string
}

export function ImageWikiLovesFavorites({ userId, onRemoveComplete, sharedIds, onShareToggle, isSharing, searchQuery }: ImageWikiLovesFavoritesProps) {
  return (
    <ImageSourceFavorites
      userId={userId}
      onRemoveComplete={onRemoveComplete}
      sharedIds={sharedIds || new Set()}
      onShareToggle={onShareToggle || (() => {})}
      isSharing={isSharing || null}
      searchQuery={searchQuery}
      config={{
        storageKey: 'image_wikiloves_favorites',
        bookmarkType: 'IMAGE_WIKILOVES',
        color: 'indigo',
        hintColor: 'cyan',
        resourceType: 'IMAGE_WIKILOVES',
        emptyTitle: "Aucun favori Wiki Loves",
        emptyDescription: "Favorisez des images depuis la page d'accueil pour les voir ici.",
        linkText: 'Voir sur Wikimedia Commons',
        lightboxAlt: 'Wiki Loves',
        searchFields: (item) => item.titre,
        fetchAction: getWikiLovesFavoritesAction,
      }}
    />
  )
}
