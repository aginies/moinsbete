'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ExternalLink, Bookmark, Share2, Sparkles, Lightbulb } from 'lucide-react'
import { isValidUrl } from '@/lib/utils'

interface Idea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
  saviezVous?: string | null
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

interface SwipeableIdeaDetailProps {
  idea: Idea
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
  topic?: string
  collection?: string
  onBookmark?: (ideaId: string) => void
  isBookmarked?: boolean
  showNav?: boolean
  mobileOnly?: boolean
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
}: SwipeableIdeaDetailProps) {
  const router = useRouter()
  const [dragX, setDragX] = useState(0)
  const [hint, setHint] = useState<'prev' | 'next' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragXRef = useRef(dragX)

  useEffect(() => {
    dragXRef.current = dragX
  }, [dragX])

  const getShareUrl = (slug: string) => `${window.location.origin}/idees/${slug}`

const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareData = {
      title: idea.title,
      text: idea.takeaway,
      url: getShareUrl(idea.slug),
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
        await navigator.clipboard.writeText(getShareUrl(idea.slug))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard write failed
      }
    }
  }, [idea.title, idea.slug])

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDragging) return

    setBookmarked(prev => !prev)
    if (onBookmark) {
      onBookmark(idea.id)
    }
  }, [isDragging, onBookmark, idea.id])

  const bind = useGesture(
    {
      onDragStart: () => {
        setIsDragging(true)
        const el = containerRef.current
        if (el) {
          el.style.userSelect = 'none'
          el.style.touchAction = 'pan-y'
        }
        dragStartRef.current = { x: 0, y: 0 }
      },
      onDrag: (state: any) => {
        const { first, movement } = state
        if (!first) {
          const [dx] = movement
          setDragX(dx)
          if (dx > 50) setHint('prev')
          else if (dx < -50) setHint('next')
          else setHint(null)
        }
      },
      onDragEnd: (state: any) => {
        setIsDragging(false)
        const el = containerRef.current
        if (el) {
          el.style.userSelect = ''
          el.style.touchAction = ''
        }
        dragStartRef.current = null

        const [dx] = state.movement
        if (dx > 100 && prev) {
          router.push(`/idees/${prev.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
        } else if (dx < -100 && next) {
          router.push(`/idees/${next.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
        } else {
          setDragX(0)
          setHint(null)
        }
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
      }
    }
  , [idea.id, prev, next, topic, collection, router])

  useEffect(() => {
    setBookmarked(initialBookmarked || false)
  }, [initialBookmarked])

  useEffect(() => {
    setDragX(0)
    setHint(null)
  }, [idea.id])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && prev) {
      router.push(`/idees/${prev.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
    } else if (e.key === 'ArrowRight' && next) {
      router.push(`/idees/${next.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)
    }
  }, [prev, next, topic, collection, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const effectiveX = dragX
  const absX = Math.abs(effectiveX)
  const rotation = effectiveX * 0.04
  const scale = 1 - absX * 0.0003

  const prevHintOpacity = hint === 'prev' ? Math.min(absX / 100, 1) : 0
  const nextHintOpacity = hint === 'next' ? Math.min(absX / 100, 1) : 0

  return (
    <div className={`mx-auto w-full px-0 py-4 pb-24 ${mobileOnly ? 'md:hidden' : ''}`}>
      <div className="px-4">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div className="relative touch-pan-y" ref={containerRef} {...bind()}>
        {/* Prev hint overlay */}
        {prevHintOpacity > 0 && (
          <div
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
            style={{ opacity: prevHintOpacity }}
          >
            ← Précédent
          </div>
        )}

        {/* Next hint overlay */}
        {nextHintOpacity > 0 && (
          <div
            className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
            style={{ opacity: nextHintOpacity }}
          >
            Suivant →
          </div>
        )}

        <div
          className={prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'}
          style={{
            transform: `translateX(${effectiveX}px) rotate(${rotation}deg) scale(${scale})`,
          }}
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
            <div className="px-5">
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
                </div>
              </div>
            </div>

            {/* Navigation */}
            {showNav && (
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <div className="flex-1">
                  {prev ? (
                    <button
                      onClick={() => router.push(`/idees/${prev.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)}
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
                      onClick={() => router.push(`/idees/${next.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)}
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
