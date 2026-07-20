import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { decodeImageFromUrl } from '@/lib/image-url-encoder'
import { sanitizeUrl } from '@/lib/utils'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>
}): Promise<Metadata> {
  const { d } = await searchParams
  const image = d ? decodeImageFromUrl(d) : null
  
  if (!image) {
    return { title: 'Image du jour | MoinsBête' }
  }

  return {
    title: `Image du jour - ${image.description.slice(0, 60)}... | MoinsBête`,
    description: image.description,
    openGraph: {
      title: `Image du jour - ${image.description.slice(0, 60)}...`,
      description: image.description,
      images: [{ url: image.imageUrl, width: 1200, height: 800 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Image du jour - ${image.description.slice(0, 60)}...`,
      description: image.description,
      images: [image.imageUrl],
    },
  }
}

export default async function ImageDuJourSharePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>
}) {
  const { d } = await searchParams
  const image = d ? decodeImageFromUrl(d) : null

  if (!image) {
    return (
      <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-3xl md:p-6">
        <Link
          href="/image-du-jour"
          className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Image introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Les données de l&apos;image sont invalides ou corrompues.
          </p>
          <Link
            href="/image-du-jour"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Découvrir une image aléatoire →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-3xl md:p-6">
      <Link
        href="/image-du-jour"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <div className="w-full rounded-xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 dark:border-teal-700 dark:from-teal-950/30 dark:to-emerald-950/30">
        <div className="mb-3 overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800">
          <Image
            src={image.imageUrl}
            alt={image.description}
            width={1200}
            height={800}
            className="w-full max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800"
            unoptimized
          />
        </div>

        <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100">
          {image.description}
        </p>

        <div className="mt-3">
          <Link
            href={sanitizeUrl(image.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Voir sur Wikimedia Commons
          </Link>
        </div>
      </div>
    </div>
  )
}
