import { getSession } from '@/lib/auth'
import { NewsPageClient } from './news-page-client'

export const metadata = {
  title: 'News | MoinsBête',
  description: 'Actualités internationales - Monde, Technologie, Business, Science et plus.',
  openGraph: {
    title: 'News',
    description: 'Actualités internationales de MoinsBête',
    type: 'website',
  },
}

export default async function NewsPage() {
  const session = await getSession()
  const userId = session?.user?.id

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center px-4 py-8 md:max-w-4xl md:p-6">
      <NewsPageClient userId={userId} />
    </div>
  )
}
