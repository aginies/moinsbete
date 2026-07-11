'use client'

import { ImageWikimediaCard } from '@/components/feed/image-wikimedia-card'

interface ImageWikimediaClientProps {
  userId?: string
}

export function ImageWikimediaClient({ userId }: ImageWikimediaClientProps) {
  return (
    <div className="w-full">
      <ImageWikimediaCard fullImage showToggle={false} swipeable={true} userId={userId} enableAutoRefresh={true} />
    </div>
  )
}
