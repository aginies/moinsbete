'use client'

import { useEffect, useRef, useState } from 'react'
import { IdeaCard } from './idea-card'
import { Skeleton } from '@/components/ui/skeleton'

interface Idea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
   source: {
      title: string
      type: string
      url?: string | null
      coverUrl?: string | null
    }
  topics: Array<{
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }>
}

interface FeedProps {
  topic?: string
  collection?: string
  initialIdeas?: Idea[]
  initialHasMore?: boolean
  initialPage?: number
  initialTotal?: number
  onBookmark?: (ideaId: string) => void
  savedIdeaIds?: Set<string>
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
}: FeedProps) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchIdeas = async (pageNum: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '10',
      })

      if (topic) params.set('topic', topic)
      if (collection) params.set('collection', collection)

      const response = await fetch(`/api/feed?${params}`)
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
  }

  useEffect(() => {
    fetchIdeas(1)
  }, [topic, collection])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchIdeas(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, page])

  if (ideas.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Aucune idée trouvée</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          isBookmarked={savedIdeaIds.has(idea.id)}
          onBookmark={onBookmark}
        />
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

      {!hasMore && !loading && ideas.length > 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Fin du feed 🎉
        </p>
      )}
    </div>
  )
}
