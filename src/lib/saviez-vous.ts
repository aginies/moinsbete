import { prisma } from '@/lib/db'
import { resolveWikimediaImageUrls } from '@/lib/utils'

export async function getRandomFact() {
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
    if (resolved[0]?.imageFilename && !resolved[0].imageFilename.startsWith('http')) {
      await prisma.saviezVousFact.update({
        where: { id: fact.id },
        data: { imageFilename: resolved[0].imageFilename },
      })
    }
    return {
      text: fact.text,
      sourceUrl: fact.sourceUrl,
      imageFilename: resolved[0]?.imageFilename ?? null,
    }
  } catch {
    return null
  }
}
