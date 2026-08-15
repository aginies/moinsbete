'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Languages, Bookmark, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { decodeHtmlEntities } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { togglePortailLexicalFavoriteAction } from '@/actions/bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { CardHeader } from './card-header'
import { useTranslations } from 'next-intl'

interface PortailLexicalWord {
  form: string
  pos: string
  full_form: string
  full_pos: string
  description: string
  ipa: string
  tlfidefinitions: string[]
  wiktionnaireDefinitions: string[]
  etymologie: string
  concordance: Array<{
    name: string
    title: string
    date: string
    left: string
    matching: string
    right: string
  }>
}

interface PortailLexicalCardProps {
  onToggle?: () => void
  isVisible?: boolean
  showToggle?: boolean
}

async function fetchWordOfTheDay(): Promise<PortailLexicalWord | null> {
  try {
    const res = await fetch('/api/portail-lexical', {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

function PortailLexicalCardInner({ onToggle, isVisible, showToggle = true }: PortailLexicalCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('amber')
  const [word, setWord] = useState<PortailLexicalWord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [renderError, setRenderError] = useState<Error | null>(null)

  const loadWord = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newWord = await fetchWordOfTheDay()
    if (newWord) {
      setWord(newWord)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  const { isPending, handleBookmark, isFavorite } = useSimpleBookmarkToggle({
    resourceId: word?.form,
    guard: () => !word,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await togglePortailLexicalFavoriteAction(word!.form, action, {
        description: word!.description,
        full_pos: word!.full_pos,
        ipa: word!.ipa,
      })
    },
  })

  useEffect(() => {
    if (isVisible === false) return
    if (!word && !loading && !error) {
      const timer = setTimeout(() => {
        loadWord()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, word, loading, error, loadWord])

  const shareUrl = word ? `https://www.portail-lexical.fr/definition/${encodeURIComponent(word.form)}` : ''
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: word?.full_form || 'Mot du jour',
    text: word ? `${word.full_form} (${word.full_pos})\n\n${word.description}` : '',
  })

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="amber"
      label="Afficher Lexique"
    >
     {loading && !word ? (
        <div className="mb-4 sm:mb-6">
          <CardShell color="amber">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.iconBg} ${c.iconBgDark}`}>
                  <Languages className={`h-4 w-4 ${c.iconForeground}`} />
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wide ${c.title} ${c.titleDark}`}>
                  Portail Lexical — Mot du jour
                </h3>
              </div>
            </div>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className={`h-6 w-6 animate-spin ${c.action}`} />
            </div>
          </CardShell>
        </div>
      ) : (
        <div className="mb-4 sm:mb-6">
          <CardShell color="amber">
            <CardHeader
              color="amber"
              icon={<Languages className={"h-4 w-4 " + c.iconForeground} />}
              title="Portail Lexical — Mot du jour"
              linkHref="/portail-lexical"
              showToggle={showToggle}
              onToggle={onToggle}
              showRefresh={false}
              loading={loading}
              shareOptions={word ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
extraActions={word ? (
                 isLoggedIn && (
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
                 )
               ) : undefined}
            />

            {error && !loading && (
              <div className={`mb-3 flex items-center gap-2 rounded-lg border ${c.errorBorder} ${c.errorBg} p-3 ${c.errorBorderDark} ${c.errorBgDark}`}>
                <p className={`text-xs ${c.errorText} ${c.errorTextDark}`}>
                  Impossible de charger le mot. Cliquez pour réessayer.
                </p>
              </div>
            )}

            {word && (
              <>
                <div className="mb-3">
                  <h3 className={`text-2xl font-bold ${c.bodyBold} ${c.bodyBoldDark}`}>
                    {word.form}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.pillBorder} ${c.pillBg} ${c.pillText} ${c.pillBorderDark} ${c.pillBgDark} ${c.pillTextDark}`}>
                      {word.full_pos}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.pillBg} ${c.bodyBold} ${c.pillBgDark} ${c.bodyBoldDark}`}>
                      Mot du jour
                    </span>
                    {word.ipa && (
                          <span className={`text-xs ${c.muted} ${c.mutedDark} font-mono`}>
                            /{word.ipa}/
                          </span>
                        )}
                      </div>
                </div>

                <p className={`text-sm leading-relaxed ${c.body} ${c.bodyDark} mb-3`}>
                  {word.description}
                </p>

                {word.tlfidefinitions.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                      Définition (TLFi)
                    </h4>
                    <ol className={`space-y-2 list-decimal list-inside text-sm ${c.body} ${c.bodyDark}`}>
                      {word.tlfidefinitions.map((def, i) => (
                        <li key={i} className="leading-relaxed">{def}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {word.wiktionnaireDefinitions.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                      Wiktionnaire
                    </h4>
                    <ol className={`space-y-2 list-decimal list-inside text-sm ${c.body} ${c.bodyDark}`}>
                      {word.wiktionnaireDefinitions.map((def, i) => (
                        <li key={i} className="leading-relaxed">{def}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {word.etymologie && (
                  <div className="mb-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                      Étymologie
                    </h4>
                    <p className={`text-sm leading-relaxed ${c.body} ${c.bodyDark} whitespace-pre-wrap`}>
                      {word.etymologie}
                    </p>
                  </div>
                )}

                {word.concordance.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${c.headingSecondary} ${c.headingSecondaryDark} mb-2`}>
                      Exemples littéraires
                    </h4>
                    <div className="space-y-2">
                       {word.concordance.slice(0, 2).map((ex, i) => (
                        <blockquote key={i} className={`border-l-2 ${c.pillBorder} dark:${c.pillBorderDark} pl-3 text-sm italic ${c.headingSecondary} ${c.headingSecondaryDark}`}>
                          <p className={`leading-relaxed ${c.headingSecondary} ${c.headingSecondaryDark}`}>
                            <span className="mr-1">{"\u201C"}</span>{decodeHtmlEntities(ex.left)}{' '}
                            <strong className={`not-italic ${c.bodyBold} ${c.bodyBoldDark}`}>{decodeHtmlEntities(ex.matching)}</strong>{' '}
                            {decodeHtmlEntities(ex.right)}
                            <span className="ml-1">{"\u201D"}</span>
                          </p>
                          <footer className={`text-xs not-italic mt-1 ${c.muted} ${c.mutedDark}`}>
                            — {ex.name}, <em>{ex.title}</em> ({ex.date})
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  <Link
                    href={sanitizeUrl(`https://www.portail-lexical.fr/definition/${encodeURIComponent(word.form)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1 text-xs ${c.link} ${c.linkHover} ${c.linkDark} ${c.linkHoverDark} hover:underline`}
                  >
                    Voir sur Portail Lexical
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </CardShell>
        </div>
      )}
    </CardVisibilityGuard>
  )
}
export const PortailLexicalCard = React.memo(PortailLexicalCardInner)
