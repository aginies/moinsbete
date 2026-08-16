'use client'

import { ApodCard } from '@/components/feed/apod-card'

export function ApodClient({ initialDate }: { initialDate?: string }) {
  return (
    <div className="w-full">
      <ApodCard fullImage showLink={false} showToggle={false} swipeable={true} initialDate={initialDate} />
    </div>
  )
}
