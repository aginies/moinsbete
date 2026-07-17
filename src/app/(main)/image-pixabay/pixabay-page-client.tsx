'use client'

import { ImagePixabayCard } from '@/components/feed/image-pixabay-card'

interface ImagePixabayClientProps {
  userId?: string
}

export function ImagePixabayClient({ userId }: ImagePixabayClientProps) {
  return (
    <div className="w-full">
      <ImagePixabayCard fullImage showToggle={false} swipeable={true} userId={userId} enableAutoRefresh={true} />
    </div>
  )
}
