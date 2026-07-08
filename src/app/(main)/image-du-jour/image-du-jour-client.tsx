'use client'

import { WikipediaImageCard } from '@/components/feed/wikipedia-image-card'

export function ImageDuJourClient() {
  return (
    <div className="w-full">
      <WikipediaImageCard fullImage showLink={false} />
    </div>
  )
}
