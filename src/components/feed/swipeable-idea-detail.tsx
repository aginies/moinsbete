'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ExternalLink, Bookmark, Share2, Sparkles, Lightbulb } from 'lucide-react'
import { isValidUrl, sanitizeUrl } from '@/lib/utils'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { useShare } from './use-share'
import type { Idea } from '@/types/idea'

interface SwipeableIdeaDetailProps {
  idea: Idea
  prev: Idea | null
  next: Idea | null
  topic?: string
  collection?: string
  onBookmark?: (ideaId: string) => void
  isBookmarked?: boolean
  showNav?: boolean
  mobileOnly?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

function IdeaCardContent({ idea }: { idea: Idea }) {
  return (
    <>
      {/* Cover image */}
      {idea.source.coverUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={idea.source.coverUrl}
            alt={idea.title}
            width={800}
            height={400}
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      )}

      {/* Topics */}
      <div className="mb-3 flex flex-wrap gap-1.5 px-5 pt-4">
        {idea.topics.map((topicItem) => (
          <Link
            key={topicItem.id}
            href={`/sujets/${topicItem.slug}`}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: `${topicItem.color}18`,
              color: topicItem.color,
              border: `1px solid ${topicItem.color}30`,
            }}
          >
            <span>{topicItem.icon}</span>
            <span>{topicItem.name}</span>
          </Link>
        ))}
      </div>

      {/* Title */}
      <h1 className="mb-3 px-5 text-xl font-bold leading-tight md:text-2xl">
        {idea.title}
      </h1>

      {/* Content */}
      <div className="px-5 pb-5">
        <div className="mb-4 rounded-xl border border-border/30 bg-card/60 p-4 md:p-5">
          <p className="text-sm leading-relaxed text-foreground/90 md:text-base">
            {idea.content}
          </p>
        </div>

        {/* Takeaway */}
        <div className="mb-4 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 md:p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-primary md:text-base">À retenir</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 md:text-base">
            {idea.takeaway}
          </p>
        </div>

        {/* Saviez-vous */}
        {idea.saviezVous && (
          <div className="mb-4 rounded-xl border border-amber-200/30 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 dark:border-amber-400/10 dark:from-amber-950/20 dark:to-amber-900/10">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Le saviez-vous ?
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              {idea.saviezVous}
            </p>
          </div>
        )}

        {/* Source */}
        <div className="rounded-xl border border-border/30 bg-card/60 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Source
          </h3>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{idea.source.title}</p>
              {idea.source.url && isValidUrl(idea.source.url) && (
                <a
                  href={sanitizeUrl(idea.source.url, idea.source.url?.startsWith('http') ? idea.source.url : `https://${idea.source.url}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Voir la source complète
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function SwipeableIdeaDetail({
  idea,
  prev,
  next,
  topic,
  collection,
  onBookmark,
  isBookmarked: initialBookmarked,
  showNav = true,
  mobileOnly = false,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableIdeaDetailProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)

  const getShareUrl = useCallback((slug: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/idees/${slug}`, [])

  const shareOptions = {
    title: idea.title,
    text: idea.takeaway,
    url: getShareUrl(idea.slug),
  }
  const { share: handleShare, copied } = useShare(shareOptions)

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setBookmarked(prevVal => !prevVal)
    if (onBookmark) {
      onBookmark(idea.id)
    }
  }, [onBookmark, idea.id])

  const navigateToPrev = useCallback(() => {
    router.push(`/idees/${prev?.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
  }, [prev, topic, collection, router])

  const navigateToNext = useCallback(() => {
    router.push(`/idees/${next?.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
  }, [next, topic, collection, router])

  const {
    bind,
    containerRef,
    dragX,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
    prevHintOpacity,
    nextHintOpacity,
  } = useSwipeGesture({
    onSwipeLeft: onSwipeLeft || (next ? navigateToNext : undefined),
    onSwipeRight: onSwipeRight || (prev ? navigateToPrev : undefined),
    resetDep: idea.id,
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarked(initialBookmarked || false)
  }, [initialBookmarked])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && prev) {
      navigateToPrev()
    } else if (e.key === 'ArrowRight' && next) {
      navigateToNext()
    }
  }, [prev, next, navigateToPrev, navigateToNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const absX = Math.abs(dragX)

  // Background card selection:
  // - Show prev if dragging right (dragX > 0)
  // - Show next if dragging left (dragX < 0)
  // - Default to next (or prev if next is null) when static
  const backgroundCard = dragX > 0 ? prev : (dragX < 0 ? next : next || prev)
  const bgScale = Math.min(0.95 + (absX / 1000) * 0.05, 1)
  const bgOpacity = Math.min(0.5 + (absX / 200) * 0.5, 1)

  return (
    <div className={`mx-auto w-full px-0 py-4 pb-24 ${mobileOnly ? 'md:hidden' : ''}`}>
      <div className="px-4">
        <Link
          href="/"
          className="mb-4 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div key={idea.id} className="relative touch-pan-y" ref={containerRef} {...bind()}>
        {/* Prev hint overlay */}
        {prevHintOpacity > 0 && (
          <div
            className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
            style={{ opacity: prevHintOpacity }}
          >
            ← Précédent
          </div>
        )}

        {/* Next hint overlay */}
        {nextHintOpacity > 0 && (
          <div
            className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
            style={{ opacity: nextHintOpacity }}
          >
            Suivant →
          </div>
        )}

        {/* Background Card */}
        {backgroundCard && (
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out z-0"
            style={{
              transform: `scale(${bgScale})`,
              opacity: bgOpacity,
            }}
          >
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden h-full opacity-60">
              <IdeaCardContent idea={backgroundCard} />
            </div>
          </div>
        )}

        {/* Active Card */}
        <div
          className={`relative z-10 ${isDragging || prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'}`}
          style={swipeStyle}
        >
          <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-card/90 p-2 backdrop-blur-sm transition-all shadow-sm hover:bg-muted hover:text-foreground"
                onClick={handleBookmark}
              >
                <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
              </button>
              <button
                type="button"
                className="rounded-full bg-card/90 p-2 backdrop-blur-sm transition-all shadow-sm hover:bg-muted hover:text-foreground"
                onClick={handleShare}
              >
                <Share2 className={`h-5 w-5 transition-colors ${copied ? 'text-green-500' : 'text-muted-foreground'}`} />
              </button>
            </div>

            {copied && (
              <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-green-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
                Copié !
              </div>
            )}

            <IdeaCardContent idea={idea} />

            {/* Navigation */}
            {showNav && (
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <div className="flex-1">
                  {prev ? (
                    <button
                      onClick={navigateToPrev}
                      className="group inline-flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-xs transition-all hover:bg-muted/50"
                      aria-label="Voir l'idée précédente"
                    >
                      <span className="text-[10px] text-muted-foreground/60 group-hover:text-primary/70">← Précédent</span>
                    </button>
                  ) : (
                    <div className="inline-flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-muted-foreground/30">← Précédent</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {next ? (
                    <button
                      onClick={navigateToNext}
                      className="group inline-flex w-full flex-col items-end gap-0.5 rounded-lg px-3 py-2 text-xs transition-all hover:bg-muted/50"
                      aria-label="Voir l'idée suivante"
                    >
                      <span className="text-[10px] text-muted-foreground/60 group-hover:text-primary/70">Suivant →</span>
                    </button>
                  ) : (
                    <div className="inline-flex w-full flex-col items-end gap-0.5 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-muted-foreground/30">Suivant →</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
