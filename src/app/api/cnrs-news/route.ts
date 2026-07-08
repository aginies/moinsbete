import { NextResponse } from 'next/server'

interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

const NEWSROOM_BASE = 'https://www.cnrs.fr'

interface ScrapedArticle {
  title: string
  link: string
  imageUrl: string
  date: string
  category: string
}

async function scrapeNewsroomPage(page: number): Promise<ScrapedArticle[]> {
  try {
    const res = await fetch(`${NEWSROOM_BASE}/fr/newsroom?page=${page}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []

    const html = await res.text()
    const articles: ScrapedArticle[] = []

    const validCategories = ['actualite', 'presse', 'lejournal', 'images', 'bibliotheque', 'videos', 'diaporamas']
    const usedLinks = new Set<string>()

    const articleBlocks = html.split('class="views-row"')
    for (const block of articleBlocks) {
      const titleMatch = block.match(/field--name-title field--type-string field--label-hidden">([\s\S]*?)<\/span>/)
      const linkMatch = block.match(/href="(\/fr\/(actualite|presse|lejournal|images|bibliotheque|videos|diaporamas)[^"]*)"/)
      const imgMatch = block.match(/src="([^"]*(?:jpg|png|jpeg)[^"]*)"/)

      if (!titleMatch || !linkMatch || !imgMatch) continue

      const title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
      const href = linkMatch[1]
      const category = linkMatch[2]
      const imageUrl = imgMatch[1]

      if (!title || !href || !imageUrl) continue
      if (usedLinks.has(href)) continue
      if (!validCategories.includes(category)) continue

      usedLinks.add(href)

      const fullLink = href.startsWith('http') ? href : `${NEWSROOM_BASE}${href}`
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${NEWSROOM_BASE}${imageUrl}`

      articles.push({
        title,
        link: fullLink,
        imageUrl: fullImageUrl,
        date: '',
        category,
      })
    }

    return articles
  } catch {
    return []
  }
}

async function fetchRandomArticle(depth = 0): Promise<CnrsArticle | null> {
  const maxDepth = 10
  if (depth >= maxDepth) return null

  const totalPages = 415
  const randomPage = Math.floor(Math.random() * totalPages)

  const articles = await scrapeNewsroomPage(randomPage)
  if (articles.length === 0) {
    return fetchRandomArticle(depth + 1)
  }

  const article = articles[Math.floor(Math.random() * articles.length)]
  if (!article.link) return null

  return {
    title: article.title || 'Actualité CNRS',
    imageUrl: article.imageUrl,
    link: article.link,
    category: article.category || 'Sciences',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
  }
}

export async function GET() {
  const article = await fetchRandomArticle()
  if (!article) {
    return NextResponse.json({ error: true })
  }
  return NextResponse.json(article)
}
