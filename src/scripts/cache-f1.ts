import { cleanupExpired, upsertCachedF1Article } from '../lib/cache-helpers'
import { runCacheScript } from './cache-script-helper'
import {
  stripHtml,
  parseActualitesFromActualitePage,
  parseImageDuJour,
  parseClassement,
  parseSaviezVous,
  fetchPortalPage as fetchPortalPageRaw,
  fetchActualitePage,
  fetchArticleContent,
} from '../lib/f1-wiki-parser'

interface F1FiaArticle {
  title: string
  date: string
  summary: string
  url: string
  imageUrl?: string
}

export async function scrapeFiaF1News(): Promise<F1FiaArticle[]> {
  try {
    const data = await fetch('https://www.fia.com/news/tags/f1-245', {
      signal: AbortSignal.timeout(15000),
    })
    if (!data.ok) return []
    const html = await data.text()
    
    const articles: F1FiaArticle[] = []
    const itemRegex = /<div class="list-item">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g
    let match
    
    while ((match = itemRegex.exec(html)) !== null) {
      const item = match[1]
      const dateMatch = item.match(/<span[^>]*class="date-display-single"[^>]*>([^<]+)<\/span>/)
      const titleMatch = item.match(/<div[^>]*class="news-title"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/)
      const summaryMatch = item.match(/<p[^>]*>([\s\S]*?)<\/p>/)
      const imageMatch = item.match(/<img[^>]*src="([^"]*)"[^>]*>/)
      
      if (titleMatch) {
        const url = titleMatch[1].startsWith('http') ? titleMatch[1] : `https://www.fia.com${titleMatch[1]}`
        const title = titleMatch[2].trim()
        const date = dateMatch ? dateMatch[1].trim() : ''
        const summary = summaryMatch ? summaryMatch[1].trim() : ''
        let imageUrl: string | undefined = undefined
        if (imageMatch) {
          imageUrl = imageMatch[1].startsWith('http') ? imageMatch[1] : `https:${imageMatch[1]}`
          // Remove itok query param for reliable access
          imageUrl = imageUrl.split('?')[0]
        }
        
        articles.push({ title, date, summary, url, imageUrl })
      }
    }
    
    return articles.slice(0, 10)
  } catch {
    return []
  }
}

export async function scrapeAndCacheF1(): Promise<void> {
  console.log('🏎️ Scraping F1 portal...')

  const html = await fetchPortalPageRaw()
  if (!html) {
    console.log('  ⚠️ Could not fetch portal page')
    return
  }

  const now = new Date()
  const imageExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const contentExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parse actualites from F1-specific actualité page
  const actualiteHtml = await fetchActualitePage()
  if (actualiteHtml) {
    const actualites = parseActualitesFromActualitePage(actualiteHtml)
    if (actualites.length > 0) {
      console.log(`  Actualites: ${actualites.length} articles`)
      for (const article of actualites) {
        await upsertCachedF1Article({
          section: 'actualites',
          title: article.title,
          description: article.date,
          content: article.content || '',
          url: article.url,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        })
      }
    }
  }

  // Parse image du jour
  const image = parseImageDuJour(html)
  if (image) {
    console.log(`  Image du jour: ${image.caption}`)
    await upsertCachedF1Article({
      section: 'image',
      title: image.caption,
      description: image.caption,
      imageUrl: image.imageUrl,
      url: image.articleLink,
      scrapedAt: now,
      expiresAt: imageExpiresAt,
    })
  }

  // Parse classement
  const standings = parseClassement(html)
  if (standings.length > 0) {
    console.log(`  Classement: ${standings.length} tables`)
    for (const standing of standings) {
      const standingUrl = `https://fr.wikipedia.org/wiki/Portail:Formule_1#${standing.type}`
      await upsertCachedF1Article({
        section: 'classement',
        title: standing.type === 'pilotes' ? 'Classement Pilotes' : 'Classement Constructeurs',
        description: `${standing.rows.length} positions`,
        meta: standing.rows,
        url: `${standingUrl}_${standing.type}`,
        scrapedAt: now,
        expiresAt: contentExpiresAt,
      })
    }
  }

  // Parse saviez-vous
  const saviez = parseSaviezVous(html)
  if (saviez && saviez.facts.length > 0) {
    console.log(`  Le saviez-vous: ${saviez.facts.length} facts`)
    for (const fact of saviez.facts) {
      const factUrl = `https://fr.wikipedia.org/wiki/Portail:Formule_1#saviez-${encodeURIComponent(fact.substring(0, 30))}`
      await upsertCachedF1Article({
        section: 'saviez',
        title: fact,
        description: fact,
        url: factUrl,
        scrapedAt: now,
        expiresAt: contentExpiresAt,
      })
    }
  }

  // Scrape FIA F1 news
  const fiaArticles = await scrapeFiaF1News()
  if (fiaArticles.length > 0) {
    console.log(`  FIA F1 News: ${fiaArticles.length} articles`)
    for (const article of fiaArticles) {
      await upsertCachedF1Article({
        section: 'fia',
        title: article.title,
        description: article.date,
        content: article.summary || '',
        imageUrl: article.imageUrl,
        url: article.url,
        scrapedAt: now,
        expiresAt: contentExpiresAt,
      })
    }
  }

  await cleanupExpired()
  console.log('  ✅ F1 cache updated')
}

if (process.argv[1]?.includes('cache-f1')) {
  runCacheScript(scrapeAndCacheF1)
}
