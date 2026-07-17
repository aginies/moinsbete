import type { Metadata } from 'next'
import { ImagePixabayClient } from './pixabay-page-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Pixabay Videos | MoinsBête',
  description: 'Découvrez des vidéos aléatoires de Pixabay. Forêt, coucher de soleil, paysage, ciel, plage, chats, chiens, fleurs.',
  openGraph: {
    title: 'Pixabay Videos',
    description: 'Découvrez des vidéos aléatoires de Pixabay',
    type: 'website',
  },
}

export default async function ImagePixabayPage() {
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

      <ImagePixabayClient userId={userId} />
    </div>
  )
}
