import type { Metadata } from 'next'
import { ImageWikiLovesClient } from './image-wikiloves-client'
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
      <ImageWikiLovesClient userId={userId} />
    </div>
  )
}
