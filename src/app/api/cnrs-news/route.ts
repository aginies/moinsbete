import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const NEWSROOM_BASE = 'https://www.cnrs.fr'

interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

async function scrapeFreshArticles(): Promise<CnrsArticle[]> {
  const articles: CnrsArticle[] = []
  
  for (let page = 1; page <= 10; page++) {
    try {
      const res = await fetch(`${NEWSROOM_BASE}/fr/newsroom?page=${page}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) continue

      const html = await res.text()
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
        let imageUrl = imgMatch[1]

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
    } catch {
      // skip
    }
  }
  
  return articles
}

async function upsertFreshArticles(articles: CnrsArticle[]) {
  if (articles.length === 0) return
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  for (const article of articles) {
    await prisma.cachedCnrsArticle.upsert({
      where: { link: article.link },
      update: { ...article, scrapedAt: now, expiresAt },
      create: { ...article, scrapedAt: now, expiresAt },
    })
  }
}

export async function GET() {
  try {
    // Try cache first
    const cached = await prisma.cachedCnrsArticle.findMany({
      where: { expiresAt: { gte: new Date() } },
      orderBy: { scrapedAt: 'desc' },
      take: 50,
    })

    if (cached.length > 0) {
      const article = cached[Math.floor(Math.random() * cached.length)]
      return NextResponse.json({
        title: article.title || 'Actualit\u00e9 CNRS',
        imageUrl: article.imageUrl,
        link: article.link,
        category: article.category || 'Sciences',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      })
    }

    // Cache empty — scrape fresh
    const articles = await scrapeFreshArticles()
    if (articles.length > 0) {
      await upsertFreshArticles(articles)
      const article = articles[Math.floor(Math.random() * articles.length)]
      return NextResponse.json({
        title: article.title || 'Actualit\u00e9 CNRS',
        imageUrl: article.imageUrl,
        link: article.link,
        category: article.category || 'Sciences',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      })
    }

    // Scrape failed — return placeholder
    return NextResponse.json({
      title: 'Actualit\u00e9 CNRS',
      imageUrl: '',
      link: 'https://www.cnrs.fr/fr/newsroom',
      category: 'Sciences',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  } catch (error) {
    console.error('CNRS error:', error)
    return NextResponse.json({
      title: 'Actualit\u00e9 CNRS',
      imageUrl: '',
      link: 'https://www.cnrs.fr/fr/newsroom',
      category: 'Sciences',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  }
}
