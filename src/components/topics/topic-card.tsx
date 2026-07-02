import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Topic } from '@/generated/client'

interface TopicCardProps {
  topic: Topic & {
    _count?: { ideas: number }
    children?: Topic[]
  }
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link
      href={`/sujets/${topic.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl">{topic.icon}</span>
        <div>
          <h3 className="font-heading font-semibold text-foreground group-hover:text-primary">
            {topic.name}
          </h3>
        </div>
      </div>

      {topic.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {topic.description}
        </p>
      )}

      {topic.children && topic.children.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {topic.children.slice(0, 3).map((child) => (
            <span
              key={child.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground"
            >
              {child.icon} {child.name}
            </span>
          ))}
          {topic.children.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{topic.children.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
