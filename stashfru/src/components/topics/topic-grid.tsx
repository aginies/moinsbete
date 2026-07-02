import Link from 'next/link'
import { Topic } from '@/generated/prisma'
import { TopicCard } from './topic-card'

interface TopicGridProps {
  topics: Topic[]
}

export function TopicGrid({ topics }: TopicGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  )
}
