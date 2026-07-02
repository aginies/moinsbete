'use client'

import { useTransition, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Feed } from '@/components/feed/feed'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'

export function FavorisClient({ ideas, userId }: { ideas: any[], userId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<Record<string, boolean>>({})

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

  const handleBookmark = useCallback(async (ideaId: string) => {
    if (isPending) return

    const currentlyBookmarked = savedIdeaIds.has(ideaId)
    const optimisticState = !currentlyBookmarked

    console.log(`[FAVORIS] Toggle bookmark: idea=${ideaId}, wasBookmarked=${currentlyBookmarked}, optimistic=${optimisticState}`)
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
          console.log('[FAVORIS] Bookmark success:', result)
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

  return (
    <Feed
      initialIdeas={ideas}
      initialHasMore={false}
      onBookmark={handleBookmark}
      savedIdeaIds={savedIdeaIds}
      userId={userId}
    />
  )
}
