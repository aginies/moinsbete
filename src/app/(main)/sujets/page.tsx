import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { SujetsClient } from './sujets-client'
import { getRandomFact } from '@/lib/saviez-vous'
import { getGlobalCardVisibility } from '@/actions/card-actions'
import { Splash } from '@/components/splash'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moinsbete.guibo.com'
  return {
    title: 'Tous les sujets | MoinsBête',
    description: 'Explorez des sujets variés : psychologie, philosophie, productivité, sciences cognitives, économie, histoire, créativité, santé et bien-être, et bien plus encore.',
    openGraph: {
      title: 'Tous les sujets - MoinsBête',
      description: 'Explorez des sujets variés et découvrez des idées pour élargir vos connaissances.',
      type: 'website',
      url: `${baseUrl}/sujets`,
      siteName: 'MoinsBête',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: 'Tous les sujets - MoinsBête',
      description: 'Explorez des sujets variés et découvrez des idées pour élargir vos connaissances.',
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/sujets`,
    },
  }
}

export default async function SujetsPage() {
  const session = await getSession()
  const userId = session?.user?.id
  const t = await getTranslations('feed')

  const followedTopicIds = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          following: { select: { id: true } },
          saviezVousCardVisible: true,
          wikipediaImageCardVisible: true,
          wikipediaImageShowEn: true,
          radioFranceCardVisible: true,
          imageWikimediaCardVisible: true,
          imageWikiLovesCardVisible: true,
          imagePixabayCardVisible: true,
          imagePixabayShowCategories: true,
          imagePixabayActiveCategory: true,
          portailLexicalCardVisible: true,
          portailWikipediaCardVisible: true,
          proverbeCardVisible: true,
          cnrsNewsEnabled: true,
          newsCardVisible: true,
          f1CardVisible: true,
          citationCardVisible: true,
          insoliteCardVisible: true,
          apodCardVisible: true,
          airCrashCardVisible: true,
          hasSeenSplash: true,
          cardNavBarEnabled: true,
        },
      }).then(u => ({
        topicIds: u?.following.map((t: { id: string }) => t.id) || [],
        visibility: u ? {
          saviezVous: u.saviezVousCardVisible ?? true,
          wikipedia: u.wikipediaImageCardVisible ?? true,
          wikipediaShowEn: u.wikipediaImageShowEn ?? false,
          radioFrance: u.radioFranceCardVisible ?? true,
          wikimedia: u.imageWikimediaCardVisible ?? true,
          wikiloves: u.imageWikiLovesCardVisible ?? true,
          pixabay: u.imagePixabayCardVisible ?? true,
          pixabayActiveCategory: u.imagePixabayActiveCategory ?? 'bird',
          portailLexical: u.portailLexicalCardVisible ?? true,
          portailWikipedia: u.portailWikipediaCardVisible ?? true,
          proverbe: u.proverbeCardVisible ?? true,
          cnrs: u.cnrsNewsEnabled ?? true,
          news: u.newsCardVisible ?? true,
          f1: u.f1CardVisible ?? true,
          citation: u.citationCardVisible ?? true,
          insolite: u.insoliteCardVisible ?? true,
          apod: u.apodCardVisible ?? true,
          airCrash: u.airCrashCardVisible ?? true,
        } : undefined,
        hasSeenSplash: u?.hasSeenSplash ?? false,
        cardNavBarEnabled: u?.cardNavBarEnabled ?? true,
      }))
    : null

  const allTopics = await prisma.topic.findMany({
    where: { parentId: null },
    include: {
      children: true,
    },
    orderBy: { name: 'asc' },
  })

  const allTopicIds = allTopics.map(t => t.id)

  const followedTopicIdsFinal = followedTopicIds
    ? followedTopicIds.topicIds
    : allTopicIds

  const initialVisibility = followedTopicIds?.visibility
  const hasSeenSplash = followedTopicIds?.hasSeenSplash ?? true
  const cardNavBarEnabled = followedTopicIds?.cardNavBarEnabled ?? true

  const saviezVousFact = await getRandomFact()

  const globalVisibility = await getGlobalCardVisibility()

  return (
    <>
      {!hasSeenSplash && userId && <Splash userId={userId} />}
      {process.env.REGISTRATION_LOCKED !== 'false' && (
        <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6 md:pb-6">
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              {t('db_maintenance_title')}
            </div>
            <div className="mt-1 text-sm font-medium text-amber-700">
              {t('db_maintenance_desc')}
            </div>
          </div>
        </div>
      )}

      <SujetsClient
        allTopics={allTopics}
        initialFollowedIds={followedTopicIdsFinal}
        saviezVousFact={saviezVousFact}
        userId={userId}
        initialVisibility={initialVisibility}
        globalVisibility={globalVisibility}
        cardNavBarEnabled={cardNavBarEnabled}
      />
    </>
  )
}
