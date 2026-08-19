'use client'

import { InsoliteCard } from '@/components/feed/insolite-card'

export function InsolitePageClient() {
  return (
    <div className="w-full">
      <InsoliteCard showLink={false} showToggle={false} />
    </div>
  )
}
