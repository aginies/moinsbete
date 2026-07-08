import { RadioFranceDoc } from '@/data/radio-france'

const VALID_ORIGINS = ['https://www.radiofrance.fr', 'https://radiofrance.fr']
const BASE_PATH = '/franceculture/podcasts/'

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return VALID_ORIGINS.includes(parsed.origin)
  } catch {
    return false
  }
}

function sanitizeUrl(url: string | null | undefined, fallback: string = ''): string {
  if (url && isValidUrl(url)) {
    return url.trim()
  }
  return fallback
}

const PODCAST_NAME_MAP: Record<string, string> = {
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
  'contre-vents': 'Contre vents',
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

const BASE_URL = 'https://www.radiofrance.fr/franceculture/podcasts/bouquet-les-documentaires-de-france-culture'
const TOTAL_PAGES = 151

function slugToName(slug: string): string {
  if (PODCAST_NAME_MAP[slug]) return PODCAST_NAME_MAP[slug]
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function fetchPodcastPage(page: number): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}?p=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export function parseEpisodesFromHtml(html: string): RadioFranceDoc[] {
  const episodes: RadioFranceDoc[] = []
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

    const dateArea = block.match(/AdditionalInfos[^>]*>([\s\S]*?)<\/div>/)
    let date = ''
    if (dateArea) {
      const dm = dateArea[1].match(/<!--\[-1--><!--\]-->([^<]+)<\!---->/)
      date = dm ? dm[1].trim() : ''
    }

    const durMatch = block.match(/Playable-state[^>]*>.*?<!---->\s*([\d]+ min)\s*<!--\[-1-->/)
    const duration = durMatch ? durMatch[1].trim() : ''

    const podcastSlug = slug.split('/')[0]
    const section = slugToName(podcastSlug)

    const id = slug.replace('/', '-').replace(/\s+/g, '-').toLowerCase()

    episodes.push({
      id,
      title,
      description,
      url,
      radio: 'France Culture',
      section,
      image,
    })
  }

  return episodes
}

export async function fetchRandomEpisode(excludeId?: string): Promise<RadioFranceDoc | null> {
  const totalPages = TOTAL_PAGES
  let attempts = 0
  const maxAttempts = 20

  while (attempts < maxAttempts) {
    const page = Math.floor(Math.random() * totalPages) + 1
    const html = await fetchPodcastPage(page)
    if (!html) {
      attempts++
      continue
    }

    const episodes = parseEpisodesFromHtml(html)
    if (episodes.length === 0) {
      attempts++
      continue
    }

    const filtered = excludeId ? episodes.filter(e => e.id !== excludeId) : episodes
    if (filtered.length === 0) {
      attempts++
      continue
    }

    return filtered[Math.floor(Math.random() * filtered.length)]
  }

  return null
}
