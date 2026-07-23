import { getSession } from '@/lib/auth'
import { NewsPageClient } from './news-page-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
      <Link
        href="/"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <NewsPageClient userId={userId} />
    </div>
  )
}
