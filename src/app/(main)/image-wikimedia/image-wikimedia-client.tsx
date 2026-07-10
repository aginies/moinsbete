'use client'

import { ImageWikimediaCard } from '@/components/feed/image-wikimedia-card'

export function ImageWikimediaClient() {
  return (
    <div className="w-full">
      <ImageWikimediaCard fullImage showToggle={false} swipeable={true} />
    </div>
  )
}
