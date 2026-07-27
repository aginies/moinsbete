import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { f1Manager } from '@/lib/f1-bookmark'

interface F1Section {
  section: string
  data: unknown
}

interface F1Actualite {
  title: string
  date: string
  content: string
  url: string
}

interface F1Image {
  imageUrl: string
  caption: string
  articleLink: string
}

interface F1StandingRow {
  pos: number
  name: string
  points: string
}

interface F1Standing {
  type: 'pilotes' | 'constructeurs'
  rows: F1StandingRow[]
}

interface F1Lumiere {
  title: string
  summary: string
  imageUrl: string
  articleUrl: string
}

interface F1SaviezVous {
  facts: string[]
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function parseActualites(html: string): F1Actualite[] {
  const articles: F1Actualite[] = []
  const container = html.match(/<div class="boite-coloree-contenu"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
  if (!container) return articles

  const content = container[1]
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

function parseImageDuJour(html: string): F1Image | null {
  const imageMatch = html.match(/<span typeof="mw:File"[^>]*>([\s\S]*?)<\/span>/)
  if (!imageMatch) return null

  const imgMatch = imageMatch[1].match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/)
  if (!imgMatch) return null

  const imageUrl = imgMatch[1].startsWith('//') ? `https:${imgMatch[1]}` : imgMatch[1]
  const caption = imgMatch[2] || ''

  const linkMatch = imageMatch[1].match(/<a[^>]*href="([^"]*)"[^>]*>/)
  const articleLink = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://fr.wikipedia.org${linkMatch[1]}`) : 'https://fr.wikipedia.org/wiki/Portail:Formule_1'

  return { imageUrl, caption, articleLink }
}

function parseClassement(html: string): F1Standing[] {
  const standings: F1Standing[] = []
  const tables = html.match(/<table[^>]*class="datatable"[^>]*>([\s\S]*?)<\/table>/g)
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

    const rows: F1Standing['rows'] = []
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g
    let rowMatch

    while ((rowMatch = rowRegex.exec(table)) !== null) {
      const row = rowMatch[1]
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g)
      if (!cells || cells.length < 3) continue

      const posMatch = cells[0].match(/>(\d+)<$/)
      const nameMatch = cells[1].match(/<a[^>]*title="([^"]*)"[^>]*>/)
      const pointsMatch = cells[2].match(/>(\d+)<$/)

      if (posMatch && nameMatch && pointsMatch) {
        rows.push({
          pos: parseInt(posMatch[1], 10),
          name: nameMatch[1],
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

function parseLumiereSur(html: string): F1Lumiere | null {
  const lumiereBlock = html.match(/<div class="boite-coloree-contenu"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/)
  if (!lumiereBlock) return null

  const content = lumiereBlock[1]

  const figureMatch = content.match(/<figure[^>]*class="[^"]*mw-halign-right[^"]*"[^>]*>([\s\S]*?)<\/figure>/)
  const imgMatch = figureMatch ? figureMatch[1].match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/) : null
  const imageUrl = imgMatch ? (imgMatch[1].startsWith('//') ? `https:${imgMatch[1]}` : imgMatch[1]) : null

  const titleMatch = content.match(/<p[^>]*>\s*<b>\s*<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a><\/b>\s*<\/p>/)
  const title = titleMatch ? titleMatch[2].trim() : null
  const articleUrl = titleMatch ? (titleMatch[1].startsWith('http') ? titleMatch[1] : `https://fr.wikipedia.org${titleMatch[1]}`) : null

  const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/g)
  const summaries: string[] = []
  if (paragraphs) {
    for (const p of paragraphs) {
      const text = stripHtml(p).trim()
      if (text && text.length > 20 && text.length < 500) {
        summaries.push(text)
      }
    }
  }
  const summary = summaries.slice(0, 3).join(' ')

  if (title && summary) {
    return { title, summary, imageUrl: imageUrl || '', articleUrl: articleUrl || 'https://fr.wikipedia.org/wiki/Portail:Formule_1' }
  }

  return null
}

function parseSaviezVous(html: string): F1SaviezVous | null {
  const saviezBlock = html.match(/<div class="boite-coloree-contenu"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
  if (!saviezBlock) return null

  const content = saviezBlock[1]
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

async function fetchFromApi(): Promise<F1Section[]> {
  const now = new Date()

  const [actualites, image, classement, saviez, fia] = await Promise.all([
    prisma.cachedF1Article.findMany({
      where: { section: 'actualites', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 5,
    }),
    prisma.cachedF1Article.findFirst({
      where: { section: 'image', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'classement', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 2,
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'saviez', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'fia', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 10,
    }),
  ])

  const sections: F1Section[] = []

  if (actualites.length > 0) {
    sections.push({
      section: 'actualites',
      data: actualites.map(a => ({ title: a.title, date: a.description || '', content: a.content || '', url: a.url })),
    })
  }

  if (image) {
    sections.push({ section: 'image', data: { imageUrl: image.imageUrl || '', caption: image.description || '', articleLink: image.url } })
  }

  if (classement.length > 0) {
    const standings: F1Standing[] = []
    const pilotes = classement.find(a => a.title?.includes('Pilotes'))
    const constructeurs = classement.find(a => a.title?.includes('Constructeurs'))
    if (pilotes?.meta) standings.push({ type: 'pilotes', rows: (pilotes.meta as unknown as F1StandingRow[]) })
    if (constructeurs?.meta) standings.push({ type: 'constructeurs', rows: (constructeurs.meta as unknown as F1StandingRow[]) })
    if (standings.length > 0) sections.push({ section: 'classement', data: standings })
  }

  if (saviez.length > 0) {
    sections.push({ section: 'saviez', data: { facts: saviez.map(a => a.title) } })
  }

  if (fia.length > 0) {
    sections.push({
      section: 'fia',
      data: fia.map(a => ({ title: a.title, date: a.description || '', content: a.content || '', url: a.url, imageUrl: a.imageUrl })),
    })
  }

  return sections
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`f1:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const sections = await fetchFromApi()

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    let bookmarkedIds: string[] = []

    if (userId) {
      try {
        const favorites = await f1Manager.getFavorites(userId)
        bookmarkedIds = favorites.map(f => f.id)
      } catch (err) {
        console.error('Error fetching F1 favorites for user:', err)
      }
    }

    return NextResponse.json({ sections, bookmarkedIds })
  } catch (error) {
    console.error('F1 API error:', error)
    return NextResponse.json({ sections: [], bookmarkedIds: [] })
  }
}
