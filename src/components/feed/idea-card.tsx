'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Bookmark, ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Bookmark as BookmarkType } from '@/generated/prisma'

interface IdeaCardProps {
  idea: {
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
  isBookmarked?: boolean
  onBookmark?: (ideaId: string) => void
}

export function IdeaCard({ idea, isBookmarked: initialBookmarked, onBookmark }: IdeaCardProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onBookmark) {
      setBookmarked(!bookmarked)
      return
    }

    await onBookmark(idea.id)
    setBookmarked(!bookmarked)
  }

  const topicColors: Record<string, string> = {}
  idea.topics.forEach(t => {
    topicColors[t.id] = t.color
  })

  return (
    <Link href={`/idees/${idea.slug}`} className="block">
      <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md">
        {idea.source.coverUrl && (
          <div className="mb-3 overflow-hidden rounded-xl">
            <Image
              src={idea.source.coverUrl}
              alt={idea.title}
              width={600}
              height={200}
              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {idea.topics.map((topic) => (
            <span
              key={topic.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${topic.color}15`,
                color: topic.color,
              }}
            >
              <span>{topic.icon}</span>
              <span>{topic.name}</span>
            </span>
          ))}
        </div>

        <h3 className="mb-2 text-lg font-heading font-semibold leading-tight text-foreground group-hover:text-primary">
          {idea.title}
        </h3>

        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {idea.content}
        </p>

        <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground">
          <span className="font-medium">À retenir: </span>
          {idea.takeaway}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{idea.source.title}</span>
            {idea.source.url && (
              <span
                className="inline-flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Source</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBookmark}
            >
              <Bookmark
                className={`h-4 w-4 ${
                  bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'
                }`}
              />
            </Button>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </article>
    </Link>
  )
}
