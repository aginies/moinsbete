'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils'
import { toggleCnrsFavoriteAction, getCnrsFavoritesAction } from '@/actions/cnrs-bookmark-actions'

export interface CnrsFavoriteDoc {
  id: string
  title: string
  category: string
  imageUrl: string | undefined
  link: string
  date: string
  favoritedAt: string
}

const CNRS_FAVORITES_KEY = 'cnrs_favorites'

function getCnrsFavoritesFromStorage(): CnrsFavoriteDoc[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CNRS_FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function removeCnrsFavorite(articleLink: string): CnrsFavoriteDoc[] {
  const favorites = getCnrsFavoritesFromStorage().filter(f => f.link !== articleLink)
  localStorage.setItem(CNRS_FAVORITES_KEY, JSON.stringify(favorites))
  return favorites
}

interface CnrsBookmarksProps {
  userId?: string
}

export function CnrsBookmarks({ userId }: CnrsBookmarksProps) {
  const [favorites, setFavorites] = useState<CnrsFavoriteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMigrated, setHasMigrated] = useState(false)

  useEffect(() => {
    async function loadFavorites() {
      if (userId) {
        try {
          const result = await getCnrsFavoritesAction()
          setFavorites(result.favorites || [])
        } catch {
          setFavorites(getCnrsFavoritesFromStorage())
        }
      } else {
        setFavorites(getCnrsFavoritesFromStorage())
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId])

  useEffect(() => {
    if (userId && !hasMigrated && favorites.length === 0 && loading === false) {
      const localStorageFavorites = getCnrsFavoritesFromStorage()
      if (localStorageFavorites.length > 0) {
        fetch('/api/cnrs-favorites/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localStorageFavorites),
        }).then(() => {
          localStorage.removeItem(CNRS_FAVORITES_KEY)
          setHasMigrated(true)
          setFavorites(localStorageFavorites)
        }).catch(() => {
          setFavorites(localStorageFavorites)
        })
      }
    }
  }, [userId, hasMigrated, loading, favorites.length])

  const handleRemove = useCallback(async (articleLink: string) => {
    if (userId) {
      try {
        await toggleCnrsFavoriteAction(articleLink, 'remove')
        setFavorites(prev => prev.filter(f => f.link !== articleLink))
      } catch {
        const updated = removeCnrsFavorite(articleLink)
        setFavorites(updated)
      }
    } else {
      const updated = removeCnrsFavorite(articleLink)
      setFavorites(updated)
    }
  }, [userId])

  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
        <p className="mb-2 text-lg font-semibold">Aucun favori CNRS</p>
        <p className="text-sm text-muted-foreground">
          Favorisez des actualites depuis la page d&apos;accueil pour les voir ici.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="space-y-3">
        {favorites.map((article) => (
          <div
            key={article.id}
            className="group relative rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {article.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-green-200 dark:border-green-800">
                    <img
                      src={sanitizeUrl(article.imageUrl, '')}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-32 object-cover transition-opacity hover:opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                  {article.title}
                </h3>
                {article.category && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-green-200 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {article.category}
                    </span>
                  </div>
                )}
                {article.date && (
                  <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                    {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <Link
                  href={sanitizeUrl(article.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:underline"
                >
                  Lire sur CNRS Le Journal
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <button
                onClick={() => handleRemove(article.link)}
                className="rounded-full p-1.5 text-green-600 opacity-60 hover:opacity-100 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/40 transition-all"
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
