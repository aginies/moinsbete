import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import { LeSaviezVousClient } from './le-saviez-vous-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function getRandomFact() {
  const total = await prisma.saviezVousFact.count()
  if (total === 0) return null
  
  const randomOffset = Math.floor(Math.random() * total)
  const [fact] = await prisma.saviezVousFact.findMany({
    skip: randomOffset,
    take: 1,
    select: { id: true, text: true, sourceUrl: true, imageFilename: true },
  })
  
  return fact
}

export async function generateMetadata(): Promise<Metadata> {
  const fact = await getRandomFact()
  
  if (!fact) {
    return {
      title: 'Le saviez-vous ? | MoinsBête',
      description: 'Découvrez des faits surprenants tirés de Wikipédia.',
    }
  }

  return {
    title: `Le saviez-vous ? - ${fact.text.slice(0, 50)}... | MoinsBête`,
    description: fact.text,
    openGraph: {
      title: `Le saviez-vous ? - ${fact.text.slice(0, 60)}...`,
      description: fact.text,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `Le saviez-vous ? - ${fact.text.slice(0, 60)}...`,
      description: fact.text,
    },
  }
}

export default async function LeSaviezVousPage() {
  const fact = await getRandomFact()

  if (!fact) {
    return (
      <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-3xl md:p-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Le saviez-vous ?</h1>
          <p className="text-muted-foreground">Aucun fait disponible pour le moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-3xl md:p-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-center">Le saviez-vous ?</h1>

      <LeSaviezVousClient
        id={fact.id}
        text={fact.text}
        sourceUrl={fact.sourceUrl}
        imageFilename={fact.imageFilename}
      />
    </div>
  )
}
