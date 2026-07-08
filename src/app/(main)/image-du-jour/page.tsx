import type { Metadata } from 'next'
import { ImageDuJourClient } from './image-du-jour-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-center px-4 py-8 md:max-w-3xl md:p-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-center">Image du jour</h1>

      <ImageDuJourClient />
    </div>
  )
}
