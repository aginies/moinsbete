'use client'

import { ImagePicrylCard } from '@/components/feed/image-picryl-card'

export function ImagePicrylClient() {
  return (
    <div className="w-full">
      <ImagePicrylCard fullImage showToggle={false} swipeable={true} />
    </div>
  )
}
