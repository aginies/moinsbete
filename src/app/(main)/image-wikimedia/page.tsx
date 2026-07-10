import type { Metadata } from 'next'
import { ImageWikimediaClient } from './image-wikimedia-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Wikimedia | MoinsBête',
  description: 'Découvrez des images aléatoires de Wikimedia Commons. Wikimedia, archives numériques gratuites.',
  openGraph: {
    title: 'Wikimedia',
    description: 'Découvrez des images aléatoires de Wikimedia Commons',
    type: 'website',
  },
}

export default async function ImageWikimediaPage() {
  const session = await getSession()
  const userId = session?.user?.id

  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <ImageWikimediaClient userId={userId} />
    </div>
  )
}
