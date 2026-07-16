import { prisma } from '@/lib/db'
import { resolveWikimediaImageUrls } from '@/lib/utils'
import { createTtlCache } from '@/lib/ttl-cache'

interface SaviezVousFact {
  id: string
  text: string
  sourceUrl: string | null
  imageFilename: string | null
}

export const factCache = createTtlCache<SaviezVousFact>({ ttlMs: 5 * 60 * 1000 })

export async function getRandomFact(): Promise<SaviezVousFact | null> {
  const today = new Date().toDateString()
  const cachedKey = `random:${today}`
  const cached = factCache.get(cachedKey)
  
  if (cached !== null) {
    return cached
  }

  try {
    const total = await prisma.saviezVousFact.count()
    if (total === 0) return null

    const randomOffset = Math.floor(Math.random() * total)
    const [fact] = await prisma.saviezVousFact.findMany({
      skip: randomOffset,
      take: 1,
      select: { id: true, text: true, sourceUrl: true, imageFilename: true },
    })
    if (!fact) return null

    const resolved = await resolveWikimediaImageUrls([{ id: fact.id, imageFilename: fact.imageFilename }])
    if (resolved[0]?.imageFilename?.startsWith('http')) {
      await prisma.saviezVousFact.update({
        where: { id: fact.id },
        data: { imageFilename: resolved[0].imageFilename },
      })
    }
    
    const factResult = {
      id: fact.id,
      text: fact.text,
      sourceUrl: fact.sourceUrl,
      imageFilename: resolved[0]?.imageFilename ?? null,
    }
    
    factCache.set(cachedKey, factResult)
    return factResult
  } catch {
    return null
  }
}
