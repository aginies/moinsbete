import { F1Card } from '@/components/feed/f1-card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export const metadata = {
  title: 'Formule 1 | MoinsBête',
  description: 'Actualités F1, classements, image du jour et le saviez-vous - Formule 1',
  openGraph: {
    title: 'Formule 1',
    description: 'Actualités et infos Formule 1 de MoinsBête',
    type: 'website',
  },
}

export default async function F1Page() {
  const session = await getSession()
  const userId = session?.user?.id

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col px-0 py-8 md:max-w-4xl md:p-6">
      <div className="px-4 md:px-0">
        <Link
          href="/sujets"
          className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sujets
        </Link>
      </div>

      <F1Card userId={userId} />
    </div>
  )
}
