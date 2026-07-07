'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clearHistoryAction, removeFromHistoryAction } from '@/actions/view-actions'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { Skeleton } from '@/components/ui/skeleton'

interface HistoryPageClientProps {
  initialIdeas: Array<{
    id: string
    title: string
    slug: string
    content: string
    takeaway: string
    source: { title: string; type: string; url?: string | null; coverUrl?: string | null }
    topics: Array<{ id: string; name: string; slug: string; icon: string; color: string }>
    viewedAt: string
  }>
  total: number
  userId: string
}

const PAGE_SIZE = 50

function generatePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)
  return pages
}

export default function HistoryPageClient({ initialIdeas, total: initialTotal, userId }: HistoryPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ideas, setIdeas] = useState(initialIdeas)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [total, setTotal] = useState(initialTotal)

  const currentPage = parseInt(searchParams.get('page') || '1') || 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchHistory = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/history?page=${page}&limit=${PAGE_SIZE}`)
      const data = await res.json()
      setIdeas(data.ideas)
    } catch (err) {
      console.error('History fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentPage === 1) return
    fetchHistory(currentPage)
  }, [currentPage, fetchHistory])
  /* eslint-enable react-hooks/set-state-in-effect */

  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    router.push(`/ma-histoire?${params.toString()}`)
  }, [router, searchParams])

  const handleClearHistory = useCallback(async () => {
    if (!window.confirm('Vider tout l\'historique ?')) {
      return
    }
    setClearing(true)
    try {
      await clearHistoryAction(userId)
      window.location.reload()
    } catch (err) {
      console.error('Error clearing history:', err)
    } finally {
      setClearing(false)
    }
  }, [userId])

  const handleRemove = useCallback(async (viewedIdeaId: string) => {
    setRemoving(viewedIdeaId)
    setIdeas(prev => prev.filter(idea => idea.id !== viewedIdeaId))
    try {
      await removeFromHistoryAction(viewedIdeaId, userId)
      setTotal(prev => prev - 1)
    } catch (err) {
      console.error('Error removing from history:', err)
      fetchHistory(currentPage)
    } finally {
      setRemoving(null)
    }
  }, [userId, currentPage, fetchHistory])

  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Mon historique</h1>
          <p className="text-sm text-muted-foreground">
            {total} idées vues
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          disabled={clearing}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Vider l&apos;historique
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Aucun historique</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="group relative">
                <CompactIdeaCard idea={idea as typeof idea & { viewedAt: string }} />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(idea.id)
                  }}
                  disabled={removing === idea.id}
                  className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground opacity-30 transition-opacity hover:opacity-100 hover:bg-muted hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 py-1 text-sm text-muted-foreground">
                Page {currentPage}/{totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="ml-4 flex items-center gap-1">
                {pageNumbers.map((page, index) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[2rem]"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
