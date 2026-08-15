'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Trash2, ArrowUpRight, Quote } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { getCitationFavoritesAction } from '@/actions/bookmark-actions'
import { PaginatedFavoritesList } from '@/components/feed/paginated-favorites-list'
import { useFavoritesList } from '@/components/feed/use-favorites-list'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { CitationFavoriteDoc } from '@/lib/citation-bookmark'

const CITATION_FAVORITES_KEY = 'citation_favorites'

interface CitationBookmarksProps {
  userId?: string
  onRemoveComplete?: () => void
  searchQuery?: string
}

function CitationFavoriteItem({ item, onRemove }: { item: CitationFavoriteDoc; onRemove: () => void }) {
  const { handleShare, copied } = useItemShare({
    shareUrl: item.url,
    title: `${item.text} — ${item.author}`,
    text: `"${item.text}" — ${item.author}${item.source ? ` (${item.source})` : ''}`,
  })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="mb-2">
          <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100 italic">
            &quot;{item.text}&quot;
          </h4>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {item.author}
            </span>
            {item.source && (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                • {item.source}
              </span>
            )}
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              {item.category}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ShareButton onClick={handleShare} copied={copied} shareUrl={item.url} />
        <Link
          href={sanitizeUrl(item.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-1.5 text-amber-600 opacity-60 hover:opacity-100 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40 transition-all"
          title="Voir sur Wikiquote"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
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

export function CitationBookmarks({ userId, onRemoveComplete, searchQuery }: CitationBookmarksProps) {
  const { handleRemove, getFavorites } = useFavoritesList<CitationFavoriteDoc>({
    userId,
    storageKey: CITATION_FAVORITES_KEY,
    resourceIdGetter: (item) => item.id,
    bookmarkType: 'CITATION',
  })

  const fetchFn = useCallback(async () => {
    if (userId) {
      const result = await getCitationFavoritesAction()
      return result.favorites as CitationFavoriteDoc[]
    }
    return getFavorites()
  }, [userId, getFavorites])

  return (
    <PaginatedFavoritesList
      onRemoveComplete={onRemoveComplete}
      fetchFn={fetchFn}
      searchQuery={searchQuery}
      searchFields={(item) => `${item.text} ${item.author} ${item.source} ${item.category}`}
      renderItem={(item, onRemove) => (
        <CitationFavoriteItem item={item} onRemove={onRemove} />
      )}
      emptyTitle="Aucune citation favorite"
      emptyDescription="Favorisez des citations depuis la carte Citations pour les voir ici."
      storageKey={CITATION_FAVORITES_KEY}
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
