import { prisma } from '../lib/db'
import { resolveWikimediaImageUrlsViaREST } from '../lib/utils'

async function resolveViaQueryApi(filenames: string[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>()
  if (filenames.length === 0) return urlMap

  const titles = filenames.map(f => `File:${f}`).join('|')
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
      { headers: { 'User-Agent': 'moinsbete/1.0' } }
    )
    if (!res.ok) return urlMap
    const data = await res.json()
    const pages = data?.query?.pages || {}
    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      const url = page?.imageinfo?.[0]?.url
      if (url) {
        const filename = page.title.replace(/^File:/, '')
        urlMap.set(filename, url)
      }
    }
  } catch {
    // Fall through
  }
  return urlMap
}

export async function scrapeAndCacheSaviezVousImages(): Promise<void> {
  console.log('📸 Resolving Saviez-vous image URLs...')

  const facts = await prisma.saviezVousFact.findMany({
    where: {
      imageFilename: {
        not: null,
      },
    },
    select: { id: true, imageFilename: true },
  })

  const pending = facts.filter(f => f.imageFilename && f.imageFilename.length > 0 && !f.imageFilename.startsWith('http'))
  if (pending.length === 0) {
    console.log('  No pending images to resolve')
    return
  }

  console.log(`  ${pending.length} facts with unresolved images`)

  const filenames = pending.map(f => f.imageFilename!)
  const resolved = new Map<string, string>()

  // Try query API first
  console.log('  Attempting query API resolution...')
  const queryUrls = await resolveViaQueryApi(filenames)
  for (const [filename, url] of queryUrls) {
    resolved.set(filename, url)
  }
  console.log(`    ${queryUrls.size} resolved via query API`)

  // Try REST API for remaining
  const remaining = filenames.filter(f => !resolved.has(f))
  if (remaining.length > 0) {
    console.log(`  Attempting REST API resolution for ${remaining.length} remaining...`)
    const restUrls = await resolveWikimediaImageUrlsViaREST(remaining)
    for (const [filename, url] of restUrls) {
      resolved.set(filename, url)
    }
    console.log(`    ${restUrls.size} resolved via REST API`)
  }

  // Fallback: Special:FilePath for still unresolved
  const stillMissing = filenames.filter(f => !resolved.has(f))
  for (const filename of stillMissing) {
    resolved.set(filename, `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`)
  }
  if (stillMissing.length > 0) {
    console.log(`    ${stillMissing.length} fell back to Special:FilePath`)
  }

  // Bulk update
  const updates = pending.map(fact =>
    prisma.saviezVousFact.update({
      where: { id: fact.id },
      data: { imageFilename: resolved.get(fact.imageFilename!) || fact.imageFilename },
    })
  )

  const batchSize = 50
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    await prisma.$transaction(batch)
  }

  console.log(`  ✅ Updated ${pending.length} facts`)
}

if (process.argv[1]?.includes('cache-saviez-vous-images')) {
  scrapeAndCacheSaviezVousImages()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch(e => {
      console.error('Erreur:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
