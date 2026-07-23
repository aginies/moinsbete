'use client'

import { NewsCard } from '@/components/feed/news-card'

export function NewsPageClient({ userId }: { userId?: string }) {
  return (
    <div className="w-full">
      <NewsCard userId={userId} showToggle={false} />
    </div>
  )
}
