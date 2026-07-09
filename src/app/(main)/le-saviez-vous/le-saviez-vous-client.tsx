'use client'

import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

interface LeSaviezVousClientProps {
  id: string
  text: string
  sourceUrl: string | null
  imageFilename: string | null
}

export function LeSaviezVousClient({ id, text, sourceUrl, imageFilename }: LeSaviezVousClientProps) {
  return (
    <div className="w-full">
      <SaviezVousCard id={id} text={text} sourceUrl={sourceUrl} imageFilename={imageFilename} showLink={false} imageHeight="h-[500px]" />
    </div>
  )
}
