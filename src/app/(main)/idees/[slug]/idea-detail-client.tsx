'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ExternalLink, Bookmark, Share2, Clock, Sparkles, Lightbulb } from 'lucide-react'
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

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // Clipboard write failed
      }
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
      <div className="mx-auto w-full px-6 py-8 md:max-w-3xl md:p-8">
        {/* Breadcrumb back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        {/* Topics */}
        <div className="mb-6 flex flex-wrap gap-2">
          {idea.topics.map((topicItem) => (
            <Link
              key={topicItem.id}
              href={`/sujets/${topicItem.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all hover:shadow-md hover:opacity-90"
              style={{
                backgroundColor: `${topicItem.color}18`,
                color: topicItem.color,
                border: `1px solid ${topicItem.color}30`,
              }}
            >
              <span className="text-base">{topicItem.icon}</span>
              <span>{topicItem.name}</span>
            </Link>
          ))}
        </div>

        {/* Cover image */}
        {idea.source.coverUrl && (
          <div className="relative mb-8 overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={idea.source.coverUrl}
              alt={idea.title}
              width={800}
              height={400}
              className="h-72 w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2.5 backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-primary text-primary' : 'text-slate-600'}`} />
            </button>
          </div>
        )}

        {/* Title area */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {idea.title}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-border/60 bg-card p-2 shadow-sm transition-all hover:bg-muted hover:shadow-md"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
            <button
              type="button"
              className="rounded-full border border-border/60 bg-card p-2 shadow-sm transition-all hover:bg-muted hover:shadow-md"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
            <span className="ml-2 text-xs text-muted-foreground">
              <Clock className="inline h-3.5 w-3.5 mr-1" />
              {Math.ceil(idea.content.length / 500)} min de lecture
            </span>
          </div>
        </div>

        {/* Content section */}
        <div className="mb-8">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6 md:p-8">
            <div className="max-w-none prose prose-base dark:prose-invert">
              <p className="text-lg leading-relaxed text-foreground/90 md:text-[1.05rem]">
                {idea.content}
              </p>
            </div>
          </div>
        </div>

        {/* Takeaway - highlighted */}
        <div className="mb-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-primary">À retenir</h3>
          </div>
          <p className="text-base leading-relaxed text-foreground/90 md:text-lg">
            {idea.takeaway}
          </p>
        </div>

        {/* Saviez-vous */}
        {idea.saviezVous && (
          <div className="mb-8 rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 dark:border-amber-400/10 dark:from-amber-950/20 dark:to-amber-900/10">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-amber-700 dark:text-amber-400">
                Le saviez-vous ?
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
              {idea.saviezVous}
            </p>
          </div>
        )}

        {/* Source */}
        <div className="mb-8 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Source
          </h3>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-foreground">{idea.source.title}</p>
              {idea.source.url && isValidUrl(idea.source.url) && (
                <a
                  href={idea.source.url.startsWith('http') ? idea.source.url : `https://${idea.source.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir la source complète
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-8">
          <div className="flex-1">
            {prev ? (
              <Link
                href={navigationUrl(prev.slug)}
                className="group inline-flex w-full flex-col items-start gap-1 rounded-xl border border-border/40 bg-card px-5 py-4 text-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground group-hover:text-primary/70">← Précédent</span>
              </Link>
            ) : (
              <div className="inline-flex w-full flex-col items-start gap-1 rounded-xl border border-border/20 bg-card/30 px-5 py-4">
                <span className="text-xs text-muted-foreground/30">← Précédent</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            {next ? (
              <Link
                href={navigationUrl(next.slug)}
                className="group inline-flex w-full flex-col items-end gap-1 rounded-xl border border-border/40 bg-card px-5 py-4 text-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground group-hover:text-primary/70">Suivant →</span>
              </Link>
            ) : (
              <div className="inline-flex w-full flex-col items-end gap-1 rounded-xl border border-border/20 bg-card/30 px-5 py-4">
                <span className="text-xs text-muted-foreground/30">Suivant →</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
