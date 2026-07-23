'use client'

import { useState, useCallback } from 'react'
import { NewsCard, NewsArticle } from '@/components/feed/news-card'

export function NewsPageClient({ userId }: { userId?: string }) {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLoadMore = useCallback(async (cursor: string, currentArticles: NewsArticle[], categories: string[]) => {
    if (loading) return { articles: [] as NewsArticle[], hasMore: false }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categories.length > 0) params.set('categories', categories.join(','))
      if (searchQuery) params.set('q', searchQuery)
      params.set('cursor', cursor)
      params.set('limit', '500')

      const res = await fetch(`/api/news?${params}`, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      })
      const data = await res.json()
      setLoading(false)
      return { articles: data.articles || [], hasMore: data.hasMore || false }
    } catch {
      setLoading(false)
      return { articles: [], hasMore: false }
    }
  }, [loading, searchQuery])

  return (
    <div className="w-full">
      <NewsCard
        userId={userId}
        showToggle={false}
        infiniteScroll
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}
