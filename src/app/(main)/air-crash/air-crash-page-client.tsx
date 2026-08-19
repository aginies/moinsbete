'use client'

import { AirCrashCard } from '@/components/feed/air-crash-card'

export function AirCrashPageClient() {
  return (
    <div className="w-full">
      <AirCrashCard showLink={false} showToggle={false} />
    </div>
  )
}
