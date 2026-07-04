import { prisma } from '@/lib/db'

export const topicCache = new Map<string, { children: string[]; expiresAt: number }>()
const COLLECTION_CACHE_TTL = 5 * 60 * 1000

function setTopicChildren(topicId: string, children: string[]) {
  topicCache.set(topicId, {
    children,
    expiresAt: Date.now() + COLLECTION_CACHE_TTL,
  })
}

export async function getAllDescendantTopicIds(topicSlug: string): Promise<string[]> {
  const cached = topicCache.get(topicSlug)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.children
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
  if (cached && cached.expiresAt > Date.now()) {
    return cached.children
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
