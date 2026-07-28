'use client'

import { useState, useCallback, useEffect } from 'react'
import { recordReview, skipIdea, removeFromSrs } from '@/actions/review-actions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { SkipForward, X, Eye, Brain, CheckCircle, Sparkles } from 'lucide-react'
import type { DueIdea } from '@/actions/review-actions'

interface FlashcardProps {
  idea: DueIdea
  currentIndex: number
  total: number
  onRemoved: (ideaId: string) => void
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

export function Flashcard({ idea, currentIndex, total, onRemoved, onNext, onPrev }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [rating, setRating] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFlip = useCallback(() => {
    if (!rating && !loading) {
      setFlipped(prev => !prev)
    }
  }, [rating, loading])

  const handleRating = async (r: string) => {
    if (rating || loading) return
    setLoading(true)
    setRating(r)

    try {
      await recordReview(idea.bookmark.id, r as 'again' | 'hard' | 'good' | 'easy')
      setTimeout(() => onRemoved(idea.id), 400)
    } catch (err) {
      console.error('[Flashcard] Rating error:', err)
      setRating(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (loading) return
    setLoading(true)

    try {
      await skipIdea(idea.bookmark.id)
      onRemoved(idea.id)
    } catch (err) {
      console.error('[Flashcard] Skip error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)

    try {
      await removeFromSrs(idea.bookmark.id)
      onRemoved(idea.id)
    } catch (err) {
      console.error('[Flashcard] Remove error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    setFlipped(false)
    setRating(null)
  }, [idea.id])

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
      {/* Progress indicator */}
      <div className="mb-4 text-sm text-muted-foreground">
        Carte {currentIndex + 1}/{total}
      </div>

      {/* Flashcard container with perspective */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        {/* Card with flip animation */}
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '400px',
          }}
        >
          {/* Front face (question) */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="mb-4 text-2xl font-bold text-center leading-tight">
              {idea.title}
            </h2>

            {idea.topics.length > 0 && (
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {idea.topics.map(topic => (
                  <span
                    key={topic.id}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.name}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground animate-pulse">
              Cliquez ou Espace pour révéler
            </p>
          </div>

          {/* Back face (answer) */}
          <div
            className="absolute inset-0 flex flex-col rounded-2xl border bg-card p-8 shadow-sm"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <h3 className="mb-3 text-lg font-semibold">{idea.title}</h3>

              <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                {idea.content}
              </p>

              {idea.takeaway && (
                <div className="mb-4 rounded-lg bg-muted/50 p-3">
                  <span className="font-medium">Takeaway: </span>
                  <span className="text-muted-foreground">{idea.takeaway}</span>
                </div>
              )}
            </div>

            {/* Rating buttons */}
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

            {/* Keyboard hint */}
            <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
              <span>1-4: noter</span>
              <span>Espace: retourner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation + actions */}
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
