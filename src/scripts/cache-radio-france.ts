import { prisma } from '../lib/db'
import { sleep, cleanupExpired } from '../lib/cache-helpers'

interface RadioEpisode {
  id: string
  title: string
  description: string
  url: string
  radio: string
  section: string
  image?: string
}

const BASE_URL = 'https://www.radiofrance.fr/franceculture/podcasts/bouquet-les-documentaires-de-france-culture'
const TOTAL_PAGES = 75

function slugToName(slug: string): string {
  const map: Record<string, string> = {
    'lsd': 'LSD, la série documentaire',
    'une-histoire-particuliere': 'Une histoire particulière',
    'affaires-sensibles': 'Affaires sensibles',
    'toute-une-vie': 'Toute une vie',
    'salle-des-archives': 'Salle des archives',
    'face-a-l-histoire': "Face à l'histoire",
    'interception': 'Interception',
    'grandes-traversees': 'Les Grandes Traversées',
    'pieds-sur-terre': 'Les Pieds sur terre',
    'semaine-dans-leurs-vies': 'Une semaine dans leurs vies',
    'l-experience': "L'Expérience",
    'des-vies-francaises': 'Des vies françaises',
    'sagas-musicales': 'Les Sagas musicales',
    'grand-reportage': 'Grand Reportage',
    'c-est-bientot-demain': "C'est bientôt demain",
    'autant-en-emporte-l-histoire': "Autant en emporte l'Histoire",
    'les-pieds-sur-terre': 'Les Pieds sur terre',
    'lsd-la-serie-documentaire': 'LSD, la série documentaire',
    'l-experience-2': "L'Expérience",
    'les-grandes-traversees': 'Les Grandes Traversées',
    'une-vie-une-oeuvre': "Une Vie, Une Oeuvre",
    'l-atelier-de-la-creation-14-15': "L'Atelier de la création",
    'meme-pas-mort': 'Même pas mort',
    'au-pays-des-songes': "Au pays des songes",
  }
  if (map[slug]) return map[slug]
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function isValidUrl(url: string): boolean {
  try {
    return new URL(url).origin === 'https://www.radiofrance.fr'
  } catch {
    return false
  }
}

function sanitizeUrl(url: string | null | undefined, fallback = ''): string {
  return url && isValidUrl(url) ? url.trim() : fallback
}

export async function scrapeAndCacheRadioEpisodes(): Promise<void> {
  console.log(`📻 Scraping Radio France (pages 1-${TOTAL_PAGES})...`)
  const allEpisodes: RadioEpisode[] = []
  const seenLinks = new Set<string>()

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      const res = await fetch(`${BASE_URL}?p=${page}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        console.log(`  Page ${page}/${TOTAL_PAGES}: HTTP ${res.status}`)
        continue
      }

      const html = await res.text()
      const episodes: RadioEpisode[] = []
      const blocks = html.split(/<li class="item svelte-1ramkmf"/)

      for (const block of blocks.slice(1)) {
        const urlMatch = block.match(/href="\/franceculture\/podcasts\/([^"]+)"/)
        if (!urlMatch) continue

        const slug = urlMatch[1]
        const url = sanitizeUrl(`https://www.radiofrance.fr/franceculture/podcasts/${slug}`)
        if (!url) continue

        const titleMatch = block.match(/<!--\[-1-->([^<]+(?:<[^>]+>[^<]+)*?)<!--\]-->/)
        const title = titleMatch ? titleMatch[1].trim() : ''
        if (!title) continue

        const descMatch = block.match(/id="subtext-[^"]*"[^>]*><!--\[-1-->([^<]+(?:<[^>]+>[^<]+)*?)<!--\]-->/)
        const description = descMatch ? descMatch[1].trim() : ''

        const imgMatch = block.match(/src="(https:\/\/www\.radiofrance\.fr\/pikapi\/images\/[^"]+\/2048)"/)
        const image = imgMatch ? sanitizeUrl(imgMatch[1]) : undefined

        const podcastSlug = slug.split('/')[0]
        const section = slugToName(podcastSlug)
        const id = slug.replace('/', '-').replace(/\s+/g, '-').toLowerCase()

        episodes.push({ id, title, description, url, radio: 'France Culture', section, image })
      }

      const newEpisodes = episodes.filter(e => !seenLinks.has(e.url))
      if (newEpisodes.length > 0) {
        allEpisodes.push(...newEpisodes)
        newEpisodes.forEach(e => seenLinks.add(e.url))
        console.log(`  Page ${page}/${TOTAL_PAGES}: ${newEpisodes.length} nouveaux épisodes (total: ${allEpisodes.length})`)
      } else {
        console.log(`  Page ${page}/${TOTAL_PAGES}: 0 nouvel épisode`)
      }
    } catch {
      console.log(`  Page ${page}/${TOTAL_PAGES}: erreur`)
    }

    if (page % 20 === 0 && page < TOTAL_PAGES) {
      console.log(`  Pause 10s...`)
      await sleep(10000)
    } else if (page < TOTAL_PAGES) {
      await sleep(3000)
    }
  }

  if (allEpisodes.length === 0) {
    console.log('⚠️ Aucun épisode trouvé')
    return
  }

  console.log(`\n💾 Upsert ${allEpisodes.length} épisodes en DB...`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const upserts = allEpisodes.map(episode => ({
    where: { link: episode.url },
    update: { title: episode.title, description: episode.description, link: episode.url, imageUrl: episode.image, radio: episode.radio, scrapedAt: now, expiresAt },
    create: { title: episode.title, description: episode.description, link: episode.url, imageUrl: episode.image, radio: episode.radio, scrapedAt: now, expiresAt },
  }))
  await prisma.$transaction(upserts.map(u => 
    prisma.cachedRadioEpisode.upsert(u)
  ))
  
  console.log(`  ✅ ${allEpisodes.length} épisodes upserted`)
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-radio-france')) {
  scrapeAndCacheRadioEpisodes()
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
