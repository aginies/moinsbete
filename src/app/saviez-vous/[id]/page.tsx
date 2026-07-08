import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

async function getFact(id: string) {
  return prisma.saviezVousFact.findUnique({
    where: { id },
    select: {
      id: true,
      text: true,
      sourceUrl: true,
      imageFilename: true,
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const fact = await getFact(id)

  if (!fact) {
    return { title: 'Le saviez-vous ? introuvable | MoinsBête' }
  }

  return {
    title: `Le saviez-vous ? - ${fact.text.slice(0, 50)}... | MoinsBête`,
    description: fact.text,
    openGraph: {
      title: `Le saviez-vous ? - ${fact.text.slice(0, 60)}...`,
      description: fact.text,
      type: 'article',
      url: `/saviez-vous/${id}`,
      siteName: 'MoinsBête',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: `Le saviez-vous ? - ${fact.text.slice(0, 60)}...`,
      description: fact.text,
    },
  }
}

export default async function SaviezVousPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fact = await getFact(id)

  if (!fact) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Le saviez-vous ? introuvable</h1>
          <Link href="/" className="mt-4 text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-4 py-8 md:max-w-2xl md:p-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <SaviezVousCard
        id={fact.id}
        text={fact.text}
        sourceUrl={fact.sourceUrl}
        imageFilename={fact.imageFilename}
      />
    </div>
  )
}
