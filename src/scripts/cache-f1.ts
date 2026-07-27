import { prisma } from '../lib/db'
import { sleep, cleanupExpired } from '../lib/cache-helpers'

const WIKI_API = 'https://fr.wikipedia.org/w/api.php'

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

interface F1Standing {
  type: 'pilotes' | 'constructeurs'
  rows: Array<{ pos: number; name: string; points: string }>
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
  
  const actualiteMatch = html.match(/<span class="boite-coloree-titre">Actualités<\/span>([\s\S]*?)<div class="boite-coloree-contenu">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
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

function parseImageDuJour(html: string): F1Image | null {
  // Find the L'image du jour section - capture until next section header
  const imageMatch = html.match(/<span class="boite-coloree-titre">L\'image du jour<\/span>([\s\S]*?)(?=<span class="boite-coloree-titre">)/)
  if (!imageMatch) return null
  
  const content = imageMatch[1]
  const imgMatch = content.match(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/)
  if (!imgMatch) return null
  
  const imageUrl = imgMatch[2].startsWith('//') ? `https:${imgMatch[2]}` : imgMatch[2]
  const caption = imgMatch[1] || ''
  
  // Convert Wikimedia thumbnail to full-size image
  let fullImageUrl = imageUrl
  if (imageUrl.includes('/thumb/')) {
    const parts = imageUrl.split('/thumb/')
    if (parts.length === 2) {
      const base = parts[0]  // //upload.wikimedia.org/wikipedia/commons
      const fullPath = parts[1]  // e/gg/FILENAME.jpg/330px-FILENAME.jpg
      // fullPath has format: XX/XX/FILENAME.jpg/NNNNpx-FILENAME.jpg
      // Need to keep the XX/XX/ hash path
      const segments = fullPath.split('/')
      // Last segment is "NNNNpx-FILENAME.jpg", second-to-last is "FILENAME.jpg"
      // Everything before that is the hash path (XX/XX/)
      const hashPath = segments.slice(0, -2).join('/')
      const actualFileName = segments[segments.length - 2]
      fullImageUrl = `${base}/${hashPath}/${actualFileName}`
    }
  }
  
  const linkMatch = content.match(/<a[^>]*href="([^"]*)"[^>]*class="mw-file-description"[^>]*>/)
  const articleLink = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://fr.wikipedia.org${linkMatch[1]}`) : 'https://fr.wikipedia.org/wiki/Portail:Formule_1'
  
  return { imageUrl: fullImageUrl, caption, articleLink }
}

function parseClassement(html: string): F1Standing[] {
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

    const rows: F1Standing['rows'] = []
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

function parseSaviezVous(html: string): F1SaviezVous | null {
  const saviezMatch = html.match(/<span class="boite-coloree-titre">Le saviez-vous[^<]*<\/span>([\s\S]*?)<div class="boite-coloree-contenu">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
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

async function fetchArticleContent(articleTitle: string): Promise<string | null> {
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

async function fetchPortalPage(): Promise<string | null> {
  try {
    const data = await fetch(
      `${WIKI_API}?action=parse&page=Portail:Formule_1&prop=text&format=json`,
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

interface F1FiaArticle {
  title: string
  date: string
  summary: string
  url: string
  imageUrl?: string
}

async function fetchActualitePage(): Promise<string | null> {
  try {
    const data = await fetch(
      `${WIKI_API}?action=parse&page=Portail:Formule_1/Actualit%C3%A9&prop=text&format=json`,
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

function parseActualitesFromPage(html: string): F1Actualite[] {
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
    const url = titleMatch ? (titleMatch[1].startsWith('http') ? titleMatch[1] : `https://fr.wikipedia.org${titleMatch[1]}`) : ''

    if (title && url) {
      articles.push({ title, date: dateDisplay, content, url })
    }
  }

  return articles.slice(0, 5)
}

function isSundayAfternoon(): boolean {
  const now = new Date()
  return now.getDay() === 0 && now.getHours() >= 18
}

function shouldUpdateImage(): boolean {
  const now = new Date()
  const lastImageUpdate = now.getTime() - 25 * 60 * 60 * 1000
  return now.getTime() > lastImageUpdate
}

export async function scrapeAndCacheF1(): Promise<void> {
  console.log('🏎️ Scraping F1 portal...')

  const html = await fetchPortalPage()
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
    const actualites = parseActualitesFromPage(actualiteHtml)
    if (actualites.length > 0) {
      console.log(`  Actualites: ${actualites.length} articles`)
      for (const article of actualites) {
        await prisma.cachedF1Article.upsert({
          where: { url: article.url },
          update: {
            section: 'actualites',
            title: article.title,
            description: article.date,
            content: article.content || '',
            url: article.url,
            scrapedAt: now,
            expiresAt: contentExpiresAt,
          },
          create: {
            section: 'actualites',
            title: article.title,
            description: article.date,
            content: article.content || '',
            url: article.url,
            scrapedAt: now,
            expiresAt: contentExpiresAt,
          },
        })
      }
    }
  }

  // Parse image du jour
  const image = parseImageDuJour(html)
  if (image) {
    console.log(`  Image du jour: ${image.caption}`)
    await prisma.cachedF1Article.upsert({
      where: { url: image.articleLink },
      update: {
        section: 'image',
        title: image.caption,
        description: image.caption,
        imageUrl: image.imageUrl,
        url: image.articleLink,
        scrapedAt: now,
        expiresAt: imageExpiresAt,
      },
      create: {
        section: 'image',
        title: image.caption,
        description: image.caption,
        imageUrl: image.imageUrl,
        url: image.articleLink,
        scrapedAt: now,
        expiresAt: imageExpiresAt,
      },
    })
  }

  // Parse classement
  const standings = parseClassement(html)
  if (standings.length > 0) {
    console.log(`  Classement: ${standings.length} tables`)
    for (const standing of standings) {
      const standingUrl = `https://fr.wikipedia.org/wiki/Portail:Formule_1#${standing.type}`
      await prisma.cachedF1Article.upsert({
        where: { url: `${standingUrl}_${standing.type}` },
        update: {
          section: 'classement',
          title: standing.type === 'pilotes' ? 'Classement Pilotes' : 'Classement Constructeurs',
          description: `${standing.rows.length} positions`,
          meta: standing.rows,
          url: `${standingUrl}_${standing.type}`,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
        create: {
          section: 'classement',
          title: standing.type === 'pilotes' ? 'Classement Pilotes' : 'Classement Constructeurs',
          description: `${standing.rows.length} positions`,
          meta: standing.rows,
          url: `${standingUrl}_${standing.type}`,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
      })
    }
  }

  // Parse saviez-vous
  const saviez = parseSaviezVous(html)
  if (saviez && saviez.facts.length > 0) {
    console.log(`  Le saviez-vous: ${saviez.facts.length} facts`)
    for (const fact of saviez.facts) {
      const factUrl = `https://fr.wikipedia.org/wiki/Portail:Formule_1#saviez-${encodeURIComponent(fact.substring(0, 30))}`
      await prisma.cachedF1Article.upsert({
        where: { url: factUrl },
        update: {
          section: 'saviez',
          title: fact,
          description: fact,
          url: factUrl,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
        create: {
          section: 'saviez',
          title: fact,
          description: fact,
          url: factUrl,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
      })
    }
  }

  // Scrape FIA F1 news
  const fiaArticles = await scrapeFiaF1News()
  if (fiaArticles.length > 0) {
    console.log(`  FIA F1 News: ${fiaArticles.length} articles`)
    for (const article of fiaArticles) {
      await prisma.cachedF1Article.upsert({
        where: { url: article.url },
        update: {
          section: 'fia',
          title: article.title,
          description: article.date,
          content: article.summary || '',
          imageUrl: article.imageUrl,
          url: article.url,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
        create: {
          section: 'fia',
          title: article.title,
          description: article.date,
          content: article.summary || '',
          imageUrl: article.imageUrl,
          url: article.url,
          scrapedAt: now,
          expiresAt: contentExpiresAt,
        },
      })
    }
  }

  await cleanupExpired()
  console.log('  ✅ F1 cache updated')
}

if (process.argv[1]?.includes('cache-f1')) {
  scrapeAndCacheF1()
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
