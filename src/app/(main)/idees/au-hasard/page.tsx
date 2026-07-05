'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ExternalLink, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Idea {
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

async function fetchRandomIdea(): Promise<Idea | null> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const res = await fetch(`${baseUrl}/api/ideas/random`)
  if (!res.ok) {
    console.error('[au-hasard] fetch failed:', res.status, res.statusText)
    return null
  }
  const data = await res.json()
  console.log('[au-hasard] API response:', data)
  return data.idea
}

export default function RandomIdeaClient() {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchRandomIdea().then((result) => {
      console.log('[au-hasard] fetch result:', result)
      setIdea(result)
    }).catch((err) => {
      console.error('[au-hasard] fetch error:', err)
      setError('Erreur de chargement')
    })
  }, [])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const newIdea = await fetchRandomIdea()
      if (newIdea) {
        setIdea(newIdea)
      } else {
        setError('Aucune idée disponible')
      }
    } catch {
      setError('Erreur de chargement')
    }
    setLoading(false)
  }, [loading])

  const bind = useGesture(
    {
      onDragStart: () => {
        setIsDragging(true)
      },
      onDrag: (state: any) => {
        const [dx] = state.movement
        setDragX(dx)
      },
      onDragEnd: (state: any) => {
        setIsDragging(false)
        const [dx] = state.movement
        if (Math.abs(dx) > 100) {
          handleRefresh()
        }
        setDragX(0)
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
      }
    }
  )

  if (error && !idea) {
    return (
      <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{error}</h1>
            <Link href="/" className="mt-4 text-primary hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 pb-20 md:p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement d&apos;une idée...</p>
        </div>
      </div>
    )
  }

  const rotation = dragX * 0.04
  const scale = 1 - Math.abs(dragX) * 0.0003

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <div className="px-4">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>

        <div className="mb-4 flex flex-wrap gap-2">
          {idea.topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/sujets/${topic.slug}`}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: `${topic.color}15`,
                color: topic.color,
              }}
            >
              <span>{topic.icon}</span>
              <span>{topic.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {idea.source.coverUrl && (
        <div className="mb-4 overflow-hidden rounded-none md:rounded-xl">
          <Image
            src={idea.source.coverUrl}
            alt={idea.title}
            width={800}
            height={400}
            className="h-64 w-full object-cover"
          />
        </div>
      )}

      <div className="px-0 md:px-0">
        <div
          {...bind()}
          className={cn(
            "relative cursor-pointer rounded-none border-x-0 border-y bg-card p-6 shadow-sm transition-all md:rounded-2xl md:border-x md:border-y hover:border-border hover:shadow-md touch-pan-y select-none",
            loading && "opacity-50",
            !isDragging && "transition-all duration-200 ease-out"
          )}
          style={{
            transform: `translateX(${dragX}px) rotate(${rotation}deg) scale(${scale})`,
          }}
          onClick={handleRefresh}
        >
          <div className="absolute -top-3 -right-3 z-10 md:block hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 shadow-md">
              <RefreshCw className={cn("h-5 w-5 text-white", loading && "animate-spin")} />
            </div>
          </div>

          <h1 className="mb-4 text-2xl font-heading font-bold leading-tight md:pr-12">
            {idea.title}
          </h1>

          <div className="prose prose-sm dark:prose-invert mb-6 max-w-none">
            <p className="text-base leading-relaxed text-foreground">{idea.content}</p>
          </div>

          <div className="mb-4 rounded-xl border border-border/40 bg-muted/30 p-4">
            <h3 className="mb-2 font-semibold text-primary">À retenir</h3>
            <p className="text-sm leading-relaxed text-foreground">{idea.takeaway}</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0 mt-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Source</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{idea.source.title}</p>
              {idea.source.url && (
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
    </div>
  )
}
