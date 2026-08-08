'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Quote, Bookmark, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { CardHeader } from './card-header'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { useTranslations } from 'next-intl'

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

function ProverbeCardInner({ 
  onToggle, 
  isVisible, 
  showToggle = true,
  proverbe: externalProverbe,
  onRefresh: externalOnRefresh,
  loading: externalLoading,
  title,
  linkHref
}: ProverbeCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('emerald')
  const [internalProverbe, setInternalProverbe] = useState<Proverbe | null>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [error, setError] = useState(false)

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

  useAutoRefresh('proverbe', loadProverbe)

  const { isPending, handleBookmark, isFavorite } = useSimpleBookmarkToggle({
    resourceId: proverbe?.id,
    guard: () => !proverbe,
    initialFavorite: false,
    onFavoriteChange: () => {},
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
    if (isVisible === false) return
    if (!proverbe && !loading && !error) {
      const timer = setTimeout(() => {
        loadProverbe()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, proverbe, loading, error, loadProverbe])

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

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="emerald"
      label="Afficher Proverbe"
    >
      <div className="mb-4 sm:mb-6">
        <CardShell color="emerald">
          <CardHeader
            color="emerald"
            icon={<Quote className={"h-4 w-4 " + c.iconForeground} />}
            title={title || "Proverbe aléatoire"}
            linkHref={linkHref !== undefined ? (linkHref || undefined) : "/proverbes"}
            showToggle={showToggle}
            onToggle={onToggle}
            showRefresh={true}
            loading={loading}
            onRefresh={handleRefresh}
            shareOptions={proverbe ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
           extraActions={proverbe ? (
               isLoggedIn && (
               <div className="flex items-center gap-2">
                 <ShareToLobbyButton resourceId={proverbe.id} resourceType="PROVERBE" />
                 <button
                   type="button"
                   onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                   disabled={isPending || loading}
                   className={`rounded-full p-1.5 ${c.hoverBg} ${c.hoverBgDark} transition-all disabled:opacity-50`}
                   title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                   aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
                 >
                   <Bookmark
                     className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark}`}
                   />
                 </button>
               </div>
               )
             ) : undefined}
          />

          {error && !loading && (
            <div className={`mb-3 flex items-center gap-2 rounded-lg border ${c.errorBorder} ${c.errorBg} p-3 ${c.errorBorderDark} ${c.errorBgDark}`}>
              <p className={`text-xs ${c.errorText} ${c.errorTextDark}`}>
                Impossible de charger le proverbe. Cliquez pour réessayer.
              </p>
            </div>
          )}

          {proverbe && (
            <>
              <div className="mb-4 text-center">
                <p className={`text-xl font-bold ${c.bodyBold} ${c.bodyBoldDark} leading-relaxed italic`}>
                   &quot;{proverbe.text}&quot;
                </p>
              </div>

              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.pillBorder} ${c.pillBg} ${c.pillText} ${c.pillBorderDark} ${c.pillBgDark} ${c.pillTextDark}`}>
                  {proverbe.source}
                </span>
              </div>

              {proverbe.signification && (
                <p className={`text-sm leading-relaxed ${c.body} ${c.bodyDark} mb-3`}>
                  {proverbe.signification}
                </p>
              )}

              {proverbe.etymologie && (
                <div className="mb-3">
                  <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                    Étymologie
                  </h4>
                  <p className={`text-sm leading-relaxed ${c.body} ${c.bodyDark} whitespace-pre-wrap`}>
                    {proverbe.etymologie}
                  </p>
                </div>
              )}

              {proverbe.definitions && proverbe.definitions.length > 0 && (
                <div className="mb-3">
                  <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                    Définitions
                  </h4>
                  <ol className={`space-y-1 list-decimal list-inside text-sm ${c.body} ${c.bodyDark}`}>
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
                    className={`inline-flex items-center gap-1 text-xs ${c.link} ${c.linkHover} ${c.linkDark} ${c.linkHoverDark} hover:underline`}
                  >
                    Voir sur Wiktionnaire
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className={`text-xs ${c.muted} ${c.mutedDark}`}>
                    Pas de Page Wiktionnaire
                  </span>
                )}
              </div>
            </>
          )}
        </CardShell>
      </div>
    </CardVisibilityGuard>
  )
}
export const ProverbeCard = React.memo(ProverbeCardInner)
