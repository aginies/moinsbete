/**
 * Shared Wikipedia F1 portal parsers.
 *
 * Extracted from src/scripts/cache-f1.ts and src/app/api/f1/route.ts
 * to eliminate duplicate regex logic and interface definitions.
 */

// ── Shared types ────────────────────────────────────────────────────────────

export interface F1Actualite {
  title: string
  date: string
  content: string
  url: string
}

export interface F1Image {
  imageUrl: string
  caption: string
  articleLink: string
}

export interface F1StandingRow {
  pos: number
  name: string
  points: string
}

export interface F1Standing {
  type: 'pilotes' | 'constructeurs'
  rows: F1StandingRow[]
}

export interface F1SaviezVous {
  facts: string[]
}

// ── Utility ─────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const WIKI_API = 'https://fr.wikipedia.org/w/api.php'

async function fetchWikiPage(page: string): Promise<string | null> {
  try {
    const data = await fetch(
      `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`,
      {
        headers: {
          'User-Agent': 'moinsbete/1.0 (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)',
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!data.ok) return null

    const json = await data.json()
    if (!json?.parse?.text?.['*']) return null

    return json.parse.text['*']
  } catch {
    return null
  }
}

// ── Parsers — portal page (Portail:Formule_1) ──────────────────────────────

/**
 * Parse news items from the portal page's "Actualités" section.
 * Expects the HTML of `Portail:Formule_1`.
 */
export function parseActualitesFromPortal(html: string): F1Actualite[] {
  const articles: F1Actualite[] = []

  const actualiteMatch = html.match(
    /<span class="boite-coloree-titre">Actualités<\/span>([\s\S]*?)<div class="boite-coloree-contenu">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/
  )
  if (!actualiteMatch) return articles

  const content = actualiteMatch[2]
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g
  let match

  while ((match = liRegex.exec(content)) !== null) {
    const li = match[1]
    const timeMatch = li.match(/<time[^>]*datetime="([^"]*)"[^>]*>([\s\S]*?)<\/time>/)
    const linkMatch = li.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/)

    if (!timeMatch || !linkMatch) continue

    const date = timeMatch[1]
    const dateDisplay = timeMatch[2] ? stripHtml(timeMatch[2]) : date
    const title = stripHtml(linkMatch[2]).trim()
    const url = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://fr.wikipedia.org${linkMatch[1]}`

    if (title && url) {
      articles.push({ title, date: dateDisplay, content: '', url })
    }
  }

  return articles.slice(0, 5)
}

/**
 * Parse the "L'image du jour" section from the portal page.
 */
export function parseImageDuJour(html: string): F1Image | null {
  // Find the L'image du jour section - capture until next section header
  const imageMatch = html.match(
    /<span class="boite-coloree-titre">L\'image du jour<\/span>([\s\S]*?)(?=<span class="boite-coloree-titre">)/
  )
  if (!imageMatch) return null

  const content = imageMatch[1]
  const imgMatch = content.match(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/)
  if (!imgMatch) return null

  const imageUrl = imgMatch[2].startsWith('//') ? `https:${imgMatch[2]}` : imgMatch[2]
  const caption = imgMatch[1] || ''

  // Convert Wikimedia thumbnail to full-size image
  let fullImageUrl = imageUrl
  if (imageUrl.includes('/thumb/')) {
    const thumbMatch = imageUrl.match(
      /^(https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\/)([^\/]+\/[^\/]+\.jpg)\//
    )
    if (thumbMatch) {
      fullImageUrl = `${thumbMatch[1]}${thumbMatch[2]}`
    }
  }

  const linkMatch = content.match(
    /<a[^>]*href="([^"]*)"[^>]*class="mw-file-description"[^>]*>/
  )
  const articleLink = linkMatch
    ? linkMatch[1].startsWith('http')
      ? linkMatch[1]
      : `https://fr.wikipedia.org${linkMatch[1]}`
    : 'https://fr.wikipedia.org/wiki/Portail:Formule_1'

  return { imageUrl: fullImageUrl, caption, articleLink }
}

/**
 * Parse driver and constructor standings tables from the portal page.
 */
