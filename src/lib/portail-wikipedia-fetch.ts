import { WIKIMEDIA_UA } from './constants'
import { decodeHtmlEntities } from './utils'

export const PORTAL_PAGES = [
  'Wikipédia:Contenus_de_qualité',
  'Wikipédia:Bons_contenus',
]

export const PORTAL_ARTICLE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface PortalArticleData {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

const HEADERS = { 'User-Agent': WIKIMEDIA_UA }

export async function fetchLinksFromPortal(pageTitle: string): Promise<string[]> {
  let allLinks: string[] = []
  let plcontinue: string | null = null

  while (true) {
    const url: string = `https://fr.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(pageTitle)}&pllimit=500&format=json${plcontinue ? `&plcontinue=${encodeURIComponent(plcontinue)}` : ''}`
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) break

      const data = await res.json()
      const pages = data?.query?.pages
      if (!pages) break

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId]
        if (page.links) {
          allLinks = allLinks.concat(page.links.map((l: { title: string }) => l.title))
        }
      }
      plcontinue = data?.continue?.plcontinue
    } catch {
      break
    }

    if (!plcontinue) break
  }

  return allLinks
}

export async function fetchPageWikitext(pageTitle: string): Promise<string> {
  const url = `https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json`
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Wikitext fetch failed: ${res.status}`)
  const data = await res.json()
  const text: string | undefined = data?.parse?.wikitext?.['*']
  if (!text) throw new Error('Wikitext not found in API response')
  return text
}

export async function fetchArticleDetails(titles: string[]): Promise<PortalArticleData[]> {
  if (titles.length === 0) return []

  const BATCH_SIZE = 50
  const allResults: PortalArticleData[] = []

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE)
    const escapedTitles = batch.map(t => encodeURIComponent(t)).join('|')
    const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${escapedTitles}&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=400&exintro=true&explaintext=true&format=json`

    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) continue

      const data = await res.json()
      const pages = data?.query?.pages
      if (!pages) continue

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId]
        if (page.missing) continue

        const title = page.title || ''
        const extract = page.extract || ''
        const imageUrl = page.thumbnail?.source || null
        const pageUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`

        allResults.push({
          id: pageId,
          title: decodeHtmlEntities(title),
          extract: decodeHtmlEntities(extract).replace(/\s+/g, ' ').trim(),
          imageUrl,
          pageUrl,
        })
      }
    } catch {
      // Skip failed batches
    }

    if (i + BATCH_SIZE < titles.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return allResults
}
