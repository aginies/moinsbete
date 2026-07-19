'use client'

import { useState, useCallback, useEffect } from 'react'
import { Languages, Bookmark, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { useCardVisibility } from '@/hooks/use-card-visibility'
import { VisibilityButton } from './visibility-button'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { CardHeader } from './card-header'

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
  userId?: string
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

export function PortailLexicalCard({ userId, onToggle, isVisible, showToggle = true }: PortailLexicalCardProps) {
  const [word, setWord] = useState<PortailLexicalWord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { hasMounted, handleToggle, buttonColor } = useCardVisibility({ storageKey: 'portail_lexical_card_visible', userId })
  const show = isVisible !== undefined ? isVisible : true

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

  useEffect(() => {
    if (userId && word) {
      isBookmarkedAction('PORTAIL_LEXICAL', word.form).then(result => {
        setIsBookmarked(result.isBookmarked)
      }).catch(() => {})
    }
  }, [userId, word])

  useEffect(() => {
    if (hasMounted && show && !word && !loading && !error) {
      const timer = setTimeout(() => {
        loadWord()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, show, word, loading, error, loadWord])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    await loadWord()
  }, [loading, loadWord])

  const handleBookmark = useCallback(async () => {
    if (!word || !userId) return
    const newFavorite = !isBookmarked
    try {
      await toggleBookmarkAction('PORTAIL_LEXICAL', word.form, newFavorite ? 'add' : 'remove', {
        description: word.description,
        full_pos: word.full_pos,
        ipa: word.ipa,
      })
      setIsBookmarked(newFavorite)
    } catch {
      setIsBookmarked(prev => !prev)
    }
  }, [word, isBookmarked, userId])

  const shareUrl = word ? `https://www.portail-lexical.fr/definition/${encodeURIComponent(word.form)}` : ''
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: word?.full_form || 'Mot du jour',
    text: word ? `${word.full_form} (${word.full_pos})\n\n${word.description}` : '',
  })

  if (!hasMounted) {
    return null
  }

  return (
    <>
      {!show && hasMounted ? (
        <VisibilityButton color={buttonColor} label="Afficher Lexique" onClick={onToggle || handleToggle} />
      ) : (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-yellow-950/30 hover:shadow-md transition-shadow">
            <CardHeader
              icon={<Languages className="h-4 w-4 text-amber-950" />}
              iconBgColor="bg-amber-500"
              iconDarkColor="dark:bg-amber-600"
              title="Portail Lexical — Mot du jour"
              titleColor="text-amber-800"
              titleDarkColor="dark:text-amber-300"
              linkHref="/portail-lexical"
              showToggle={showToggle}
              onToggle={onToggle || handleToggle}
              showRefresh={false}
              loading={loading}
              shareOptions={word ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
              extraActions={word ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                  disabled={loading}
                  className="rounded-full p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all disabled:opacity-50"
                  title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isBookmarked ? 'fill-current text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}
                  />
                </button>
              ) : undefined}
            />

            {error && !loading && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-100/50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Impossible de charger le mot. Cliquez pour réessayer.
                </p>
              </div>
            )}

            {word && (
              <>
                <div className="mb-3">
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {word.form}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {word.full_pos}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                  Mot du jour
                </span>
                {word.ipa && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                        /{word.ipa}/
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 mb-3">
                  {word.description}
                </p>

                {word.tlfidefinitions.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                      Définition (TLFi)
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                      {word.tlfidefinitions.map((def, i) => (
                        <li key={i} className="leading-relaxed">{def}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {word.wiktionnaireDefinitions.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                      Wiktionnaire
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                      {word.wiktionnaireDefinitions.map((def, i) => (
                        <li key={i} className="leading-relaxed">{def}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {word.etymologie && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                      Étymologie
                    </h4>
                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                      {word.etymologie}
                    </p>
                  </div>
                )}

                {word.concordance.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                      Exemples littéraires
                    </h4>
                    <div className="space-y-2">
                      {word.concordance.slice(0, 2).map((ex, i) => (
                        <blockquote key={i} className="border-l-2 border-amber-300 dark:border-amber-700 pl-3 text-sm italic text-amber-700 dark:text-amber-300">
                          <p className="leading-relaxed text-amber-700 dark:text-amber-300">
                            <span className="mr-1">{`&ldquo;`}</span>{ex.left}{' '}
                            <strong className="not-italic text-amber-900 dark:text-amber-100">{ex.matching}</strong>{' '}
                            {ex.right}
                            <span className="ml-1">{`&rdquo;`}</span>
                          </p>
                          <footer className="text-xs not-italic mt-1 text-amber-600 dark:text-amber-400">
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
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
                  >
                    Voir sur Portail Lexical
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
