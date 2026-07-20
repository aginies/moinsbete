'use client'

import { useTransition, useMemo, useState, useCallback } from 'react'
import { Feed } from '@/components/feed/feed'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'
import type { Idea } from '@/types/idea'

interface HomePageClientProps {
  initialIdeas: Idea[]
  initialHasMore: boolean
  initialTotal: number
  userId?: string
  savedIdeaIds: string[]
}

export default function HomePageClient({ initialIdeas, initialHasMore, initialTotal, userId, savedIdeaIds }: HomePageClientProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<Record<string, boolean>>({})
  const [savedIdeaIdsState, setSavedIdeaIdsState] = useState<Set<string>>(new Set(savedIdeaIds))

  const bookmarkSet = useMemo(() => new Set(savedIdeaIdsState), [savedIdeaIdsState])

  const combinedSavedIds = useMemo(() => {
    const set = new Set(savedIdeaIdsState)
    for (const [ideaId, isBookmarked] of Object.entries(optimisticBookmarks)) {
      if (isBookmarked) {
        set.add(ideaId)
      } else {
        set.delete(ideaId)
      }
    }
    return set
  }, [savedIdeaIdsState, optimisticBookmarks])

  const handleBookmark = useCallback(async (ideaId: string) => {
    if (isPending) return

    const currentlyBookmarked = bookmarkSet.has(ideaId)
    const optimisticState = !currentlyBookmarked

    setOptimisticBookmarks(prev => ({ ...prev, [ideaId]: optimisticState }))

    startTransition(async () => {
      try {
        const result = await toggleBookmarkAction(ideaId)
        if (result.error) {
          console.error('Bookmark error:', result.error)
          setOptimisticBookmarks(prev => {
            const next = { ...prev }
            next[ideaId] = currentlyBookmarked
            return next
          })
        } else {
          setSavedIdeaIdsState(prev => {
            const next = new Set(prev)
            if (optimisticState) {
              next.add(ideaId)
            } else {
              next.delete(ideaId)
            }
            return next
          })
        }
      } catch (err) {
        console.error('Bookmark failed:', err)
        setOptimisticBookmarks(prev => {
          const next = { ...prev }
          next[ideaId] = currentlyBookmarked
          return next
        })
      }
    })
  }, [isPending, bookmarkSet])

  return (
    <Feed
      initialIdeas={initialIdeas}
      initialHasMore={initialHasMore}
      initialTotal={initialTotal}
      onBookmark={handleBookmark}
      userId={userId}
      savedIdeaIds={combinedSavedIds}
    />
  )
}
