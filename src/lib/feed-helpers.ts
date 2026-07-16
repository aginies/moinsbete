import { prisma } from '@/lib/db'
import type { IdeaTopic, IdeaSource } from '@/types/idea'
import { createTtlCache } from '@/lib/ttl-cache'

export const topicCache = createTtlCache<string[]>({ ttlMs: 5 * 60 * 1000 })

function setTopicChildren(topicId: string, children: string[]) {
  topicCache.set(topicId, children)
}

export async function getAllDescendantTopicIds(topicSlug: string): Promise<string[]> {
  const cached = topicCache.get(topicSlug)
  if (cached !== null) {
    return cached
  }

  const topicRecord = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    select: { id: true, children: { select: { id: true } } },
  })

  if (!topicRecord) return []

  const allIds = new Set<string>()
  allIds.add(topicRecord.id)
  const queue = topicRecord.children.map((c: { id: string }) => c.id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (allIds.has(currentId)) continue
    allIds.add(currentId)
    const children = await prisma.topic.findMany({
      where: { parentId: currentId },
      select: { id: true },
    })
    queue.push(...children.map((c: { id: string }) => c.id))
  }

  setTopicChildren(topicSlug, Array.from(allIds))
  return Array.from(allIds)
}

export async function getAllDescendantCollectionTopicIds(collectionSlug: string): Promise<string[]> {
  const cachedKey = `collection:${collectionSlug}`
  const cached = topicCache.get(cachedKey)
  if (cached !== null) {
    return cached
  }

  const collectionRecord = await prisma.collection.findUnique({
    where: { slug: collectionSlug },
    select: { topics: { select: { id: true, children: { select: { id: true } } } } },
  })

  if (!collectionRecord) return []

  const allIds = new Set<string>()
  const queue = collectionRecord.topics.map((t: { id: string }) => t.id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (allIds.has(currentId)) continue
    allIds.add(currentId)
    const children = await prisma.topic.findMany({
      where: { parentId: currentId },
      select: { id: true },
    })
    queue.push(...children.map((c: { id: string }) => c.id))
  }

  setTopicChildren(cachedKey, Array.from(allIds))
  return Array.from(allIds)
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
