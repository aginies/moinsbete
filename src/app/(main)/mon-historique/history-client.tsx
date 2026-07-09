'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, X, Search } from 'lucide-react'
import { clearHistoryAction, removeFromHistoryAction } from '@/actions/view-actions'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { normalizeAccents } from '@/lib/utils'
import type { CompactIdea } from '@/types/idea'

interface HistoryPageClientProps {
  initialIdeas: Array<CompactIdea & { viewedAt: string }>
  total: number
  userId: string
}

const PAGE_SIZE = 50

export default function HistoryPageClient({ initialIdeas, total: initialTotal, userId }: HistoryPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ideas, setIdeas] = useState(initialIdeas)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [total, setTotal] = useState(initialTotal)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = normalizeAccents(searchQuery).toLowerCase()
    return ideas.filter(idea => normalizeAccents(idea.title).toLowerCase().includes(q))
  }, [ideas, searchQuery])

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
    router.push(`/mon-historique?${params.toString()}`)
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

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher dans l&apos;historique..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
      ) : searchQuery && filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredIdeas.map((idea) => (
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              pageUrl={(page) => {
                const params = new URLSearchParams(searchParams.toString())
                if (page > 1) {
                  params.set('page', String(page))
                } else {
                  params.delete('page')
                }
                return `/mon-historique?${params.toString()}`
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