export function parseClassement(html: string): F1Standing[] {
  const standings: F1Standing[] = []
  const tables = html.match(/<table[^>]*class="datatable[^"]*"[^>]*>([\s\S]*?)<\/table>/g)
  if (!tables) return standings

  for (const table of tables) {
    const typeMatch = table.match(/<caption[^>]*>([\s\S]*?)<\/caption>/)
    let type: 'pilotes' | 'constructeurs' = 'pilotes'

    if (typeMatch) {
      const caption = stripHtml(typeMatch[1]).toLowerCase()
      if (caption.includes('constructeur') || caption.includes('constructor')) {
        type = 'constructeurs'
      }
    }

    const rows: F1StandingRow[] = []
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g
    let rowMatch
    let isFirstRow = true

    while ((rowMatch = rowRegex.exec(table)) !== null) {
      const row = rowMatch[1]
      // Skip header row (first row with th cells)
      if (isFirstRow && row.includes('<th')) {
        isFirstRow = false
        continue
      }
      isFirstRow = false

      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g)
      if (!cells || cells.length < 3) continue

      const posMatch = cells[0].match(/>(\d+)/)
      // Driver/team name - may have multiple links (e.g., "McLaren-Mercedes")
      const nameMatches = cells[1].matchAll(/<a[^>]*href="\/wiki\/([^"]*)"[^>]*>([^<]+)/g)
      let name = ''
      for (const m of nameMatches) {
        name += (name ? '-' : '') + m[2].trim()
      }
      const pointsMatch = cells[2].match(/(\d+)/)

      if (posMatch && name && pointsMatch) {
        rows.push({
          pos: parseInt(posMatch[1], 10),
          name,
          points: pointsMatch[1],
        })
      }
    }

    if (rows.length > 0) {
      standings.push({ type, rows })
    }
  }

  return standings
}

/**
 * Parse "Le saviez-vous" facts from the portal page.
 */
export function parseSaviezVous(html: string): F1SaviezVous | null {
  const saviezMatch = html.match(
    /<span class="boite-coloree-titre">Le saviez-vous[^<]*<\/span>([\s\S]*?)<div class="boite-coloree-contenu">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/
  )
  if (!saviezMatch) return null

  const content = saviezMatch[2]
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g
  const facts: string[] = []
  let match

  while ((match = liRegex.exec(content)) !== null) {
    const fact = stripHtml(match[1]).trim()
    if (fact && fact.length > 30) {
      facts.push(fact)
    }
  }

  return facts.length > 0 ? { facts } : null
}

// ── Parsers — actualité page (Portail:Formule_1/Actualité) ─────────────────

/**
 * Parse news items from the dedicated actualité sub-page.
 * Expects the HTML of `Portail:Formule_1/Actualité`.
 */
export function parseActualitesFromActualitePage(html: string): F1Actualite[] {
  const articles: F1Actualite[] = []
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g
  let match

  while ((match = liRegex.exec(html)) !== null) {
    const li = match[1]
    const timeMatch = li.match(/<time[^>]*datetime="([^"]*)"[^>]*>([\s\S]*?)<\/time>/)
    const linkMatch = li.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/)

    if (!timeMatch || !linkMatch) continue

    const date = timeMatch[1]
    const dateDisplay = timeMatch[2] ? stripHtml(timeMatch[2]) : date

    // Extract content after the date link
    const contentMatch = li.match(/<\/time><\/b>&#160;:([\s\S]*)$/)
    let content = ''
    if (contentMatch) {
      content = stripHtml(contentMatch[1]).trim()
    }

    // Get the first link as the article title
    const titleMatch = li.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/)
    const title = titleMatch ? titleMatch[2].trim() : dateDisplay
    const url = titleMatch
      ? titleMatch[1].startsWith('http')
        ? titleMatch[1]
        : `https://fr.wikipedia.org${titleMatch[1]}`
      : ''

    if (title && url) {
      articles.push({ title, date: dateDisplay, content, url })
    }
  }

  return articles.slice(0, 5)
}

// ── Fetch helpers ───────────────────────────────────────────────────────────

/** Fetch the full HTML of the F1 portal page via the Wikipedia API. */
export async function fetchPortalPage(): Promise<string | null> {
  return fetchWikiPage('Portail:Formule_1')
}

/** Fetch the full HTML of the F1 actualité sub-page via the Wikipedia API. */
export async function fetchActualitePage(): Promise<string | null> {
  return fetchWikiPage('Portail:Formule_1/Actualit\u00E9')
}

/** Fetch the parsed text content of a Wikipedia article. */
export async function fetchArticleContent(articleTitle: string): Promise<string | null> {
  try {
    const data = await fetch(
      `${WIKI_API}?action=parse&page=${encodeURIComponent(articleTitle)}&prop=text&format=json`,
      {
        headers: {
          'User-Agent': 'moinsbete/1.0 (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!data.ok) return null

    const json = await data.json()
    if (!json?.parse?.text?.['*']) return null

    const html = json.parse.text['*']
    // Extract first 2-3 paragraphs
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g)
    if (!paragraphs) return null

    const summaries: string[] = []
    for (const p of paragraphs) {
      const text = stripHtml(p).trim()
      if (text && text.length > 50) {
        summaries.push(text)
      }
      if (summaries.length >= 3) break
    }

    return summaries.join(' ')
  } catch {
    return null
  }
}
