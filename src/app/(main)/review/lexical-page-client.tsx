'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { fetchLexicalReviewWords, type LexicalReviewWord } from '@/actions/lexical-review-actions'
import { LexicalFlashcardList } from '@/components/review/lexical-flashcard-list'
import { Button } from '@/components/ui/button'

interface LexicalPageClientProps {
  currentPage: number
}

export function LexicalPageClient({ currentPage }: LexicalPageClientProps) {
  const [words, setWords] = useState<LexicalReviewWord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(currentPage)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const loadWords = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const result = await fetchLexicalReviewWords(pageNum)
      setWords(result.words)
      setTotal(result.total)
    } catch (err) {
      console.error('[LexicalPageClient] Error loading words:', err)
      setWords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadedPageRef = useRef(page)

  useEffect(() => {
    loadWords(page)
    loadedPageRef.current = page
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page !== loadedPageRef.current) {
      loadWords(page)
      loadedPageRef.current = page
    }
  }, [page, loadWords])

  const handleWordRemoved = useCallback((wordId: string) => {
    setRemovedIds(prev => new Set([...prev, wordId]))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const displayedWords = words.filter(word => !removedIds.has(word.id))
  const hasMore = page * 10 < total

  return (
    <div className="mx-auto w-full px-4 py-4 md:max-w-4xl md:p-6">
      <LexicalFlashcardList
        words={displayedWords}
        total={total}
        loading={loading}
        onWordRemoved={handleWordRemoved}
      />

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
          >
            Charger plus de mots
          </Button>
        </div>
      )}
    </div>
  )
}
