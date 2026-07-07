'use client'

import { useState } from 'react'
import { Feed } from '@/components/feed/feed'

interface FeedIdea {
  id: string
  [key: string]: unknown
}

interface MonPlanFeedProps {
  initialIdeas: FeedIdea[]
  userId: string
}

export function MonPlanFeed({ initialIdeas, userId }: MonPlanFeedProps) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const handleRemove = (ideaId: string) => {
    setRemovedIds(prev => new Set(prev).add(ideaId))
    setIdeas(prev => prev.filter(idea => (idea as { id: string }).id !== ideaId))
  }

  return (
    <Feed
      initialIdeas={ideas as any}
      initialHasMore={false}
      userId={userId}
      compact
      onRemove={handleRemove}
    />
  )
}
