'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SwipeableIdeaDetail } from '@/components/feed/swipeable-idea-detail'
import { toggleBookmarkAction } from '@/actions/bookmark-actions'
import { markIdeaViewedAction } from '@/actions/view-actions'

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

async function fetchRandomIdea(userId?: string, followed?: boolean): Promise<Idea | null> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams()
  if (userId) params.set('userId', userId)
  if (followed) params.set('followed', '1')
  
  const res = await fetch(`${baseUrl}/api/ideas/random?${params.toString()}`)
  if (!res.ok) {
    console.error('[au-hasard] fetch failed:', res.status, res.statusText)
    return null
  }
  const data = await res.json()
  return data.idea
}

export default function RandomIdeaClient() {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [followed, setFollowed] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFollowed(params.get('followed') === '1')
    
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session')
        if (res.ok) {
          const data = await res.json()
          if (data?.user?.id) {
            setUserId(data.user.id)
          }
        }
      } catch {
        // ignore
      }
    }
    checkSession()
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchRandomIdea(userId, followed).then((result) => {
      setIdea(result)
      if (result && userId) {
        markIdeaViewedAction(result.id, userId).catch((err) => {
          console.error('[au-hasard] markIdeaViewed error:', err)
        })
      }
    }).catch((err) => {
      console.error('[au-hasard] fetch error:', err)
      setError('Erreur de chargement')
    })
  }, [userId, followed])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const newIdea = await fetchRandomIdea(userId, followed)
      if (newIdea) {
        setIdea(newIdea)
        setIsBookmarked(false)
        if (userId) {
          markIdeaViewedAction(newIdea.id, userId).catch((err) => {
            console.error('[au-hasard] markIdeaViewed error:', err)
          })
        }
      } else {
        setError('Aucune idée disponible')
      }
    } catch {
      setError('Erreur de chargement')
    }
    setLoading(false)
  }, [loading, userId, followed])

  const handleBookmark = useCallback(async (ideaId: string) => {
    const result = await toggleBookmarkAction(ideaId)
    if ('bookmarked' in result && result.bookmarked !== undefined) {
      setIsBookmarked(result.bookmarked)
    }
  }, [])

  if (error && !idea) {
    return (
      <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
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
      <div className="mx-auto flex min-h-[60vh] w-full items-center justify-center px-0 py-4 pb-20 md:max-w-2xl md:p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement d&apos;une idée...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-full p-2 hover:bg-muted transition-colors disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <SwipeableIdeaDetail
        idea={idea}
        prev={null}
        next={null}
        onBookmark={handleBookmark}
        isBookmarked={isBookmarked}
        showNav={false}
      />
    </div>
  )
}
