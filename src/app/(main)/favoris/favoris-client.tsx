'use client'

import { useTransition, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface Idea {
  id: string
  title: string
  slug: string
  topics: Array<{
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }>
  source: {
    title: string
    type: string
    url: string | null
  }
}

export function FavorisClient({
  ideas,
  currentPage,
  totalPages,
  total,
}: {
  ideas: Idea[]
  userId?: string
  currentPage: number
  totalPages: number
  total: number
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const savedIdeaIds = useMemo(() => {
    const set = new Set(ideas.map(i => i.id))
    for (const [ideaId, isBookmarked] of Object.entries(optimisticBookmarks)) {
      if (isBookmarked) {
        set.add(ideaId)
      } else {
        set.delete(ideaId)
      }
    }
    return set
  }, [ideas, optimisticBookmarks])

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return ideas.filter(idea => idea.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(q))
  }, [ideas, searchQuery])

  const handleBookmark = useCallback(async (ideaId: string) => {
    if (isPending) return

    const currentlyBookmarked = savedIdeaIds.has(ideaId)
    const optimisticState = !currentlyBookmarked

    setOptimisticBookmarks(prev => ({ ...prev, [ideaId]: optimisticState }))

    startTransition(async () => {
      try {
        const result = await toggleBookmarkAction(ideaId)
        if (result.error) {
          console.error('[FAVORIS] Bookmark error:', result.error)
          setOptimisticBookmarks(prev => {
            const next = { ...prev }
            next[ideaId] = currentlyBookmarked
            return next
          })
        } else {
          setOptimisticBookmarks(prev => {
            const next = { ...prev }
            delete next[ideaId]
            return next
          })
          router.refresh()
        }
      } catch (err) {
        console.error('[FAVORIS] Bookmark failed:', err)
        setOptimisticBookmarks(prev => {
          const next = { ...prev }
          next[ideaId] = currentlyBookmarked
          return next
        })
      }
    })
  }, [isPending, savedIdeaIds, router])

  const pageUrl = (page: number) => {
    if (page === 1) return '/favoris'
    return `/favoris?page=${page}`
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher dans les favoris..."
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

      {searchQuery && filteredIdeas.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun favori pour "{searchQuery}"</p>
      )}

      {filteredIdeas.map((idea) => (
        <div key={idea.id} className="group relative">
          <CompactIdeaCard idea={{ ...idea, viewedAt: new Date().toISOString() }} />
          <button
            type="button"
            className="absolute right-2 top-2 z-10 rounded-full bg-card/90 p-1.5 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleBookmark(idea.id)
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={savedIdeaIds.has(idea.id) ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-colors ${savedIdeaIds.has(idea.id) ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </button>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={pageUrl(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              ← Précédent
            </Link>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={pageUrl(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {page}
              </Link>
            ))}
          </div>

          {currentPage < totalPages && (
            <Link
              href={pageUrl(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}

      {total > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {searchQuery
            ? `${filteredIdeas.length} résultat${filteredIdeas.length !== 1 ? 's' : ''} sur ${total} favori${total !== 1 ? 's' : ''}`
            : `Page ${currentPage} sur ${totalPages} · ${total} favori${total !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}
