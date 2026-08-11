import { prisma } from '../lib/db'
import { sleep } from '../lib/cache-helpers'
import { gunzipSync, inflateSync } from 'zlib'
import { runCacheScript } from './cache-script-helper'

const INSOLITE_PAGE_URL = 'https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Articles_insolites'
const TTL_MS = 72 * 60 * 60 * 1000

interface InsoliteEntry {
  title: string
  description: string
  url: string
  imageUrl: string | null
  category: string
}

async function fetchPage(): Promise<string> {
  const res = await fetch(INSOLITE_PAGE_URL, {
    headers: {
      'User-Agent': 'moinsbete/1.0 (https://moinsbete.app)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'identity',
    },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const text = Buffer.from(buffer).toString('utf-8')
  console.log('  Fetched', text.length, 'bytes')
  return text
}

function extractInfoboxImage(html: string): string | null {
  // Try infobox table first
  const infoboxMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i)
  if (infoboxMatch) {
    const imgMatch = infoboxMatch[1].match(/<img[^>]*src="(\/\/upload\.wikimedia\.org[^"]+)"/i)
    if (imgMatch) {
      let imageUrl = `https:${imgMatch[1]}`
      if (imageUrl.includes('/thumb/') || imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }
      return imageUrl
    }
  }
  
  // Fallback: first image in mw-parser-output with upload.wikimedia.org
  const parserMatch = html.match(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  if (parserMatch) {
    const imgMatch = parserMatch[1].match(/<img[^>]*src="(\/\/upload\.wikimedia\.org[^"]+)"/i)
    if (imgMatch) {
      let imageUrl = `https:${imgMatch[1]}`
      if (imageUrl.includes('/thumb/') || imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }
      return imageUrl
    }
  }
  
  return null
}

async function fetchArticleImage(url: string): Promise<string | null> {
  try {
    const pageName = url.replace('https://fr.wikipedia.org/wiki/', '')
    const apiUrl = `https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=text&format=json`
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'moinsbete/1.0 (https://moinsbete.app)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const json = await res.json()
    if (!json?.parse?.text?.['*']) return null
    return extractInfoboxImage(json.parse.text['*'])
  } catch {
    return null
  }
}

function extractArticles(html: string): InsoliteEntry[] {
  const entries: InsoliteEntry[] = []
  
  // Split by section headings
  const sectionRegex = /<h2[^>]*id="([^"]+)"[^>]*>(.*?)<\/h2>/g
  let sectionMatch
  
  while ((sectionMatch = sectionRegex.exec(html)) !== null) {
    const sectionId = sectionMatch[1]
    // Extract text from heading, removing span tags
    let sectionText = sectionMatch[2]
    sectionText = sectionText.replace(/<span[^>]*>/g, '')
    sectionText = sectionText.replace(/<\/span>/g, '')
    sectionText = sectionText.replace(/<[^>]+>/g, '').trim()
    
    if (sectionText.length < 2) continue
    
    // Get content until next section or end
    const nextSection = html.substring(sectionMatch.index + sectionMatch[0].length)
    const nextSectionMatch = nextSection.match(/<h2[^>]*id="[^"]+"/)
    const sectionEnd = nextSectionMatch 
      ? sectionMatch.index + sectionMatch[0].length + nextSectionMatch.index!
      : html.length
    
    const sectionContent = html.substring(sectionMatch.index + sectionMatch[0].length, sectionEnd)
    
    // Find all table rows with article data
    // Pattern: <tr...>...<td><b><a href="/wiki/...">Title</a></b></td><td>Description</td>...</tr>
    const rowRegex = /<tr[^>]*>([\s\S]*?<td[^>]*><b[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a><\/b><\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>)/g
    let rowMatch
    
    while ((rowMatch = rowRegex.exec(sectionContent)) !== null) {
      const rawUrl = rowMatch[2]
      const rawTitle = rowMatch[3]
      const rawDesc = rowMatch[4]
      
      const url = rawUrl.startsWith('http') ? rawUrl : `https://fr.wikipedia.org${rawUrl}`
      const title = rawTitle.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
      const description = rawDesc.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
      
      // Skip self-references
      if (url.includes('Articles_insolites')) continue
      if (!title || title.length < 3) continue
      
      entries.push({
        title,
        description,
        url,
        imageUrl: null,
        category: sectionText,
      })
    }
  }
  
  return entries
}

export async function scrapeAndCacheInsolite(enrichImages: boolean = false): Promise<{ newCount: number; updatedCount: number; deletedCount: number; totalCount: number }> {
  console.log('📰 Scraping Articles insolites...')
  
  const html = await fetchPage()
  
  const entries = extractArticles(html)
  console.log(`  Found ${entries.length} articles`)
  
  if (entries.length === 0) {
    console.log('  No articles found, skipping')
    return { newCount: 0, updatedCount: 0, deletedCount: 0, totalCount: 0 }
  }
  
  if (enrichImages) {
    // Enrich all articles with images from their individual pages
    const batchSize = 10
    let totalEnriched = 0
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(entries.length / batchSize)
      const batch = entries.slice(i, i + batchSize)
      const imageResults = await Promise.all(
        batch.map(entry => fetchArticleImage(entry.url))
      )
      
      for (let j = 0; j < batch.length; j++) {
        if (imageResults[j]) {
          entries[i + j].imageUrl = imageResults[j]
          totalEnriched++
        }
      }
      
      console.log(`  Image batch ${batchNum}/${totalBatches}: ${totalEnriched}/${entries.length} enriched`)
      
      if (i + batchSize < entries.length) {
        await sleep(1000)
      }
    }
    
    console.log(`  Enriched ${totalEnriched}/${entries.length} articles with images from article pages`)
  } else {
    console.log('  Skipping image enrichment (use --enrich for full enrichment)')
  }
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TTL_MS)
  
  const existing = await prisma.cachedInsoliteArticle.findMany({
    select: { url: true, id: true },
  })
  const existingUrls = new Map(existing.map(e => [e.url, e.id]))
  const newUrls = new Set(entries.map(e => e.url))
  
  let newCount = 0
  let updatedCount = 0
  
  for (const entry of entries) {
    const existingId = existingUrls.get(entry.url)
    
    if (existingId) {
      await prisma.cachedInsoliteArticle.update({
        where: { id: existingId },
        data: {
          title: entry.title,
          description: entry.description,
          imageUrl: entry.imageUrl,
          category: entry.category,
          scrapedAt: now,
          expiresAt,
        },
      })
      updatedCount++
    } else {
      await prisma.cachedInsoliteArticle.create({
        data: {
          title: entry.title,
          description: entry.description,
          url: entry.url,
          imageUrl: entry.imageUrl,
          category: entry.category,
          scrapedAt: now,
          expiresAt,
        },
      })
      newCount++
    }
  }
  
  const toDelete = existing.filter(e => !newUrls.has(e.url))
  if (toDelete.length > 0) {
    await prisma.cachedInsoliteArticle.deleteMany({
      where: {
        url: { in: toDelete.map(e => e.url) },
      },
    })
    console.log(`  Deleted ${toDelete.length} removed articles`)
  }
  
  const totalCount = newCount + updatedCount
  console.log(`  ✅ Upserted ${totalCount} articles (${newCount} new, ${updatedCount} updated)`)
  
  return { newCount, updatedCount, deletedCount: toDelete.length, totalCount }
}

if (process.argv[2] === 'insolite') {
  const enrich = process.argv.includes('--enrich')
  runCacheScript(() => scrapeAndCacheInsolite(enrich))
}
