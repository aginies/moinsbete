import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { cleanText, extractImageFilename, extractArticleLink } from './wiki-text-utils'

const prisma = new PrismaClient()

const PAGES = [
  { year: 2025, title: 'Wikipédia:Le_saviez-vous_?/Archives/2025', useHtml: true },
  { year: 2024, title: 'Wikipédia:Le_saviez-vous_?/Archives/2024', useHtml: true },
  { year: 2023, title: 'Wikipédia:Le_saviez-vous_?/Archives/2023', useHtml: true },
  { year: 2022, title: 'Wikipédia:Le_saviez-vous_?/Archives/2022', useHtml: true },
  { year: 2021, title: 'Wikipédia:Le_saviez-vous_?/Archives/2021', useHtml: true },
  { year: 2020, title: 'Wikipédia:Le_saviez-vous_?/Archives/2020', useHtml: true },
  { year: 2019, title: 'Wikipédia:Le_saviez-vous_?/Archives/2019', useHtml: true },
  { year: 2018, title: 'Wikipédia:Le_saviez-vous_?/Archives/2018', useHtml: true },
  { year: 2017, title: 'Wikipédia:Le_saviez-vous_?/Archives/2017', useHtml: true },
  { year: 2016, title: 'Wikipédia:Le_saviez-vous_?/Archives/2016', useHtml: true },
]

interface Fact {
  id: string
  text: string
  imageUrl: string | null
  articleUrl: string | null
  displayStart: string | null
  displayEnd: string | null
}

async function fetchHtmlPage(title: string): Promise<string> {
  const encoded = encodeURIComponent(title)
  const url = `https://fr.wikipedia.org/wiki/${encoded}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'moinsbete/1.0 (contact: antoine@ginies.org)' },
  })
  if (!res.ok) {
    console.log(`  ⚠️ Failed: ${title} (${res.status})`)
    return ''
  }
  return res.text()
}

async function fetchRawPage(title: string): Promise<string> {
  const encoded = encodeURIComponent(title)
  const url = `https://fr.wikipedia.org/w/index.php?title=${encoded}&action=raw`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'moinsbete/1.0 (contact: antoine@ginies.org)' },
  })
  if (!res.ok) {
    console.log(`  ⚠️ Failed: ${title} (${res.status})`)
    return ''
  }
  return res.text()
}

function extractFullSizeImageUrl(thumbUrl: string): string | null {
  if (!thumbUrl) return null
  
  // Handle protocol-relative URLs
  let url = thumbUrl
  if (url.startsWith('//')) url = 'https:' + url
  
  // Match thumbnail URLs: /wikipedia/commons/thumb/[hash]/[hash]/[file]/[NNNpx-file]
  // Capture: [hash]/[hash]/[file]
  const thumbRegex = /\/wikipedia\/commons\/thumb\/([^/]+)\/([^/]+)\/(.+?)\/\d+px-.+/
  const match = url.match(thumbRegex)
  if (match) {
    return `https://upload.wikimedia.org/wikipedia/commons/${match[1]}/${match[2]}/${match[3]}`
  }
  
  return null
}

function parseFactsFromHtml(html: string): Fact[] {
  const facts: Fact[] = []

  // Find all <li> elements that contain <!--@ID_
  const liRegex = /<li[^>]*>([\s\S]*?)<!--@ID_(\d+)-->([\s\S]*?)(?=<li[^>]*>|$)/g
  let liMatch

  while ((liMatch = liRegex.exec(html)) !== null) {
    const id = liMatch[2]
    let content = liMatch[3]

    if (!content) continue

    // Remove figcaption content (image captions)
    content = content.replace(
      /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi,
      (_match, inner) => {
        return ' [[FC:' + inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + ']] '
      }
    )

    // Extract image URL from <figure typeof="mw:File"> containing the <img>
    let imageUrl: string | null = null
    const figureMatch = content.match(/<figure[^>]*typeof=["']?mw:File["']?[^>]*>([\s\S]*?)<\/figure>/i)
    if (figureMatch) {
      const figContent = figureMatch[1]
      const imgMatch = figContent.match(/src=["']([^"']+)["']/)
      if (imgMatch) {
        let url = imgMatch[1]
        url = url.startsWith('http') ? url : `https:${url}`
        imageUrl = extractFullSizeImageUrl(url)
      }
    }

    // Fallback: extract image from <a href="//fr.wikipedia.org/wiki/Fichier:...">
    if (!imageUrl) {
      const fileLinkMatch = content.match(/href=["']\/\/fr\.wikipedia\.org\/wiki\/Fichier:([^"']+)["']/i)
      if (fileLinkMatch) {
        const filename = decodeURIComponent(fileLinkMatch[1])
        imageUrl = `https://upload.wikimedia.org/wikipedia/commons/${filename}`
      }
    }

    // Fallback: extract image from <a href="//commons.wikimedia.org/wiki/File:...">
    if (!imageUrl) {
      const commonsLinkMatch = content.match(/href=["']\/\/commons\.wikimedia\.org\/wiki\/File:([^"'\s>]+)["']/i)
      if (commonsLinkMatch) {
        const filename = decodeURIComponent(commonsLinkMatch[1])
        imageUrl = `https://upload.wikimedia.org/wikipedia/commons/${filename}`
      }
    }

    // Remove <dl><dd><small>...</small></dd></dl> display info
    content = content.replace(/<dl[^>]*>[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>[\s\S]*?<\/dl>/gi, '')

    // Extract text: remove HTML tags but preserve readable text
    let text = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&mdash;/g, '-')
      .replace(/&ndash;/g, '-')
      .replace(/\[\[FC:[^\]]*\]\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text || text.length < 20) continue

    // Extract first wiki link as sourceUrl
    let articleUrl: string | null = null
    const linkRegex = /<a[^>]*rel="mw:WikiLink"[^>]*href="([^"]+)"[^>]*>/g
    let linkMatch
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const href = linkMatch[1]
      if (href.includes('Special:') || href.includes('Fichier:') || href.includes('Image:')) {
        continue
      }
      articleUrl = `https:${href}`
      break
    }

    // Extract display dates from the removed small text
    let displayStart: string | null = null
    let displayEnd: string | null = null
    const smallMatch = liMatch[0].match(/du\s+([^a]+)\s+au\s+(\d+)/)
    if (smallMatch) {
      displayStart = smallMatch[1].trim()
      displayEnd = smallMatch[2].trim()
    }

    facts.push({ id, text, imageUrl, articleUrl, displayStart, displayEnd })
  }

  return facts
}

