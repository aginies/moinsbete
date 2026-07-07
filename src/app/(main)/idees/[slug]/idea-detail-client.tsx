'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ExternalLink, Bookmark, Share2 } from 'lucide-react'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'
import { isValidUrl } from '@/lib/utils'

interface IdeaDetailClientProps {
  idea: {
    id: string
    title: string
    content: string
    takeaway: string
    slug: string
    saviezVous: string | null
    source: {
      title: string
      type: string
      url: string | null
      coverUrl: string | null
    }
    topics: Array<{
      id: string
      name: string
      slug: string
      icon: string
      color: string
    }>
  }
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
  topic?: string
  collection?: string
  initialBookmarked: boolean
}

const SHARE_URL = (slug: string) => {
  if (typeof window === 'undefined') return `/idees/${slug}`
  return `${window.location.origin}/idees/${slug}`
}

export function IdeaDetailClient({
  idea,
  prev,
  next,
  topic,
  collection,
  initialBookmarked,
}: IdeaDetailClientProps) {
  const [isPending, startTransition] = useTransition()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)

  const handleBookmark = useCallback(async () => {
    if (isPending) return

    const newState = !bookmarked
    setBookmarked(newState)

    startTransition(async () => {
      try {
        await toggleBookmarkAction(idea.id)
      } catch {
        setBookmarked(prev => !prev)
      }
    })
  }, [isPending, bookmarked, idea.id])

  const handleShare = useCallback(async () => {
    const url = SHARE_URL(idea.slug)
    const shareData = {
      title: idea.title,
      text: idea.takeaway,
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [idea.slug, idea.title, idea.takeaway])

  const navigationUrl = (slug: string) => {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (collection) params.set('collection', collection)
    return `/idees/${slug}${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="hidden md:block">
      <div className="mx-auto w-full px-0 py-4 md:max-w-2xl md:p-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>

        <div className="mb-4 flex flex-wrap gap-2">
          {idea.topics.map((topicItem) => (
            <Link
              key={topicItem.id}
              href={`/sujets/${topicItem.slug}`}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: `${topicItem.color}15`,
                color: topicItem.color,
              }}
            >
              <span>{topicItem.icon}</span>
              <span>{topicItem.name}</span>
            </Link>
          ))}
        </div>

        {idea.source.coverUrl && (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <Image
              src={idea.source.coverUrl}
              alt={idea.title}
              width={800}
              height={400}
              className="h-64 w-full object-cover"
            />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-card/90 p-2 backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
            </button>
          </div>
        )}

        <h1 className="mb-4 text-2xl font-heading font-bold leading-tight flex items-center gap-3">
          {idea.title}
          <button
            type="button"
            className="shrink-0 rounded-full bg-card p-1.5 shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleBookmark}
          >
            <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
          </button>
          <button
            type="button"
            className="shrink-0 rounded-full bg-card p-1.5 shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </h1>

        <div className="prose prose-sm dark:prose-invert mb-6 max-w-none">
          <p className="text-base leading-relaxed text-foreground">{idea.content}</p>
        </div>

        <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
          <h3 className="mb-2 font-semibold text-primary">À retenir</h3>
          <p className="text-sm leading-relaxed text-foreground">{idea.takeaway}</p>
        </div>

        {idea.saviezVous && (
          <div className="mb-6 rounded-xl border border-amber-200/20 bg-amber-500/5 p-4 dark:border-amber-400/10">
            <h3 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
              Le saviez-vous ?
            </h3>
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              {idea.saviezVous}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Source</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{idea.source.title}</p>
              {idea.source.url && isValidUrl(idea.source.url) && (
                <a
                  href={idea.source.url.startsWith('http') ? idea.source.url : `https://${idea.source.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Voir la source complète
                </a>
              )}
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
          <div>
            {prev ? (
              <Link
                href={navigationUrl(prev.slug)}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm"
              >
                ← Précédent
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
                ← Précédent
              </span>
            )}
          </div>

          <div>
            {next ? (
              <Link
                href={navigationUrl(next.slug)}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm"
              >
                Suivant →
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
                Suivant →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
