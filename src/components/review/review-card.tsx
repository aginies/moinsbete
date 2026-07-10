'use client'

import { useState } from 'react'
import { recordReview, skipIdea, removeFromSrs } from '@/actions/review-actions'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { X, SkipForward, Eye, Brain, CheckCircle, Sparkles } from 'lucide-react'

interface ReviewCardProps {
  idea: {
    id: string
    title: string
    content: string
    takeaway: string
    slug: string
    topics: { name: string; slug: string; icon: string; color: string; id: string }[]
    source: { title: string; type: string }
    bookmark: {
      id: string
      lastReviewAt: Date | null
      nextReviewAt: Date | null
      reviewCount: number
      easeFactor: number
    }
  }
  onRemoved: () => void
}

const RATING_CONFIG = {
  again: { label: 'Again', color: 'bg-red-500 hover:bg-red-600 text-white', icon: Eye, tooltip: 'Oublié — revoir aujourd\'hui' },
  hard: { label: 'Hard', color: 'bg-orange-400 hover:bg-orange-500 text-white', icon: Brain, tooltip: 'Difficile — léger recul' },
  good: { label: 'Good', color: 'bg-blue-500 hover:bg-blue-600 text-white', icon: CheckCircle, tooltip: 'Bon intervalle normal' },
  easy: { label: 'Easy', color: 'bg-green-500 hover:bg-green-600 text-white', icon: Sparkles, tooltip: 'Facile — grand saut' },
}

export function ReviewCard({ idea, onRemoved }: ReviewCardProps) {
  const [rating, setRating] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRating = async (r: string) => {
    if (rating || loading) return
    setLoading(true)
    setRating(r)

    try {
      await recordReview(idea.bookmark.id, r as 'again' | 'hard' | 'good' | 'easy')
      setTimeout(() => onRemoved(), 300)
    } catch (err) {
      console.error('[ReviewCard] Rating error:', err)
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
      onRemoved()
    } catch (err) {
      console.error('[ReviewCard] Skip error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)

    try {
      await removeFromSrs(idea.bookmark.id)
      onRemoved()
    } catch (err) {
      console.error('[ReviewCard] Remove error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-lg border bg-card p-4 transition-all duration-300 ${rating ? 'opacity-50 scale-95' : ''}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{idea.title}</h3>
        <div className="flex gap-1">
          <Tooltip content="Passer — revoir demain">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={!!rating || loading}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4" />
              <span className="sr-only">Passer</span>
            </Button>
          </Tooltip>
          <Tooltip content="Retirer — ne plus réviser">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={!!rating || loading}
              className="shrink-0 text-muted-foreground hover:text-red-500"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Retirer</span>
            </Button>
          </Tooltip>
        </div>
      </div>

      <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
        {idea.content}
      </p>

      {idea.takeaway && (
        <div className="mb-3 rounded bg-muted/50 p-2 text-sm">
          <span className="font-medium">Takeaway: </span>
          <span className="text-muted-foreground">{idea.takeaway}</span>
        </div>
      )}

      <div className="flex gap-2">
        {(Object.entries(RATING_CONFIG) as Array<[string, typeof RATING_CONFIG['again']]>).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Tooltip key={key} content={config.tooltip}>
              <Button
                onClick={() => handleRating(key)}
                disabled={!!rating || loading}
                className={`${config.color} flex-1 text-sm font-medium ${rating === key ? 'ring-2 ring-offset-2' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{config.label}</span>
              </Button>
            </Tooltip>
          )
        })}
      </div>

      {idea.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {idea.topics.map(topic => (
            <span
              key={topic.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              <span>{topic.icon}</span>
              <span>{topic.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
