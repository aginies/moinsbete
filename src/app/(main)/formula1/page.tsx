import type { Metadata } from 'next'
import { F1Card } from '@/components/feed/f1-card'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
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
    <div className="mx-auto flex min-h-screen w-full flex-col px-4 py-8 md:max-w-4xl md:p-6">
      <F1Card userId={userId} showToggle={false} />
    </div>
  )
}
