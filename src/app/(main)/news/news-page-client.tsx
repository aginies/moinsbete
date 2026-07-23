'use client'

import { useState, useCallback } from 'react'
import { NewsCard } from '@/components/feed/news-card'

export function NewsPageClient({ userId }: { userId?: string }) {
  const [cursor, setCursor] = useState<string | null>(null)

  const handleLoadMore = useCallback(async (lastUrl: string) => {
    setCursor(lastUrl)
  }, [])

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
