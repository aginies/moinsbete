import type { Metadata } from 'next'
import { ImageDuJourClient } from './image-du-jour-client'

export const metadata: Metadata = {
  title: 'Image du jour | MoinsBête',
  description: 'Découvrez une image aléatoire de Wikimedia Commons. Image du jour présentée sur MoinsBête.',
  openGraph: {
    title: 'Image du jour',
    description: 'Découvrez une image aléatoire de Wikimedia Commons',
    type: 'website',
  },
}

export default function ImageDuJourPage() {
  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <ImageDuJourClient />
    </div>
  )
}
