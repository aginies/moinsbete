'use client'

import { useState, useCallback } from 'react'
import { Flashcard } from './flashcard'
import { Skeleton } from '@/components/ui/skeleton'
import type { DueIdea } from '@/actions/review-actions'

interface FlashcardListProps {
  ideas: DueIdea[]
  total: number
  loading: boolean
  onIdeaRemoved: (ideaId: string) => void
}

export function FlashcardList({ ideas, total, loading, onIdeaRemoved }: FlashcardListProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleIdeaRemoved = useCallback((ideaId: string) => {
    onIdeaRemoved(ideaId)
    // If we removed the current card and there are more, shift to next
    if (currentIndex >= ideas.length - 1 && ideas.length > 1) {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }
  }, [currentIndex, ideas.length, onIdeaRemoved])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, ideas.length - 1))
  }, [ideas.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="h-[400px] w-full max-w-3xl rounded-2xl border bg-card" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">Aucune idée à réviser aujourd'hui</p>
        <p className="mt-2 text-sm text-muted-foreground">Revenez plus tard pour de nouvelles idées</p>
      </div>
    )
  }

  const displayedIdea = ideas[currentIndex]
  if (!displayedIdea) {
    return null
  }

  return (
    <div className="flex w-full flex-col items-center">
      <Flashcard
        idea={displayedIdea}
        currentIndex={currentIndex}
        total={ideas.length}
        onRemoved={handleIdeaRemoved}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  )
}
