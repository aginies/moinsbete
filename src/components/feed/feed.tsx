'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IdeaCard, CompactIdeaCard } from './idea-card'
import { Skeleton } from '@/components/ui/skeleton'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Idea } from '@/types/idea'

interface FeedProps {
  topic?: string
  collection?: string
  initialIdeas?: Idea[]
  initialHasMore?: boolean
  initialPage?: number
  initialTotal?: number
  onBookmark?: (ideaId: string) => void
  savedIdeaIds?: Set<string>
  userId?: string
  isHistory?: boolean
  compact?: boolean
  onRemove?: (ideaId: string) => void
}

export function Feed({
  topic,
  collection,
  initialIdeas = [],
  initialHasMore = false,
  initialPage = 1,
  initialTotal = 0,
  onBookmark,
  savedIdeaIds = new Set(),
  userId,
  isHistory = false,
  compact = false,
  onRemove,
}: FeedProps) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchIdeas = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(null)

    try {
      let response: Response

      if (isHistory && userId) {
        const params = new URLSearchParams({
          userId,
          page: String(pageNum),
          limit: '10',
        })
        response = await fetch(`/api/history?${params}`)
      } else {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: '10',
        })

        if (topic) params.set('topic', topic)
        if (collection) params.set('collection', collection)
        if (userId) params.set('userId', userId)

        response = await fetch(`/api/feed?${params}`)
      }

      const data = await response.json()

      if (pageNum === 1) {
        setIdeas(data.ideas)
      } else {
        setIdeas(prev => [...prev, ...data.ideas])
      }

      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      setError('Erreur lors du chargement des idées')
    } finally {
      setLoading(false)
    }
  }, [topic, collection, userId, isHistory])

  useEffect(() => {
    setIdeas(initialIdeas)
    setPage(initialPage)
    setHasMore(initialHasMore)
  }, [initialIdeas, initialPage, initialHasMore])

  useEffect(() => {
    if (initialIdeas.length > 0) return
    fetchIdeas(1)
  }, [fetchIdeas, initialIdeas])

  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchIdeas(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchIdeas])

  // Deduplicate ideas by ID and title before rendering to prevent any duplicate rendering
  const uniqueIdeas = React.useMemo(() => {
    const seenIds = new Set<string>()
    const seenTitles = new Set<string>()
    return ideas.filter((idea) => {
      if (!idea?.id || !idea?.title) return false
      const normTitle = idea.title.trim().toLowerCase()
      if (seenIds.has(idea.id) || seenTitles.has(normTitle)) {
        return false
      }
      seenIds.add(idea.id)
      seenTitles.add(normTitle)
      return true
    })
  }, [ideas])

  if (uniqueIdeas.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Aucune idée trouvée</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {uniqueIdeas.map((idea) => (
        <div key={idea.id} className="group relative">
          {(isHistory || compact) && onRemove ? (
            <div className="pr-8">
              <CompactIdeaCard idea={idea as Idea & { viewedAt: string }} />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove(idea.id)
                }}
                className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground opacity-30 hover:text-destructive group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : isHistory || compact ? (
            <CompactIdeaCard idea={idea as Idea & { viewedAt: string }} />
          ) : (
            <IdeaCard
              idea={idea}
              isBookmarked={savedIdeaIds.has(idea.id)}
              onBookmark={onBookmark}
            />
          )}
        </div>
      ))}

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      )}

      <div ref={loaderRef} className="h-4" />

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!hasMore && !loading && uniqueIdeas.length > 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Fin du feed 🎉
        </p>
      )}
    </div>
  )
}
