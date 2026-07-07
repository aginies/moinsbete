import { Topic } from '@/generated/client'
import { TopicCard } from './topic-card'
import React from 'react'

interface TopicGridProps {
  topics: Array<{ id: string } & Topic>
  followedIds?: string[]
  onToggle?: (topicId: string, isFollowing: boolean) => void
  isAuthenticated?: boolean
}

export const TopicGrid = React.memo(function TopicGrid({ topics, followedIds = [], onToggle, isAuthenticated }: TopicGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const isFollowing = followedIds.includes(topic.id)
        return (
          <TopicCard
            key={topic.id}
            topic={topic}
            isFollowing={isFollowing}
            onToggle={() => onToggle?.(topic.id, isFollowing)}
            isAuthenticated={isAuthenticated}
          />
        )
      })}
    </div>
  )
})
