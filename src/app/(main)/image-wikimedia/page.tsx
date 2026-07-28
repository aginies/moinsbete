import type { Metadata } from 'next'
import { ImageWikimediaClient } from './image-wikimedia-client'
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
      <ImageWikimediaClient userId={userId} />
    </div>
  )
}
