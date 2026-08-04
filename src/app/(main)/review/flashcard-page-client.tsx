'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { fetchDueIdeas, type DueIdea } from '@/actions/review-actions'
import { FlashcardList } from '@/components/review/flashcard-list'
import { Button } from '@/components/ui/button'

interface FlashcardPageClientProps {
  currentPage: number
}

export function FlashcardPageClient({ currentPage }: FlashcardPageClientProps) {
  const [ideas, setIdeas] = useState<DueIdea[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(currentPage)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const loadIdeas = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const result = await fetchDueIdeas(pageNum)
      setIdeas(result.ideas)
      setTotal(result.total)
    } catch (err) {
      console.error('[FlashcardPageClient] Error loading ideas:', err)
      setIdeas([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadedPageRef = useRef(page)

  useEffect(() => {
    loadIdeas(page)
    loadedPageRef.current = page
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page !== loadedPageRef.current) {
      loadIdeas(page)
      loadedPageRef.current = page
    }
  }, [page, loadIdeas])

  const handleIdeaRemoved = useCallback((ideaId: string) => {
    setRemovedIds(prev => new Set([...prev, ideaId]))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const displayedIdeas = ideas.filter(idea => !removedIds.has(idea.id))
  const hasMore = page * 10 < total

  return (
    <div className="mx-auto w-full px-4 py-4 md:max-w-6xl md:p-6">
      <FlashcardList
        ideas={displayedIdeas}
        total={total}
        loading={loading}
        onIdeaRemoved={handleIdeaRemoved}
      />

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
          >
            Charger plus d'idées
          </Button>
        </div>
      )}
    </div>
  )
}
