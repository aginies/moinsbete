'use client'

import { useTransition, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Feed } from '@/components/feed/feed'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'

interface HomePageClientProps {
  initialIdeas: any[]
  initialHasMore: boolean
  initialTotal: number
  userId?: string
  savedIdeaIds: string[]
}

export default function HomePageClient({ initialIdeas, initialHasMore, initialTotal, userId, savedIdeaIds }: HomePageClientProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<Record<string, boolean>>({})

  const bookmarkSet = useMemo(() => new Set(savedIdeaIds), [savedIdeaIds])

  const combinedSavedIds = useMemo(() => {
    const set = new Set(savedIdeaIds)
    for (const [ideaId, isBookmarked] of Object.entries(optimisticBookmarks)) {
      if (isBookmarked) {
        set.add(ideaId)
      } else {
        set.delete(ideaId)
      }
    }
    return set
  }, [savedIdeaIds, optimisticBookmarks])

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
          setOptimisticBookmarks(prev => {
            const next = { ...prev }
            delete next[ideaId]
            return next
          })
          router.refresh()
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
  }, [isPending, bookmarkSet, router])

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
