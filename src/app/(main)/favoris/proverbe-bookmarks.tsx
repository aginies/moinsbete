'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, ArrowUpRight } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { getProverbeFavoritesAction } from '@/actions/proverbe-bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { ShareToLobbyFavoritesButton } from '@/app/(main)/favoris/share-to-lobby-button'
import { isSharedResourceToLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'

export interface ProverbeFavoriteDoc {
  id: string
  text: string
  signification: string
  source: string
  url: string
  favoritedAt: string
}

const PROVERBE_FAVORITES_KEY = 'proverbe_favorites'

interface ProverbeBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
}

function ProverbeFavoriteItem({ item, onRemove, onShareToggle, isShared, isSharing }: { item: ProverbeFavoriteDoc; onRemove: () => void; onShareToggle: () => void; isShared: boolean; isSharing: boolean }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = item.url || `https://fr.wiktionary.org/wiki/${encodeURIComponent(item.text)}`
  const { handleShare, copied } = useItemShare({
    shareUrl,
    title: item.text,
    text: `${item.text}\n\n${item.signification}`,
    itemId: item.id,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="mb-2">
          <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 italic">
            "{item.text}"
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {item.source}
            </span>
          </div>
        </div>
        {item.signification && (
          <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
            {item.signification}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
        <Link
          href={sanitizeUrl(shareUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-1.5 text-emerald-600 opacity-60 hover:opacity-100 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/40 transition-all"
          title="Voir sur Wiktionnaire"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <ShareToLobbyFavoritesButton isShared={isShared} onToggle={onShareToggle} loading={isSharing} resourceId={item.id} />
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 text-emerald-600 opacity-60 hover:opacity-100 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/40 transition-all"
          title="Retirer des favoris"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ProverbeBookmarks({ userId, onRemoveComplete }: ProverbeBookmarksProps) {
  const { handleRemove, getFavorites } = useFavoritesList<ProverbeFavoriteDoc>({
    userId,
    storageKey: PROVERBE_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'PROVERBE',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getProverbeFavoritesAction()
      return result.favorites as ProverbeFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      renderItem={(item, onRemove) => (
        <ProverbeFavoriteItem item={item} onRemove={onRemove} onShareToggle={() => {}} isShared={false} isSharing={false} />
      )}
      emptyTitle="Aucun favori Proverbe"
      emptyDescription="Favorisez des proverbes depuis la page Proverbes pour les voir ici."
      storageKey={PROVERBE_FAVORITES_KEY}
      userId={userId}
      removeFavorite={handleRemove}
      borderColor="border-emerald-200"
      bgGradient="bg-gradient-to-br from-emerald-50 to-green-50"
      darkBorderColor="dark:border-emerald-800"
      darkBgGradient="dark:from-emerald-950/20 dark:to-green-950/20"
      textColor="text-emerald-900"
      darkTextColor="dark:text-emerald-100"
      buttonColor="text-emerald-600"
      buttonHoverBg="hover:bg-emerald-100"
    />
  )
}
