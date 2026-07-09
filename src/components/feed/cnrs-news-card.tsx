'use client'

import { useState, useCallback, useEffect } from 'react'
import { Newspaper, ExternalLink, RefreshCw, Share2, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'

interface CnrsNewsCardProps {
  onToggle?: () => void
}

interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; darkBorder: string; darkBg: string; darkText: string }> = {
  'Vivant': { border: 'border-green-400', bg: 'bg-green-100', text: 'text-green-800', darkBorder: 'dark:border-green-700', darkBg: 'dark:bg-green-900/40', darkText: 'dark:text-green-300' },
  'Matière': { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-800', darkBorder: 'dark:border-purple-700', darkBg: 'dark:bg-purple-900/40', darkText: 'dark:text-purple-300' },
  'Numérique': { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-800', darkBorder: 'dark:border-blue-700', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-300' },
  'Sociétés': { border: 'border-amber-400', bg: 'bg-amber-100', text: 'text-amber-800', darkBorder: 'dark:border-amber-700', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-300' },
  'Terre': { border: 'border-teal-400', bg: 'bg-teal-100', text: 'text-teal-800', darkBorder: 'dark:border-teal-700', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-300' },
  'Univers': { border: 'border-indigo-400', bg: 'bg-indigo-100', text: 'text-indigo-800', darkBorder: 'dark:border-indigo-700', darkBg: 'dark:bg-indigo-900/40', darkText: 'dark:text-indigo-300' },
  'actualite': { border: 'border-green-400', bg: 'bg-green-100', text: 'text-green-800', darkBorder: 'dark:border-green-700', darkBg: 'dark:bg-green-900/40', darkText: 'dark:text-green-300' },
  'presse': { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-800', darkBorder: 'dark:border-blue-700', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-300' },
  'lejournal': { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-800', darkBorder: 'dark:border-purple-700', darkBg: 'dark:bg-purple-900/40', darkText: 'dark:text-purple-300' },
  'images': { border: 'border-amber-400', bg: 'bg-amber-100', text: 'text-amber-800', darkBorder: 'dark:border-amber-700', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-300' },
  'videos': { border: 'border-red-400', bg: 'bg-red-100', text: 'text-red-800', darkBorder: 'dark:border-red-700', darkBg: 'dark:bg-red-900/40', darkText: 'dark:text-red-300' },
  'diaporamas': { border: 'border-cyan-400', bg: 'bg-cyan-100', text: 'text-cyan-800', darkBorder: 'dark:border-cyan-700', darkBg: 'dark:bg-cyan-900/40', darkText: 'dark:text-cyan-300' },
  'bibliotheque': { border: 'border-orange-400', bg: 'bg-orange-100', text: 'text-orange-800', darkBorder: 'dark:border-orange-700', darkBg: 'dark:bg-orange-900/40', darkText: 'dark:text-orange-300' },
  'Sciences': { border: 'border-green-400', bg: 'bg-green-100', text: 'text-green-800', darkBorder: 'dark:border-green-700', darkBg: 'dark:bg-green-900/40', darkText: 'dark:text-green-300' },
  '': { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-800', darkBorder: 'dark:border-gray-700', darkBg: 'dark:bg-gray-900/40', darkText: 'dark:text-gray-300' },
}

async function fetchRandomArticle(): Promise<CnrsArticle | null> {
  try {
    const res = await fetch('/api/cnrs-news', {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export function CnrsNewsCard({ onToggle }: CnrsNewsCardProps) {
  const [article, setArticle] = useState<CnrsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadArticle = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newArticle = await fetchRandomArticle()
    if (newArticle) {
      setArticle(newArticle)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadArticle()
  }, [loadArticle])

  const categoryStyle = article ? CATEGORY_COLORS[article.category] || { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-800', darkBorder: 'dark:border-gray-700', darkBg: 'dark:bg-gray-900/40', darkText: 'dark:text-gray-300' } : null

  const shareOptions = article ? {
    title: article.title,
    text: `${article.title}\n\nCatégorie: ${article.category || 'Sciences'}`,
    url: article.link,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  return (
    <div
      onClick={loadArticle}
      className="rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 p-5 dark:border-green-700 dark:from-green-950/30 dark:to-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-green-800 dark:text-green-300">
            Actualité CNRS
          </h3>
        </div>
        <div className="flex items-center gap-6">
          {onToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
              title="Masquer la carte"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          )}
          <RefreshCw className={`h-4 w-4 text-green-600 dark:text-green-400 ${loading ? 'animate-spin' : ''}`} />
          {shareOptions && (
            <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-100/50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-xs text-green-700 dark:text-green-300">
            Impossible de charger l'article. Cliquez pour réessayer.
          </p>
        </div>
      )}

      {article?.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border border-green-200 dark:border-green-800">
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            className="w-full h-72 object-cover transition-opacity hover:opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {article && (
        <>
          <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            {article.title}
          </p>

          {article.category && categoryStyle && (
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${categoryStyle.border} ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBorder} ${categoryStyle.darkBg} ${categoryStyle.darkText}`}>
                {article.category}
              </span>
            </div>
          )}

          <Link
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:underline"
          >
            Lire l'article sur CNRS Le Journal
            <ExternalLink className="h-3 w-3" />
          </Link>
        </>
      )}
    </div>
  )
}
