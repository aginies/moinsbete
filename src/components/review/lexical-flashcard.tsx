'use client'

import { useState, useCallback, useEffect } from 'react'
import { recordLexicalReview, skipLexicalWord, removeLexicalFromSrs, fetchWordDefinitions, type LexicalReviewWord, type DueWord, type WordDefinitions } from '@/actions/lexical-review-actions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { SkipForward, X, Eye, Brain, CheckCircle, Sparkles, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { decodeHtmlEntities } from '@/lib/utils'

interface LexicalFlashcardProps {
  word: LexicalReviewWord
  currentIndex: number
  total: number
  onRemoved: (wordId: string) => void
  onNext: () => void
  onPrev: () => void
}

const RATING_CONFIG = {
  again: { label: 'Again', color: 'bg-red-500 hover:bg-red-600 text-white', icon: Eye },
  hard: { label: 'Hard', color: 'bg-orange-400 hover:bg-orange-500 text-white', icon: Brain },
  good: { label: 'Good', color: 'bg-blue-500 hover:bg-blue-600 text-white', icon: CheckCircle },
  easy: { label: 'Easy', color: 'bg-green-500 hover:bg-green-600 text-white', icon: Sparkles },
}

const RATING_TOOLTIPS = {
  again: 'Oublié — revoir aujourd\'hui',
  hard: 'Difficile — léger recul',
  good: 'Bon intervalle normal',
  easy: 'Facile — grand saut',
}

