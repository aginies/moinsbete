'use client'

import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { useState, useCallback } from 'react'
import { Bookmark, ExternalLink, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

const IdeaCardInner = ({ idea, isBookmarked: initialBookmarked, onBookmark }: IdeaCardProps) => {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)

  const handleCardClick = useCallback(() => {
    router.push(`/idees/${idea.slug}`)
  }, [router, idea.slug])

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onBookmark) {
      setBookmarked(prev => !prev)
      return
    }

    setBookmarked(prev => !prev)
    onBookmark(idea.id)
  }, [onBookmark, idea.id])

  return (
    <div
      className="block cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
    >
      <article className="group relative rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full bg-card/90 p-1.5 backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleBookmark}
        >
          <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
        </button>

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
          {idea.source.url && (
            <Link
              href={idea.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">Source</span>
            </Link>
          )}

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </article>
    </div>
  )
}

export const IdeaCard = React.memo(IdeaCardInner)

interface CompactIdeaCardProps {
  idea: {
    id: string
    title: string
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
    viewedAt: string
  }
}

const CompactIdeaCardInner = ({ idea }: CompactIdeaCardProps) => {
  return (
    <Link href={`/idees/${idea.slug}`} className="block">
      <article className="rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-border hover:bg-muted/30">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {idea.topics.map((topic) => (
            <span
              key={topic.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
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

        <h3 className="text-sm font-semibold leading-tight text-foreground hover:text-primary">
          {idea.title}
        </h3>
      </article>
    </Link>
  )
}

export const CompactIdeaCard = React.memo(CompactIdeaCardInner)
