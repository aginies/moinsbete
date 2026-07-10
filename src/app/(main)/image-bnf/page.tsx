import type { Metadata } from 'next'
import { ImageBnfClient } from './image-bnf-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Images BNF | MoinsBête',
  description: 'Découvrez des images aléatoires de la Bibliothèque nationale de France. Images BNF, archives numériques gratuites.',
  openGraph: {
    title: 'Images BNF',
    description: 'Découvrez des images aléatoires des Archives BNF',
    type: 'website',
  },
}

export default function ImageBnfPage() {
  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-3xl md:p-6">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <ImageBnfClient />
    </div>
  )
}
