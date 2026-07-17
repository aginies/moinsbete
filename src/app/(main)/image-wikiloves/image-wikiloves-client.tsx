'use client'

import { ImageWikiLovesCard } from '@/components/feed/image-wikiloves-card'

interface ImageWikiLovesClientProps {
  userId?: string
}

export function ImageWikiLovesClient({ userId }: ImageWikiLovesClientProps) {
  return (
    <div className="w-full">
      <ImageWikiLovesCard fullImage showToggle={false} swipeable={true} userId={userId} enableAutoRefresh={true} />
    </div>
  )
}
