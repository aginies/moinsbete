import { prisma } from '@/lib/db'
import { sleep, cleanupExpired } from '@/lib/cache-helpers'

const WIKIQUOTE_API = 'https://fr.wikiquote.org/w/api.php'

interface WikiquotePage {
  title: string
  pageid: number
}

interface ParsedCitation {
  text: string
  source?: string
}

interface ParsedPage {
  title: string
  citations: ParsedCitation[]
  imageUrl?: string
}

function fetchWikiquote(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString()
  return fetch(`${WIKIQUOTE_API}?${qs}&format=json`, {
    signal: AbortSignal.timeout(15000),
    headers: {
      'User-Agent': 'MoinsBete-App/1.0 (https://moinsbete.app; bot) Wikiquote scraper',
    },
  }).then(async r => {
    const text = await r.text()
    try {
      return JSON.parse(text)
    } catch {
      console.error(`  ⚠️ API error: ${text.substring(0, 200)}`)
      return {}
    }
  })
}

async function fetchWikiquoteWithRetry(params: Record<string, string>, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const result = await fetchWikiquote(params)
    if (!result?.error?.info?.includes('too many requests')) {
      return result
    }
    const wait = (i + 1) * 3000
    console.log(`  ⏳ Rate limited, waiting ${wait}ms...`)
    await sleep(wait)
  }
  console.error('  ⚠️ Max retries hit, skipping request')
  return {}
}

function parseCitationTemplates(wikitext: string): ParsedCitation[] {
  const citations: ParsedCitation[] = []
  const citationRegex = /\{\{(citation)\s*\|([^}]+(?:\{\{[^}]*\}\}[^}]*)*)\}\}/gi

  let match: RegExpExecArray | null
  while ((match = citationRegex.exec(wikitext)) !== null) {
    const content = match[2]
    let text = ''

    const citationParamMatch = content.match(/\bcitation\s*=\s*([\s\S]*?)(?:\|\s*(?:précisions|source|original|langue|traducteur)\s*=|\}\})/i)
    if (citationParamMatch) {
      text = citationParamMatch[1].trim()
    } else {
      const firstPipeIdx = content.indexOf('|')
      if (firstPipeIdx === -1) {
        text = content.trim()
      } else {
        text = content.substring(0, firstPipeIdx).trim()
      }
    }

    text = text
      .replace(/<poem>[\s\S]*?<\/poem>/g, m => {
        return m.replace(/<\/?poem>/g, '').replace(/\n+/g, ' ').trim()
      })
      .replace(/\[\[[^\]]+\]\]/g, m => {
        // [[link|display]] -> display, [[link]] -> link
        const inner = m.slice(2, -2)
        const lastPipe = inner.lastIndexOf('|')
        return lastPipe > -1 ? inner.substring(lastPipe + 1) : inner
      })
      .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?/g, '$1') // incomplete [[link|text or [[link
      .replace(/\*+/g, '')
      .replace(/\n+/g, ' ')
      .replace(/^citation\s*=\s*/, '')
      .trim()

    if (text && text.length > 10) {
      const idx = match.index + match[0].length
      const after = wikitext.substring(idx, idx + 500)
      const refMatch = after.match(/\{\{r[ée]f\s*Livre\s*\|[\s\S]*?\|titre\s*=\s*([^|\n}]+)/i)
      let source = ''
      if (refMatch) {
        let sourceTitle = refMatch[1].trim().replace(/'/g, '')
        const yearMatch = after.match(/\|ann[éeé]\s*=\s*(\d{4})/i)
        source = yearMatch ? `${sourceTitle} (${yearMatch[1]})` : sourceTitle
      }
      citations.push({ text, source })
    }
  }
  return citations
}

