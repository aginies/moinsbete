'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CitationCard } from '@/components/feed/citation-card'
import { useTranslations } from 'next-intl'

interface CitationsPageClientProps {
  userId?: string
  title: string
  locale: string
}

export function CitationsPageClient({ userId, title }: CitationsPageClientProps) {
  const t = useTranslations('pages.citations')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchTerm.length < 2) {
      setDebouncedTerm('')
    } else {
      debounceRef.current = setTimeout(() => setDebouncedTerm(searchTerm), 300)
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchTerm])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">
        {title}
      </h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search_placeholder')}
          className="pl-10 border-amber-300 dark:border-amber-700 bg-white/80 dark:bg-black/40 focus-visible:ring-amber-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <CitationCard
        searchQuery={debouncedTerm || undefined}
        userId={userId}
        showToggle={false}
      />
    </div>
  )
}
