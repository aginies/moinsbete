import { prisma } from '@/lib/db'
import type { IdeaTopic, IdeaSource } from '@/types/idea'
import { createRedisTtlCache } from '@/lib/redis-cache'

export const topicCache = createRedisTtlCache<string[]>({ ttlMs: 5 * 60 * 1000 })

function setTopicChildren(topicId: string, children: string[]) {
  topicCache.set(topicId, children)
}

export async function getAllDescendantTopicIds(topicSlug: string): Promise<string[]> {
  const cached = await topicCache.get(topicSlug)
  if (cached !== null) {
    return cached
  }

  const topicRecord = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    select: { id: true },
  })

  if (!topicRecord) return []

  const rows = await prisma.$queryRaw<string[]>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM Topic WHERE id = ${topicRecord.id}
      UNION ALL
      SELECT t.id FROM Topic t
      INNER JOIN descendants d ON t."parentId" = d.id
    )
    SELECT id FROM descendants
  `

  const allIds = rows.map((row: any) => row.id)

  setTopicChildren(topicSlug, allIds)
  return allIds
}

export async function getAllDescendantCollectionTopicIds(collectionSlug: string): Promise<string[]> {
  const cachedKey = `collection:${collectionSlug}`
  const cached = await topicCache.get(cachedKey)
  if (cached !== null) {
    return cached
  }

  const collectionRecord = await prisma.collection.findUnique({
    where: { slug: collectionSlug },
    select: { topics: { select: { id: true } } },
  })

  if (!collectionRecord || collectionRecord.topics.length === 0) return []

  const topicIds = collectionRecord.topics.map((t: { id: string }) => t.id)
  const placeholders = topicIds.map(() => '?').join(',')
  const rows = await prisma.$queryRawUnsafe<string[]>(
    `WITH RECURSIVE descendants AS (
      SELECT id FROM Topic WHERE id IN (${placeholders})
      UNION ALL
      SELECT t.id FROM Topic t
      INNER JOIN descendants d ON t."parentId" = d.id
    )
    SELECT id FROM descendants`,
    ...topicIds
  )

  const allIds = rows.map((row: any) => row.id)

  setTopicChildren(cachedKey, allIds)
  return allIds
}

export function mapIdeaWithTopics(idea: { ideaTopics: Array<{ topic: IdeaTopic }> }): IdeaTopic[] {
  return idea.ideaTopics.map(it => it.topic)
}

export function mapIdeaWithSourceAndTopics(
  idea: {
    id: string
    title: string
    slug: string
    source: IdeaSource
    ideaTopics: Array<{ topic: IdeaTopic }>
  }
): { id: string; title: string; slug: string; source: IdeaSource; topics: IdeaTopic[] } {
  return {
    id: idea.id,
    title: idea.title,
    slug: idea.slug,
    source: idea.source,
    topics: mapIdeaWithTopics(idea),
  }
}