async function fetchRandomCategoryPages(category: string, limit: number): Promise<WikiquotePage[]> {
  const data = await fetchWikiquoteWithRetry({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Catégorie:${category}`,
    cmrandom: '1',
    cmlimit: String(limit),
    cmtype: 'page',
  })
  return (data?.query?.categorymembers || []).map((m: any) => ({
    title: m.title,
    pageid: m.pageid,
  }))
}

async function fetchWikitextBatch(titles: string[]): Promise<ParsedPage[]> {
  const results: ParsedPage[] = []
  const batchSize = 50

  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize)
    const data = await fetchWikiquoteWithRetry({
      action: 'query',
      titles: batch.join('|'),
      prop: 'revisions|pageimages',
      rvprop: 'content',
      pithumbsize: '200',
    })

    const pages = data?.query?.pages || {}
    for (const page of Object.values(pages)) {
      const p = page as any
      const wikitext = p?.revisions?.[0]?.['*'] || ''
      const thumbnail = p?.thumbnail?.source
      const citations = parseCitationTemplates(wikitext)

      if (citations.length > 0) {
        results.push({
          title: p.title,
          citations,
          imageUrl: thumbnail,
        })
      }
    }

    if (i + batchSize < titles.length) {
      await sleep(400)
    }
  }
  return results
}

async function scrapeCitationDuJour(): Promise<ParsedPage[]> {
  try {
    const num = Math.floor(Math.random() * 42) + 1
    const data = await fetchWikiquoteWithRetry({
      action: 'query',
      titles: `Modèle:Citation du jour/Switch/${num}`,
      prop: 'revisions',
      rvprop: 'content',
    })

    const pages = data?.query?.pages || {}
    const page = Object.values(pages)[0] as any
    const wikitext = page?.revisions?.[0]?.['*'] || ''

    const citationMatch = wikitext.match(/\|citation\s*=\s*([^|\n]+)/)
    const articleMatch = wikitext.match(/\|article\s*=\s*([^|\n}]+)/)

    if (citationMatch && articleMatch) {
      let text = citationMatch[1].trim()
      text = text
        .replace(/\[\[[^\]]+\]\]/g, (m: string) => {
          const inner = m.slice(2, -2)
          const lastPipe = inner.lastIndexOf('|')
          return lastPipe > -1 ? inner.substring(lastPipe + 1) : inner
        })
        .replace(/^«\s*|\s*»$/g, '')
        .trim()

      if (text.length > 10) {
        return [{
          title: articleMatch[1].trim(),
          citations: [{ text }],
        }]
      }
    }
  } catch {
    // Fallback: pick a random page from namespace 0
  }
  return []
}

async function upsertCitations(
  page: ParsedPage,
  category: string,
  categoryType: 'theme' | 'auteur' | 'daily',
  now: Date,
  expiresAt: Date,
): Promise<number> {
  let count = 0
  for (const citation of page.citations) {
    const wikiUrl = `https://fr.wikiquote.org/wiki/${encodeURIComponent(page.title)}`
    try {
      await prisma.cachedCitationArticle.upsert({
        where: { author_text: { author: page.title, text: citation.text } },
        update: {
          text: citation.text,
          author: page.title,
          source: citation.source,
          category,
          categoryType,
          imageUrl: page.imageUrl,
          scrapedAt: now,
          expiresAt,
        },
        create: {
          text: citation.text,
          author: page.title,
          source: citation.source,
          category,
          categoryType,
          wikiUrl,
          imageUrl: page.imageUrl,
          scrapedAt: now,
          expiresAt,
        },
      })
      count++
    } catch {
      // skip
    }
  }
  return count
}

export async function scrapeAndCacheCitation(): Promise<void> {
  console.log('📜 Scraping Wikiquote...')

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000)
  let totalInserted = 0

  // 1. Citation du jour
  const dailyPages = await scrapeCitationDuJour()
  for (const page of dailyPages) {
    totalInserted += await upsertCitations(page, 'Citation du jour', 'daily', now, new Date(now.getTime() + 24 * 60 * 60 * 1000))
  }
  console.log(`  Citation du jour: ${dailyPages.length} entries`)

  // 2. Theme categories
  const themeData = await fetchWikiquoteWithRetry({
    action: 'query',
    list: 'categorymembers',
    cmtitle: 'Catégorie:Thème',
    cmlimit: '500',
  })
  const themeCats = (themeData?.query?.categorymembers || [])
    .filter((m: any) => m.ns === 14)
    .map((m: any) => m.title.replace('Catégorie:', ''))

  // Collect random pages from all theme categories
  const themePageMap = new Map<string, string[]>()
  const shuffledThemes = themeCats.sort(() => Math.random() - 0.5).slice(0, 100)
  for (const cat of shuffledThemes) {
    const pages = await fetchRandomCategoryPages(cat, 1)
    if (pages.length > 0) {
      themePageMap.set(cat, pages.map(p => p.title))
    }
    await sleep(200)
  }

  // Batch fetch wikitext for all theme pages
  const allThemeTitles = [...themePageMap.values()].flat()
  const themeParsed = await fetchWikitextBatch(allThemeTitles)
  for (const page of themeParsed) {
    const cat = [...themePageMap.entries()].find(([, titles]) => titles.includes(page.title))?.[0]
    if (cat) {
      totalInserted += await upsertCitations(page, cat, 'theme', now, expiresAt)
    }
  }
  console.log(`  Thèmes: ${themeParsed.length} pages from ${themePageMap.size} categories`)

  // Pause between sections
  await sleep(2000)

  // 3. Author categories
  const authorData = await fetchWikiquoteWithRetry({
    action: 'query',
    list: 'categorymembers',
    cmtitle: 'Catégorie:Personnalité par métier',
    cmlimit: '500',
  })
  const authorCats = (authorData?.query?.categorymembers || [])
    .filter((m: any) => m.ns === 14)
    .map((m: any) => m.title.replace('Catégorie:', ''))

  // Collect random pages from all author categories
  const authorPageMap = new Map<string, string[]>()
  const shuffledAuthors = authorCats.sort(() => Math.random() - 0.5).slice(0, 100)
  for (const cat of shuffledAuthors) {
    const pages = await fetchRandomCategoryPages(cat, 1)
    if (pages.length > 0) {
      authorPageMap.set(cat, pages.map(p => p.title))
    }
    await sleep(200)
  }

  // Batch fetch wikitext for all author pages
  const allAuthorTitles = [...authorPageMap.values()].flat()
  const authorParsed = await fetchWikitextBatch(allAuthorTitles)
  for (const page of authorParsed) {
    const cat = [...authorPageMap.entries()].find(([, titles]) => titles.includes(page.title))?.[0]
    if (cat) {
      totalInserted += await upsertCitations(page, cat, 'auteur', now, expiresAt)
    }
  }
  console.log(`  Auteurs: ${authorParsed.length} pages from ${authorPageMap.size} categories`)

  await cleanupExpired()
  console.log(`  ✅ Citation cache updated (${totalInserted} citations)`)
}

if (process.argv[1]?.includes('cache-citation')) {
  scrapeAndCacheCitation()
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
