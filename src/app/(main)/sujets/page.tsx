import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { SujetsClient } from './sujets-client'
import { getRandomFact } from '@/lib/saviez-vous'

export const dynamic = 'force-dynamic'

export default async function SujetsPage() {
  const session = await getSession()
  const userId = session?.user?.id

  const followedTopicIds = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          following: { select: { id: true } },
          saviezVousCardVisible: true,
          wikipediaImageCardVisible: true,
          radioFranceCardVisible: true,
          imageWikimediaCardVisible: true,
          imageWikiLovesCardVisible: true,
          imagePixabayCardVisible: true,
          portailLexicalCardVisible: true,
          proverbeCardVisible: true,
          cnrsNewsEnabled: true,
        },
      }).then(u => ({
        topicIds: u?.following.map((t: { id: string }) => t.id) || [],
        visibility: u ? {
          saviezVous: u.saviezVousCardVisible ?? true,
          wikipedia: u.wikipediaImageCardVisible ?? true,
          radioFrance: u.radioFranceCardVisible ?? true,
          wikimedia: u.imageWikimediaCardVisible ?? true,
          wikiloves: u.imageWikiLovesCardVisible ?? true,
          pixabay: u.imagePixabayCardVisible ?? true,
          portailLexical: u.portailLexicalCardVisible ?? true,
          proverbe: u.proverbeCardVisible ?? true,
          cnrs: u.cnrsNewsEnabled ?? true,
        } : undefined,
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

  const saviezVousFact = await getRandomFact()

  return (
    <>
      {process.env.REGISTRATION_LOCKED !== 'false' && (
        <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6 md:pb-6">
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              AMÉLIORATION EN COURS DE LA DB DES SUJETS
            </div>
            <div className="mt-1 text-sm font-medium text-amber-700">
              AUCUNE SAUVEGARDE NE SERA EFFECTUÉE PENDANT CETTE MAJ
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
        csrfToken=""
      />
    </>
  )
}
