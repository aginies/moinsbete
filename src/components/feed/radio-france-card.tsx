'use client'

import { useState, useCallback, useEffect } from 'react'
import { Lightbulb, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useShare } from './use-share'
import { ShareButton } from './share-button'
import { sanitizeUrl } from '@/lib/utils'

interface RadioFranceDoc {
  id: string
  title: string
  description: string
  url: string
  radio: string
  section: string
  image?: string
}

interface RadioFranceCardProps {
  initialDoc?: RadioFranceDoc
  userId?: string
}

interface FavoriteDoc {
  id: string
  title: string
  description: string
  url: string
  radio: string
  section: string
  image?: string
  favoritedAt: string
}

const FAVORITES_KEY = 'rf_favorites'
const VISIBILITY_KEY = 'radio_france_card_visible'

function getFavorites(): FavoriteDoc[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function toggleFavorite(doc: RadioFranceDoc, favorites: FavoriteDoc[]): { isFavorite: boolean; favorites: FavoriteDoc[] } {
  const exists = favorites.find(f => f.id === doc.id)

  if (exists) {
    const updated = favorites.filter(f => f.id !== doc.id)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
    return { isFavorite: false, favorites: updated }
  }

  const newFavorite: FavoriteDoc = {
    ...doc,
    favoritedAt: new Date().toISOString(),
  }
  const updated = [...favorites, newFavorite]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
  return { isFavorite: true, favorites: updated }
}

async function fetchRandomDoc(excludeId?: string): Promise<RadioFranceDoc | null> {
  try {
    const params = excludeId ? `?exclude=${excludeId}` : ''
    const res = await fetch(`/api/radio-france${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

export function RadioFranceCard({ initialDoc }: RadioFranceCardProps) {
  const [doc, setDoc] = useState<RadioFranceDoc | null>(initialDoc || null)
  const [loading, setLoading] = useState(!initialDoc)
  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(VISIBILITY_KEY)
      if (stored !== null) return stored === 'true'
    }
    return true
  })
  const [favorites, setFavorites] = useState<FavoriteDoc[]>(getFavorites)

  const isFavorite = doc ? favorites.some(f => f.id === doc.id) : false

  useEffect(() => {
    if (!doc) {
      fetchRandomDoc().then(d => {
        if (d) {
          setDoc(d)
        }
        setLoading(false)
      })
    }
  }, [doc])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const newDoc = await fetchRandomDoc(doc?.id)
    if (newDoc) {
      setDoc(newDoc)
    }
    setLoading(false)
  }, [loading, doc])

  const handleBookmark = useCallback(() => {
    if (!doc) return
    const result = toggleFavorite(doc, favorites)
    setFavorites(result.favorites)
  }, [doc, favorites])

  const handleToggle = useCallback(() => {
    setShow(prev => {
      const next = !prev
      localStorage.setItem(VISIBILITY_KEY, String(next))
      return next
    })
  }, [])

  const shareOptions = doc ? {
    title: doc.title,
    text: `${doc.description}\n\n${doc.radio} · ${doc.section}`,
    url: doc.url,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  if (!show) {
    return (
      <div className="mb-6">
        <button
          onClick={handleToggle}
          className="w-full rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 p-4 dark:border-rose-800 dark:bg-rose-950/20 hover:border-rose-400 hover:bg-rose-50 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-rose-700 dark:text-rose-400">
            <Lightbulb className="h-4 w-4" />
            <span>Afficher Documentaires Radio France</span>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="rounded-xl border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 p-5 dark:border-rose-700 dark:from-rose-950/30 dark:to-pink-950/30 hover:shadow-md transition-shadow">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-rose-800 dark:text-rose-300">
              Documentaires Radio France
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleToggle}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors"
              title="Masquer la carte"
            >
              <EyeOff className="h-4 w-4" />
            </button>
            <button
              onClick={handleRefresh}
              title="Changer de documentaire"
            >
              <RefreshCw className={`h-4 w-4 text-rose-600 dark:text-rose-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleBookmark}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            {shareOptions && (
              <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
            )}
          </div>
        </div>

        {doc && (
          <>
            {doc.image && (
              <div className="mb-3 overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800">
                <img
                  src={sanitizeUrl(doc.image, '')}
                  alt={doc.title}
                  className="w-full h-48 object-cover transition-opacity hover:opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}

            <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-2">
              {doc.title}
            </p>

            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                {doc.radio}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ml-2">
                {doc.section}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-rose-800 dark:text-rose-200 mb-3">
              {doc.description}
            </p>

            <Link
              href={sanitizeUrl(doc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
            >
              Écouter sur Radio France
              <ExternalLink className="h-3 w-3" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
