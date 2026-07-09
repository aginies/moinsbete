'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { toggleRadioFavoriteAction, getRadioFavoritesAction } from '@/actions/radio-bookmark-actions'

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

function getFavorites(): FavoriteDoc[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function removeFavorite(docId: string): FavoriteDoc[] {
  const favorites = getFavorites().filter(f => f.id !== docId)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  return favorites
}

interface RadioFranceFavoritesProps {
  userId?: string
}

export function RadioFranceFavorites({ userId }: RadioFranceFavoritesProps) {
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMigrated, setHasMigrated] = useState(false)

  useEffect(() => {
    async function loadFavorites() {
      if (userId) {
        try {
          const result = await getRadioFavoritesAction()
          setFavorites(result.favorites || [])
        } catch {
          setFavorites(getFavorites())
        }
      } else {
        setFavorites(getFavorites())
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId])

  useEffect(() => {
    if (userId && !hasMigrated && favorites.length === 0 && loading === false) {
      const localStorageFavorites = getFavorites()
      if (localStorageFavorites.length > 0) {
        fetch('/api/radio-favorites/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localStorageFavorites),
        }).then(() => {
          localStorage.removeItem(FAVORITES_KEY)
          setHasMigrated(true)
          setFavorites(localStorageFavorites)
        }).catch(() => {
          setFavorites(localStorageFavorites)
        })
      }
    }
  }, [userId, hasMigrated, loading, favorites.length])

  const handleRemove = useCallback(async (docId: string) => {
    if (userId) {
      try {
        await toggleRadioFavoriteAction(docId, 'remove')
        setFavorites(prev => prev.filter(f => f.id !== docId))
      } catch {
        const updated = removeFavorite(docId)
        setFavorites(updated)
      }
    } else {
      const updated = removeFavorite(docId)
      setFavorites(updated)
    }
  }, [userId])

  if (favorites.length === 0) return null

  return (
    <div className="mb-8">
      <div className="space-y-3">
        {favorites.map((doc) => (
          <div
            key={doc.id}
            className="group relative rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4 dark:border-purple-800 dark:from-purple-950/20 dark:to-violet-950/20 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {doc.image && (
                <div className="mb-2 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800">
                  <img
                    src={sanitizeUrl(doc.image, '')}
                    alt={doc.title}
                    loading="lazy"
                    className="w-full h-32 object-cover transition-opacity hover:opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                {doc.title}
              </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 line-clamp-2">
                  {doc.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {doc.radio}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {doc.section}
                  </span>
                </div>
                <Link
                  href={sanitizeUrl(doc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline"
                >
                  Ecouter sur Radio France
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <button
                onClick={() => handleRemove(doc.id)}
                className="rounded-full p-1.5 text-purple-600 opacity-60 hover:opacity-100 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-900/40 transition-all"
                title="Retirer des favoris"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