export function LexicalFlashcard({ word, currentIndex, total, onRemoved, onNext, onPrev }: LexicalFlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [rating, setRating] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [definitions, setDefinitions] = useState<WordDefinitions | null>(null)
  const [definitionsLoading, setDefinitionsLoading] = useState(false)
  const [definitionsError, setDefinitionsError] = useState<string | null>(null)
  const isBookmarked = word.isBookmarked
  const isHistorical = !word.isBookmarked

  useEffect(() => {
    setFlipped(false)
    setRating(null)
    setDefinitions(null)
    setDefinitionsError(null)
    setDefinitionsLoading(true)
    fetchWordDefinitions(word.word)
      .then(defs => {
        if (defs) {
          setDefinitions(defs)
        } else {
          setDefinitionsError("Impossible de charger les définitions")
        }
      })
      .catch(err => {
        console.error('[LexicalFlashcard] Fetch error:', err)
        setDefinitionsError("Erreur de connexion")
      })
      .finally(() => {
        setDefinitionsLoading(false)
      })
  }, [word.word])

  const handleFlip = useCallback(() => {
    if (!rating && !loading) {
      setFlipped(prev => !prev)
    }
  }, [rating, loading])

  const handleRetry = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDefinitionsError(null)
    setDefinitionsLoading(true)
    try {
      const defs = await fetchWordDefinitions(word.word)
      if (defs) {
        setDefinitions(defs)
      } else {
        setDefinitionsError("Impossible de charger les définitions")
      }
    } catch {
      setDefinitionsError("Erreur de connexion")
    } finally {
      setDefinitionsLoading(false)
    }
  }, [word.word])

  const handleRating = async (r: string) => {
    if (rating || loading || !isBookmarked) return
    setLoading(true)
    setRating(r)

    try {
      await recordLexicalReview(word.bookmark.id, r as 'again' | 'hard' | 'good' | 'easy')
      setTimeout(() => onRemoved(word.id), 400)
    } catch (err) {
      console.error('[LexicalFlashcard] Rating error:', err)
      setRating(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (loading) return
    setLoading(true)

    try {
      if (isBookmarked) {
        await skipLexicalWord(word.bookmark.id)
      }
      onRemoved(word.id)
    } catch (err) {
      console.error('[LexicalFlashcard] Skip error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)

    try {
      if (isBookmarked) {
        await removeLexicalFromSrs(word.bookmark.id)
      }
      onRemoved(word.id)
    } catch (err) {
      console.error('[LexicalFlashcard] Remove error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFlipped(false)
    setRating(null)
    setDefinitions(null)
  }, [word.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (rating || loading) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handleFlip()
          break
        case '1':
          handleRating('again')
          break
        case '2':
          handleRating('hard')
          break
        case '3':
          handleRating('good')
          break
        case '4':
          handleRating('easy')
          break
        case 'ArrowRight':
          onNext()
          break
        case 'ArrowLeft':
          onPrev()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFlip, handleRating, onNext, onPrev, rating, loading])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-sm text-muted-foreground">
        Mot {currentIndex + 1}/{total}
      </div>

      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '400px',
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="mb-4 text-4xl font-bold text-center leading-tight text-amber-900 dark:text-amber-100">
              {word.word}
            </h2>

            {isBookmarked && word.full_pos && (
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {word.full_pos}
                </span>
              </div>
            )}

            {isBookmarked && word.ipa && (
              <p className="mb-4 text-lg font-mono text-amber-600 dark:text-amber-400">
                /{word.ipa}/
              </p>
            )}

              <p className="text-sm text-muted-foreground animate-pulse">
                Cliquez pour r&eacute;v&eacute;ler
              </p>
          </div>

          <div
            className="absolute inset-0 flex flex-col rounded-2xl border bg-card p-8 shadow-sm"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex-1 overflow-y-auto max-h-[50vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {word.word}
                </h3>
                <Link
                  href={word.portailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
                >
                  Voir sur Portail Lexical
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {isBookmarked && word.full_pos && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300 mb-4">
                  {word.full_pos}
                </span>
              )}

              {isBookmarked && word.description && !definitions && !definitionsLoading && !definitionsError && (
                <p className="mb-4 text-sm text-amber-700 dark:text-amber-300 italic">
                  {word.description}
                </p>
              )}

              {definitionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                </div>
              )}

              {definitionsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {definitionsError}
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={definitionsLoading}
                    className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {isHistorical && !definitions && !definitionsLoading && !definitionsError && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Cliquez sur "Voir sur Portail Lexical" pour voir la définition complète
                </p>
              )}

              {definitions && definitions.tlfidefinitions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Définitions (TLFi)
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                    {definitions.tlfidefinitions.map((def, i) => (
                      <li key={i} className="leading-relaxed">{def}</li>
                    ))}
                  </ol>
                </div>
              )}

              {definitions && definitions.wiktionnaireDefinitions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Wiktionnaire
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                    {definitions.wiktionnaireDefinitions.map((def, i) => (
                      <li key={i} className="leading-relaxed">{def}</li>
                    ))}
                  </ol>
                </div>
              )}

              {definitions && definitions.etymologie && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Étymologie
                  </h4>
                  <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                    {definitions.etymologie}
                  </p>
                </div>
              )}

              {definitions && definitions.concordance.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Exemples littéraires
                  </h4>
                  <div className="space-y-2">
                    {definitions.concordance.slice(0, 2).map((ex, i) => (
                      <blockquote key={i} className="border-l-2 border-amber-300 dark:border-amber-700 pl-3 text-sm italic text-amber-700 dark:text-amber-300">
                        <p className="leading-relaxed text-amber-700 dark:text-amber-300">
                          <span className="mr-1">{"\u201C"}</span>{decodeHtmlEntities(ex.left)}{' '}
                          <strong className="not-italic text-amber-900 dark:text-amber-100">{decodeHtmlEntities(ex.matching)}</strong>{' '}
                          {decodeHtmlEntities(ex.right)}
                          <span className="ml-1">{"\u201D"}</span>
                        </p>
                        <footer className="text-xs not-italic mt-1 text-amber-600 dark:text-amber-400">
                          — {ex.name}, <em>{ex.title}</em> ({ex.date})
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              {definitions && definitions.tlfidefinitions.length === 0 && definitions.wiktionnaireDefinitions.length === 0 && !definitions.etymologie && !definitionsLoading && !definitionsError && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Aucune définition disponible pour ce mot
                </p>
              )}
            </div>

            {isBookmarked && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {(Object.entries(RATING_CONFIG) as Array<[string, typeof RATING_CONFIG['again']]>).map(([key, config]) => {
                  const Icon = config.icon
                  const isDisabled = !!rating || loading
                  return (
                    <TooltipProvider key={key}>
                      <Tooltip content={RATING_TOOLTIPS[key as keyof typeof RATING_TOOLTIPS]} side="top">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRating(key)
                          }}
                          disabled={isDisabled}
                          className={`${config.color} h-12 text-sm font-medium transition-all ${rating === key ? 'ring-2 ring-offset-2' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="sr-only">{config.label}</span>
                        </Button>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            )}

            {isBookmarked && (
              <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
                <span>1-4: noter</span>
                <span>Espace: retourner</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={currentIndex <= 0}
          className="text-muted-foreground"
        >
          ← Précédent
        </Button>

        {isBookmarked && (
          <TooltipProvider>
            <Tooltip content="Passer — revoir demain" side="top">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={!!rating || loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
                <span className="sr-only">Passer</span>
              </Button>
            </Tooltip>
          </TooltipProvider>
        )}

        {isBookmarked && (
          <TooltipProvider>
            <Tooltip content="Retirer — ne plus réviser" side="top">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={!!rating || loading}
                className="text-muted-foreground hover:text-red-500"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Retirer</span>
              </Button>
            </Tooltip>
          </TooltipProvider>
        )}

        {isHistorical && (
          <Link
            href={word.portailUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline px-2 py-1"
          >
            Voir sur Portail Lexical
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          className="text-muted-foreground"
        >
          Suivant →
        </Button>
      </div>
    </div>
  )
}
