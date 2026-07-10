'use client'

import { BnFGallicaCard } from '@/components/feed/bnf-gallica-card'

export function GallicaBnfClient() {
  return (
    <div className="w-full">
      <BnFGallicaCard swipeable={true} />
    </div>
  )
}