function parseFactsFromRaw(wikitext: string): Fact[] {
  const facts: Fact[] = []
  const lines = wikitext.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.match(/^\*\s/)) continue

    // Check if previous line was an image
    let imageFilename: string | null = null
    if (i > 0) {
      const prevLine = lines[i - 1].trim()
      if (prevLine.match(/^\[\[Fichier:/) || prevLine.match(/^\[\[Image:/)) {
        imageFilename = extractImageFilename(prevLine)
      }
    }

    const text = cleanText(line, { stripBullet: true, useDisplayText: true })
    if (!text || text.length < 20) continue

    const article = extractArticleLink(line)

    facts.push({
      id: `raw_${facts.length}`,
      text,
      imageUrl: imageFilename ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFilename)}?width=1200` : null,
      articleUrl: article ? `https://fr.wikipedia.org/wiki/${article}` : null,
      displayStart: null,
      displayEnd: null,
    })
  }

  return facts
}

async function main() {
  console.log('📚 Scraping Wikipedia Le saviez-vous ? archives (HTML parsing)\n')

  // Get existing facts by ID
  const existingFacts = await prisma.saviezVousFact.findMany({
    select: { id: true, text: true, imageFilename: true, sourceUrl: true },
  })
  const existingIds = new Set(existingFacts.map(f => f.id))
  const existingTexts = new Set(existingFacts.map(f => f.text))
  console.log(`Existing facts in DB: ${existingTexts.size}\n`)

  let totalFetched = 0
  let newInserted = 0
  let duplicates = 0
  let errors = 0
  let totalFacts = 0

  for (const page of PAGES) {
    console.log(`📄 Fetching: ${page.title}`)
    let facts: Fact[] = []

    if (page.useHtml) {
      const html = await fetchHtmlPage(page.title)
      if (!html) continue
      facts = parseFactsFromHtml(html)
    } else {
      const wikitext = await fetchRawPage(page.title)
      if (!wikitext) continue
      facts = parseFactsFromRaw(wikitext)
    }

    console.log(`  Found ${facts.length} facts`)
    totalFacts += facts.length

    for (const fact of facts) {
      totalFetched++

      if (existingIds.has(fact.id)) {
        duplicates++
        continue
      }

      try {
        await prisma.saviezVousFact.create({
          data: {
            id: `wiki:${fact.id}`,
            text: fact.text,
            sourceUrl: fact.articleUrl,
            imageFilename: fact.imageUrl,
          },
        })
        newInserted++
      } catch (e) {
        const err = e as Error
        if (err.message.includes('Unique constraint') || err.message.includes('UNIQUE')) {
          duplicates++
        } else {
          errors++
          console.log(`  Error inserting fact ${fact.id}: ${err.message}`)
        }
      }
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Total facts on pages: ${totalFacts}`)
  console.log(`Scraped facts: ${totalFetched}`)
  console.log(`New inserted: ${newInserted}`)
  console.log(`Duplicates skipped: ${duplicates}`)
  console.log(`Errors: ${errors}`)

  const total = await prisma.saviezVousFact.count()
  console.log(`Total in DB: ${total}`)

  const sample = await prisma.saviezVousFact.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  })
  console.log('\n--- Recent facts ---')
  for (const f of sample) {
    console.log(f.text.substring(0, 80))
    console.log(`  ID: ${f.id}`)
    console.log(`  Image: ${f.imageFilename?.substring(0, 60) || 'none'}`)
    console.log(`  URL: ${f.sourceUrl || 'none'}\n`)
  }
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
