'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'
import { normalizeAccents } from '@/lib/utils'

interface PaginatedFavoritesListProps<T> {
  fetchFn: () => Promise<T[]>
  renderItem: (item: T, onRemove: () => void) => React.ReactNode
  emptyTitle: string
  emptyDescription: string
  noResultsTitle?: string
  storageKey: string
  userId?: string
  removeFavorite: (item: T) => Promise<void>
  borderColor?: string
  bgGradient?: string
  darkBorderColor?: string
  darkBgGradient?: string
  textColor?: string
  darkTextColor?: string
  buttonColor?: string
  buttonHoverBg?: string
  onRemoveComplete?: () => Promise<void> | void
  searchQuery?: string
  searchFields?: (item: T) => string
}

const PAGE_SIZE = 10

export function PaginatedFavoritesList<T>({
  fetchFn,
  renderItem,
  emptyTitle,
  emptyDescription,
  noResultsTitle,
  storageKey,
  removeFavorite,
  onRemoveComplete,
  borderColor = 'border-purple-200',
  bgGradient = 'bg-gradient-to-br from-purple-50 to-violet-50',
  darkBorderColor = 'dark:border-purple-800',
  darkBgGradient = 'dark:from-purple-950/20 dark:to-violet-950/20',
  searchQuery,
  searchFields,
}: PaginatedFavoritesListProps<T>) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [allFavorites, setAllFavorites] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const searchParamsRef = useRef(searchParams)

  useEffect(() => {
    if (searchParamsRef.current !== searchParams) {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      setCurrentPage(page)
      searchParamsRef.current = searchParams
    }
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

  const filteredFavorites = useMemo(() => {
    if (!searchQuery?.trim() || !searchFields) return allFavorites
    const q = normalizeAccents(searchQuery).toLowerCase()
    return allFavorites.filter(item => {
      const text = searchFields(item)
      return normalizeAccents(text).toLowerCase().includes(q)
    })
  }, [allFavorites, searchQuery, searchFields])

  const paginatedFavorites = filteredFavorites.slice(start, start + PAGE_SIZE)

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchFn()
      setAllFavorites(result)
    } catch {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      setAllFavorites(stored ? JSON.parse(stored) : [])
    }
    setLoading(false)
  }, [fetchFn, storageKey])

  const handleRemove = useCallback(async (item: T) => {
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
        <p className="mb-2 text-lg font-semibold">{noResultsTitle || emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="space-y-3">
        {paginatedFavorites.map((item, index) => (
          <div
            key={(item as any).id || index}
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
          Page {safePage} sur {totalPages} · {filteredFavorites.length} favori{filteredFavorites.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
