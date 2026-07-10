'use client'

import { useCallback, useState, useEffect } from 'react'
import { fetchDueIdeas } from '@/actions/review-actions'
import { ReviewList } from '@/components/review/review-list'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ReviewPageClientProps {
  userId: string
  currentPage: number
}

export function ReviewPageClient({ userId, currentPage }: ReviewPageClientProps) {
  const [ideas, setIdeas] = useState<any[]>([])
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
      console.error('[ReviewPageClient] Error loading ideas:', err)
      setIdeas([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdeas(page)
  }, [page, loadIdeas])

  const handleIdeaRemoved = useCallback((ideaId: string) => {
    setRemovedIds(prev => new Set([...prev, ideaId]))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const displayedIdeas = ideas.filter(idea => !removedIds.has(idea.id))

  return (
    <TooltipProvider>
      <ReviewList
        ideas={displayedIdeas}
        total={total}
        loading={loading}
        currentPage={page}
        onPageChange={handlePageChange}
        onIdeaRemoved={handleIdeaRemoved}
      />
    </TooltipProvider>
  )
}
