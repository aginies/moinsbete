'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, ArrowUpRight } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { getPortailLexicalFavoritesAction } from '@/actions/portail-lexical-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { ShareToLobbyFavoritesButton } from '@/app/(main)/favoris/share-to-lobby-button'

export interface PortailLexicalFavoriteDoc {
  id: string
  form: string
  pos: string
  full_pos: string
  description: string
  ipa: string
  favoritedAt: string
}

const PORTAIL_LEXICAL_FAVORITES_KEY = 'portail_lexical_favorites'

interface PortailLexicalBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
}

function PortailLexicalFavoriteItem({ item, onRemove }: { item: PortailLexicalFavoriteDoc; onRemove: () => void }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `https://www.portail-lexical.fr/definition/${encodeURIComponent(item.form)}`
  const { handleShare, copied } = useItemShare({
    shareUrl,
    title: `${item.full_pos} ${item.form}`,
    text: item.description,
    itemId: item.id,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="mb-2">
          <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
            {item.form}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {item.full_pos}
            </span>
            {item.ipa && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                /{item.ipa}/
              </span>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          {item.description}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <Link
          href={sanitizeUrl(shareUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-1.5 text-amber-600 opacity-60 hover:opacity-100 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40 transition-all"
          title="Voir sur Portail Lexical"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-amber-600 opacity-60 hover:opacity-100 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40 transition-all"
          title="Retirer des favoris"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function PortailLexicalBookmarks({ userId, onRemoveComplete }: PortailLexicalBookmarksProps) {
  const { handleRemove, getFavorites } = useFavoritesList<PortailLexicalFavoriteDoc>({
    userId,
    storageKey: PORTAIL_LEXICAL_FAVORITES_KEY,
    resourceIdGetter: (item) => item.form,
    bookmarkType: 'PORTAIL_LEXICAL',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getPortailLexicalFavoritesAction()
      return result.favorites as PortailLexicalFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      renderItem={(item, onRemove) => (
        <PortailLexicalFavoriteItem item={item} onRemove={onRemove} />
      )}
      emptyTitle="Aucun favori Lexique"
      emptyDescription="Favorisez des mots depuis le Portail Lexical pour les voir ici."
      storageKey={PORTAIL_LEXICAL_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-amber-200"
      bgGradient="bg-gradient-to-br from-amber-50 to-yellow-50"
      darkBorderColor="dark:border-amber-800"
      darkBgGradient="dark:from-amber-950/20 dark:to-yellow-950/20"
      textColor="text-amber-900"
      darkTextColor="dark:text-amber-100"
      buttonColor="text-amber-600"
      buttonHoverBg="hover:bg-amber-100"
    />
  )
}
