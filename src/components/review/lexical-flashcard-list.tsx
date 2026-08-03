'use client'

import { useState, useCallback } from 'react'
import { LexicalFlashcard } from './lexical-flashcard'
import { Skeleton } from '@/components/ui/skeleton'
import type { LexicalReviewWord } from '@/actions/lexical-review-actions'

interface LexicalFlashcardListProps {
  words: LexicalReviewWord[]
  total: number
  loading: boolean
  onWordRemoved: (wordId: string) => void
}

export function LexicalFlashcardList({ words, total: _total, loading, onWordRemoved }: LexicalFlashcardListProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleWordRemoved = useCallback((wordId: string) => {
    onWordRemoved(wordId)
    if (currentIndex >= words.length - 1 && words.length > 1) {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }
  }, [currentIndex, words.length, onWordRemoved])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, words.length - 1))
  }, [words.length])

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

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">Aucun mot à réviser aujourd'hui</p>
        <p className="mt-2 text-sm text-muted-foreground">Ajoutez des mots à vos favoris pour les réviser ici</p>
      </div>
    )
  }

  const displayedWord = words[currentIndex]
  if (!displayedWord) {
    return null
  }

  return (
    <div className="flex w-full flex-col items-center">
      <LexicalFlashcard
        word={displayedWord}
        currentIndex={currentIndex}
        total={words.length}
        onRemoved={handleWordRemoved}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  )
}
