'use client'

import { useState, useCallback, useEffect } from 'react'
import { Lightbulb, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useItemShare } from './use-item-share'
import { ShareButton } from './share-button'
import { sanitizeUrl } from '@/lib/utils'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { VisibilityButton } from './visibility-button'
import { toggleRadioFavoriteAction, isRadioFavoriteAction } from '@/actions/radio-bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'

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
  onToggle?: () => void
  isVisible?: boolean
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

export function RadioFranceCard({ initialDoc, userId, onToggle, isVisible }: RadioFranceCardProps) {
  const [doc, setDoc] = useState<RadioFranceDoc | null>(initialDoc || null)
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const { hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'radio_france_card_visible', userId })
  const show = isVisible !== undefined ? isVisible : true

  useEffect(() => {
    if (userId && doc) {
      isRadioFavoriteAction(doc.id).then(result => {
        if (result.isBookmarked) {
          setIsFavorite(true)
        }
      }).catch(() => {})
    }
  }, [userId, doc])

  useEffect(() => {
    if (hasMounted && show && !doc && !loading) {
      const timer = setTimeout(() => {
        setLoading(true)
        fetchRandomDoc().then(d => {
          if (d) {
            setDoc(d)
          }
          setLoading(false)
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, doc, loading])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const newDoc = await fetchRandomDoc(doc?.id)
    if (newDoc) {
      setDoc(newDoc)
    }
    setLoading(false)
  }, [loading, doc])

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: doc?.id,
    guard: () => !doc || !userId,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      await toggleRadioFavoriteAction(doc!.id, action, {
        title: doc!.title,
        description: doc!.description,
        url: doc!.url,
        radio: doc!.radio,
        section: doc!.section,
        image: doc!.image,
        favoritedAt: action === 'add' ? new Date().toISOString() : undefined,
      })
    },
  })

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: doc?.url ?? '',
    title: doc?.title ?? '',
    text: doc ? `${doc.description}\n\n${doc.radio} · ${doc.section}` : '',
  })

  if (!hasMounted) {
    return null
  }

  if (!show && hasMounted) {
    return (
      <VisibilityButton color={buttonColor} label="Afficher Docs Radio France" onClick={onToggle || handleToggle} />
    )
  }

  return (
    <div className="mb-6">
      <div className="rounded-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-violet-50 p-5 dark:border-purple-700 dark:from-purple-950/30 dark:to-violet-950/30 hover:shadow-md transition-shadow">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 dark:bg-purple-600">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-purple-800 dark:text-purple-300">
              Docs Radio France
            </h3>
          </div>
          <div className="flex items-center gap-6">
             <button
               onClick={onToggle || handleToggle}
               className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
              title="Masquer la carte"
            >
              <EyeOff className="h-4 w-4" />
            </button>
            <button
              onClick={handleRefresh}
              title="Changer de documentaire"
            >
              <RefreshCw className={`h-4 w-4 text-purple-600 dark:text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleBookmark}
              disabled={isPending}
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors disabled:opacity-50"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current text-purple-600 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`} />
            </button>
            <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
          </div>
        </div>

        {doc && (
          <>
            {doc.image && (
              <div className="mb-3 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800">
                <img
                  src={sanitizeUrl(doc.image, '')}
                  alt={doc.title}
                  loading="lazy"
                  className="w-full h-72 object-cover transition-opacity hover:opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}

            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
              {doc.title}
            </p>

            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {doc.radio}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300 ml-2">
                {doc.section}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-purple-800 dark:text-purple-200 mb-3">
              {doc.description}
            </p>

            <Link
              href={sanitizeUrl(doc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline"
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
