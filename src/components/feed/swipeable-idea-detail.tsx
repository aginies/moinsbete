'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ExternalLink, Bookmark, Share2, MessageCircle } from 'lucide-react'
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
}

export function SwipeableIdeaDetail({
  idea,
  prev,
  next,
  topic,
  collection,
  onBookmark,
  isBookmarked: initialBookmarked,
}: SwipeableIdeaDetailProps) {
  const router = useRouter()
  const [dragX, setDragX] = useState(0)
  const [hint, setHint] = useState<'prev' | 'next' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const getShareUrl = (slug: string) => `${window.location.origin}/idees/${slug}`
const getSharePath = (slug: string) => `/idees/${slug}`

const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareData = {
      title: idea.title,
      text: idea.takeaway,
      url: getShareUrl(idea.slug),
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(getShareUrl(idea.slug))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
  )

  useEffect(() => {
    setBookmarked(initialBookmarked || false)
  }, [initialBookmarked])

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
    <div className="mx-auto w-full px-0 py-4 pb-24 md:hidden">
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
          <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-card/90 p-1.5 backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
                onClick={handleBookmark}
              >
                <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
              </button>
              <button
                type="button"
                className="rounded-full bg-card/90 p-1.5 backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Topics */}
            <div className="mb-4 flex flex-wrap gap-2 px-5 pt-5">
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

            {/* Cover image */}
            {idea.source.coverUrl && (
              <div className="mb-4 overflow-hidden rounded-t-2xl">
                <Image
                  src={idea.source.coverUrl}
                  alt={idea.title}
                  width={800}
                  height={400}
                  className="h-56 w-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="mb-4 px-5 text-2xl font-heading font-bold leading-tight">
              {idea.title}
            </h1>

            {/* Content */}
            <div className="px-5">
              <div className="prose prose-sm dark:prose-invert mb-6 max-w-none">
                <p className="text-base leading-relaxed text-foreground">{idea.content}</p>
              </div>

              {/* Takeaway */}
              <div className="mb-4 rounded-xl border border-border/60 bg-card p-5">
                <h3 className="mb-2 font-semibold text-primary">À retenir</h3>
                <p className="text-sm leading-relaxed text-foreground">{idea.takeaway}</p>
              </div>

              {/* Saviez-vous */}
              {idea.saviezVous && (
                <div className="mb-4 rounded-xl border border-amber-200/20 bg-amber-500/5 p-4 dark:border-amber-400/10">
                  <h3 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                    💡 Le saviez-vous ?
                  </h3>
                  <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                    {idea.saviezVous}
                  </p>
                </div>
              )}

              {/* Source */}
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
            </div>

            {/* Social share buttons */}
            <div className="px-5 pb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${idea.title} — ${idea.takeaway}`)}%20${encodeURIComponent(getSharePath(idea.slug))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-border/40 px-5 py-3">
              <div className="flex items-center gap-2">
                {prev ? (
                  <button
                    onClick={() => router.push(`/idees/${prev.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    aria-label="Voir l'idée précédente"
                  >
                    ← Précédent
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground/30">← Précédent</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {next ? (
                  <button
                    onClick={() => router.push(`/idees/${next.slug}${topic ? `?topic=${topic}` : collection ? `?collection=${collection}` : ''}`)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    aria-label="Voir l'idée suivante"
                  >
                    Suivant →
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground/30">Suivant →</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
