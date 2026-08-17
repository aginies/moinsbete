import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'

async function getArticle(id: string) {
  const article = await prisma.cachedInsoliteArticle.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      imageUrl: true,
    },
  })
  return article
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(decodeURIComponent(id))

  if (!article) {
    return { title: 'Article insolite introuvable | MoinsBête' }
  }

  const shortTitle = article.title.length > 60 ? article.title.slice(0, 60) + '...' : article.title
  const title = `Article insolite - ${shortTitle} | MoinsBête`
  const description = article.description || article.title
  const hasImage = !!article.imageUrl && isValidUrl(article.imageUrl)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: hasImage ? [{ url: article.imageUrl!, width: 1200, height: 800 }] : undefined,
      type: 'article',
      url: `/insolite/${id}`,
      siteName: 'MoinsBête',
      locale: 'fr_FR',
    },
    twitter: {
      card: hasImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: hasImage ? [article.imageUrl!] : undefined,
    },
  }
}

export default async function InsoliteSharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const article = await getArticle(decodedId)

  if (!article) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Article insolite introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cet article n&apos;est plus disponible.
          </p>
          <Link href="/" className="mt-4 hidden text-primary hover:underline md:inline-block">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const hasImage = !!article.imageUrl && isValidUrl(article.imageUrl)

  return (
    <div className="mx-auto w-full px-4 py-8 md:max-w-2xl md:p-6">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <div className="w-full rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-5 dark:border-purple-700 dark:from-purple-950/30 dark:to-violet-950/30">
        {hasImage && (
          <div className="mb-3 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800">
            <Image
              src={article.imageUrl!}
              alt={article.title}
              width={1200}
              height={800}
              className="w-full max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800"
              unoptimized
            />
          </div>
        )}

        <h1 className="text-lg font-bold text-purple-900 dark:text-purple-100">
          {article.title}
        </h1>
        {article.description && (
          <p className="mt-2 text-sm leading-relaxed text-purple-800 dark:text-purple-200">
            {article.description}
          </p>
        )}

        <div className="mt-3">
          <Link
            href={sanitizeUrl(article.url, '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Lire l&apos;article
          </Link>
        </div>
      </div>
    </div>
  )
}
