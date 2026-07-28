import type { Metadata } from 'next'
import { ImagePixabayClient } from './pixabay-page-client'
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
      <ImagePixabayClient userId={userId} />
    </div>
  )
}
