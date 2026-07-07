import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { SujetsClient } from './sujets-client'
import { getRandomFact } from '@/lib/saviez-vous'

export default async function SujetsPage() {
  const session = await getSession()
  const userId = session?.user?.id

  const followedTopicIds = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { following: { select: { id: true } } },
      }).then(u => u?.following.map((t: { id: string }) => t.id) || [])
    : []

  const allTopics = await prisma.topic.findMany({
    where: { parentId: null },
    include: {
      _count: { select: { ideaTopics: true } },
      children: true,
    },
    orderBy: { name: 'asc' },
  })

  const saviezVousFact = await getRandomFact()

  return (
    <SujetsClient
      allTopics={allTopics}
      initialFollowedIds={followedTopicIds}
      saviezVousFact={saviezVousFact}
      userId={userId}
    />
  )
}
