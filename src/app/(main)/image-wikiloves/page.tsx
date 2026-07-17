import type { Metadata } from 'next'
import { ImageWikiLovesClient } from './image-wikiloves-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Wiki Loves | MoinsBête',
  description: 'Découvrez des images aléatoires des campagnes Wiki Loves sur Wikimedia Commons.',
  openGraph: {
    title: 'Wiki Loves',
    description: 'Découvrez des images aléatoires des campagnes Wiki Loves',
    type: 'website',
  },
}

export default async function ImageWikiLovesPage() {
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

      <ImageWikiLovesClient userId={userId} />
    </div>
  )
}
