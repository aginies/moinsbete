import type { Metadata } from 'next'
import { ImagePicrylClient } from './image-picryl-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Images Picryl | MoinsBête',
  description: 'Découvrez des images aléatoires de Picryl, archives publiques françaises. Images Picryl, archives numériques gratuites.',
  openGraph: {
    title: 'Images Picryl',
    description: 'Découvrez des images aléatoires des Archives Picryl',
    type: 'website',
  },
}

export default function ImagePicrylPage() {
  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <ImagePicrylClient />
    </div>
  )
}
