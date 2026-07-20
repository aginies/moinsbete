'use client'

import { useState, useCallback, useEffect } from 'react'
import { Quote, Bookmark, ExternalLink, Share2 } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { VisibilityButton } from './visibility-button'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { shareResourceToLobby, unshareResourceFromLobby, isSharedResourceToLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'
import { CardHeader } from './card-header'

export interface Proverbe {
  id: string
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

interface ProverbeCardProps {
  userId?: string
  onToggle?: () => void
  isVisible?: boolean
  showToggle?: boolean
  proverbe?: Proverbe | null
  onRefresh?: () => void
  loading?: boolean
  showRefresh?: boolean
  title?: string
  linkHref?: string | null
}

async function fetchRandomProverbe(): Promise<Proverbe | null> {
  try {
    const res = await fetch('/api/proverbes?action=random', {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export function ProverbeCard({ 
  userId, 
  onToggle, 
  isVisible, 
  showToggle = true,
  proverbe: externalProverbe,
  onRefresh: externalOnRefresh,
  loading: externalLoading,
  title,
  linkHref
}: ProverbeCardProps) {
  const [internalProverbe, setInternalProverbe] = useState<Proverbe | null>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { show: showFromHook, hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'proverbe_card_visible', userId })
  const show = isVisible !== undefined ? isVisible : showFromHook

  const proverbe = externalProverbe !== undefined ? externalProverbe : internalProverbe
  const loading = externalLoading !== undefined ? externalLoading : internalLoading

  const loadProverbe = useCallback(async () => {
    if (externalOnRefresh) {
      externalOnRefresh()
    } else {
      setInternalLoading(true)
      setError(false)
      const newProverbe = await fetchRandomProverbe()
      if (newProverbe) {
        setInternalProverbe(newProverbe)
        setError(false)
      } else {
        setError(true)
      }
      setInternalLoading(false)
    }
  }, [externalOnRefresh])

  useEffect(() => {
    if (userId && proverbe) {
      isBookmarkedAction('PROVERBE', proverbe.id).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [userId, proverbe])

  useEffect(() => {
    if (userId && proverbe) {
      isSharedResourceToLobby('PROVERBE', proverbe.id).then(result => {
        setIsShared(result)
      }).catch(() => {})
    }
  }, [userId, proverbe])

  const handleShareToLobby = useCallback(async () => {
    if (!proverbe || isSharing) return
    setIsSharing(true)
    try {
      if (isShared) {
        await unshareResourceFromLobby('PROVERBE', proverbe.id)
        setIsShared(false)
        toast.success('Retiré du lobby')
      } else {
        console.log('[ProverbeCard] Sharing proverb:', proverbe.id, 'etymologie:', proverbe.etymologie, 'definitions:', proverbe.definitions)
        const result = await shareResourceToLobby('PROVERBE', proverbe.id, {
          text: proverbe.text,
          signification: proverbe.signification,
          source: proverbe.source,
          wiktionnaireUrl: proverbe.wiktionnaireUrl,
          etymologie: proverbe.etymologie,
          definitions: proverbe.definitions,
        })
        if (result.success) {
          setIsShared(true)
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(false)
    }
  }, [proverbe, isShared, isSharing])

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: proverbe?.id,
    guard: () => !proverbe || !userId,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      await toggleBookmarkAction('PROVERBE', proverbe!.id, action, {
        text: proverbe!.text,
        signification: proverbe!.signification,
        source: proverbe!.source,
        url: proverbe!.wiktionnaireUrl,
        etymologie: proverbe!.etymologie,
        definitions: proverbe!.definitions,
      })
    },
  })

  useEffect(() => {
    if (hasMounted && show && !proverbe && !loading && !error) {
      const timer = setTimeout(() => {
        loadProverbe()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, proverbe, loading, error, loadProverbe])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    await loadProverbe()
  }, [loading, loadProverbe])

  const shareUrl = proverbe?.wiktionnaireUrl || `https://fr.wiktionary.org/wiki/${encodeURIComponent(proverbe?.text || '')}`
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: proverbe?.text || 'Proverbe',
    text: proverbe ? `${proverbe.text}\n\n${proverbe.signification}` : '',
  })

  if (!hasMounted) {
    return null
  }

  return (
    <>
      {!show && hasMounted ? (
        <VisibilityButton color={buttonColor} label="Afficher Proverbe" onClick={onToggle || handleToggle} />
      ) : (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30 hover:shadow-md transition-shadow">
            <CardHeader
              icon={<Quote className="h-4 w-4 text-emerald-950" />}
              iconBgColor="bg-emerald-500"
              iconDarkColor="dark:bg-emerald-600"
              title={title || "Proverbe du jour"}
              titleColor="text-emerald-800"
              titleDarkColor="dark:text-emerald-300"
              linkHref={linkHref !== undefined ? (linkHref || undefined) : "/proverbes"}
              showToggle={showToggle}
              onToggle={onToggle || handleToggle}
              showRefresh={true}
              loading={loading}
              onRefresh={handleRefresh}
              shareOptions={proverbe ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
              extraActions={proverbe ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleShareToLobby() }}
                    disabled={isSharing}
                    className="rounded-full p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                    title={isShared ? 'Retirer du lobby' : 'Partager au lobby'}
                  >
                    <Share2 className={`h-4 w-4 ${isShared ? 'text-green-600 dark:text-green-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                    disabled={isPending || loading}
                    className="rounded-full p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${isFavorite ? 'fill-current text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    />
                  </button>
                </div>
              ) : undefined}
            />

            {error && !loading && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-100/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Impossible de charger le proverbe. Cliquez pour réessayer.
                </p>
              </div>
            )}

            {proverbe && (
              <>
                <div className="mb-4 text-center">
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100 leading-relaxed italic">
                     &quot;{proverbe.text}&quot;
                  </p>
                </div>

                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {proverbe.source}
                  </span>
                </div>

                {proverbe.signification && (
                  <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200 mb-3">
                    {proverbe.signification}
                  </p>
                )}

                {proverbe.etymologie && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                      Étymologie
                    </h4>
                    <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                      {proverbe.etymologie}
                    </p>
                  </div>
                )}

                {proverbe.definitions && proverbe.definitions.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                      Définitions
                    </h4>
                    <ol className="space-y-1 list-decimal list-inside text-sm text-emerald-800 dark:text-emerald-200">
                      {proverbe.definitions.map((def, i) => (
                        <li key={i} className="leading-relaxed">{def}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  {proverbe.hasWiktionnairePage ? (
                    <Link
                      href={sanitizeUrl(proverbe.wiktionnaireUrl || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 hover:underline"
                    >
                      Voir sur Wiktionnaire
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      Pas de Page Wiktionnaire
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
