'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'

interface PaginatedFavoritesListProps {
  fetchFn: () => Promise<any[]>
  renderItem: (item: any, onRemove: () => void) => React.ReactNode
  emptyTitle: string
  emptyDescription: string
  storageKey: string
  userId?: string
  removeFavorite: (item: any) => Promise<void>
  borderColor?: string
  bgGradient?: string
  darkBorderColor?: string
  darkBgGradient?: string
  textColor?: string
  darkTextColor?: string
  buttonColor?: string
  buttonHoverBg?: string
  onRemoveComplete?: () => Promise<void> | void
}

const PAGE_SIZE = 10

export function PaginatedFavoritesList({
  fetchFn,
  renderItem,
  emptyTitle,
  emptyDescription,
  storageKey,
  removeFavorite,
  onRemoveComplete,
  borderColor = 'border-purple-200',
  bgGradient = 'bg-gradient-to-br from-purple-50 to-violet-50',
  darkBorderColor = 'dark:border-purple-800',
  darkBgGradient = 'dark:from-purple-950/20 dark:to-violet-950/20',
}: PaginatedFavoritesListProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [allFavorites, setAllFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const [currentPage, setCurrentPage] = useState(initialPage)

  useEffect(() => {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    setCurrentPage(page)
  }, [searchParams])

  useEffect(() => {
    async function loadFavorites() {
      try {
        const result = await fetchFn()
        setAllFavorites(result)
      } catch {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
        setAllFavorites(stored ? JSON.parse(stored) : [])
      }
      setLoading(false)
    }
    loadFavorites()
  }, [fetchFn, storageKey])

  const totalPages = Math.max(1, Math.ceil(allFavorites.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginatedFavorites = allFavorites.slice(start, start + PAGE_SIZE)

  const loadFavorites = useCallback(async () => {
    try {
      const result = await fetchFn()
      setAllFavorites(result)
    } catch {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      setAllFavorites(stored ? JSON.parse(stored) : [])
    }
    setLoading(false)
  }, [fetchFn, storageKey])

  const handleRemove = useCallback(async (item: any) => {
    await removeFavorite(item)
    await loadFavorites()
    if (onRemoveComplete) {
      await onRemoveComplete()
    }
  }, [removeFavorite, onRemoveComplete, loadFavorites])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (paginatedFavorites.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
        <p className="mb-2 text-lg font-semibold">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="space-y-3">
        {paginatedFavorites.map((item, index) => (
          <div
            key={item.id || index}
            className={`group relative rounded-xl border-2 ${borderColor} ${bgGradient} p-4 ${darkBorderColor} ${darkBgGradient} hover:shadow-md transition-shadow`}
          >
            {renderItem(item, () => handleRemove(item))}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          pageUrl={(page) => {
            if (page === 1) return pathname
            return `${pathname}?page=${page}`
          }}
        />
      )}

      {allFavorites.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Page {safePage} sur {totalPages} · {allFavorites.length} favori{allFavorites.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
