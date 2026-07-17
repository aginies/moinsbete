import { prisma } from '../lib/db'
import crypto from 'crypto'

const MONTHS_MS = 30 * 24 * 60 * 60 * 1000

interface WikiLovesImageEntry {
  docid: string
  title: string
  author: string
  imageUrl: string
  commonsUrl: string | null
  license: string
  year: number
  source: 'MONUMENTS' | 'EARTH'
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function scrapeWikiLovesMonuments(): Promise<WikiLovesImageEntry[]> {
  console.log('  Scraping Wiki Loves Monuments...')
  const entries: WikiLovesImageEntry[] = []
  const seenUrls = new Set<string>()
  
  const galleriesPage = await fetchHtml('https://www.wikilovesmonuments.org/galleries/')
  if (!galleriesPage) return entries

  const yearRegex = /href="https:\/\/www\.wikilovesmonuments\.org\/galleries\/(\d{4})-winners\/"/g
  let match: RegExpExecArray | null
  const years = new Set<number>()
  
  while ((match = yearRegex.exec(galleriesPage)) !== null) {
    years.add(parseInt(match[1], 10))
  }

  const sortedYears = Array.from(years).sort((a, b) => b - a)
  
  for (const year of sortedYears) {
    console.log(`    Fetching ${year} gallery...`)
    const galleryUrl = `https://www.wikilovesmonuments.org/galleries/${year}-winners/?theme=wlm_2020`
    const html = await fetchHtml(galleryUrl)
    if (!html) {
      console.log(`      Failed to fetch ${year}`)
      continue
    }

    const liRegex = /<li id="thumb--"[^>]*>/g
    let liMatch: RegExpExecArray | null
    let yearCount = 0
    
    while ((liMatch = liRegex.exec(html)) !== null) {
      const liTag = liMatch[0]
      
      const getAttr = (attr: string): string => {
        const match = liTag.match(new RegExp(`${attr}="([^"]*)"`))
        return match ? match[1].trim() : ''
      }

      const imageUrl = getAttr('data-fullimg') || getAttr('data-img')
      if (!imageUrl || !imageUrl.includes('wikilovesmonuments.org')) continue
      
      if (seenUrls.has(imageUrl)) continue
      seenUrls.add(imageUrl)

      const title = getAttr('data-name') || getAttr('title').split(' by ')[0] || 'Wiki Loves Monuments'
      const author = getAttr('data-author') || getAttr('title').split(' by ')[1] || ''
      const commonsUrl = getAttr('data-author_url') || null
      const license = getAttr('data-license') || 'CC BY-SA 4.0'

      const filename = imageUrl.split('/').pop()?.replace(/-\d+x\d+\.jpg$/, '.jpg') || ''
      const docid = `wlm-${year}-${filename}`

      entries.push({
        docid,
        title,
        author,
        imageUrl,
        commonsUrl,
        license,
        year,
        source: 'MONUMENTS',
      })
      yearCount++
    }
    
    console.log(`      Found ${yearCount} images for ${year}`)
  }

  console.log(`    Total: ${entries.length} images`)
  return entries
}

async function scrapeWikiLovesEarth(): Promise<WikiLovesImageEntry[]> {
  console.log('  Scraping Wiki Loves Earth...')
  const entries: WikiLovesImageEntry[] = []
  
  const bestPage = await fetchHtml('https://wikilovesearth.org/category/best/')
  if (!bestPage) return entries

  const postRegex = /href="https:\/\/wikilovesearth\.org\/([^"]+)"[^>]*>([^<]+)<\/a>/g
  let match: RegExpExecArray | null
  const posts: { url: string; title: string }[] = []
  
  while ((match = postRegex.exec(bestPage)) !== null) {
    const path = match[1]
    if (path.includes('winners') || path.includes('Winners') || path.includes('winning')) {
      posts.push({ url: `https://wikilovesearth.org/${path}`, title: match[2].trim() })
    }
  }

  for (const post of posts) {
    console.log(`    Fetching: ${post.title}`)
    const html = await fetchHtml(post.url)
    if (!html) {
      console.log(`      Failed to fetch`)
      continue
    }

    const yearMatch = post.title.match(/(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2020

    const fileRegex = /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:([^"]+)"/g
    let fileMatch: RegExpExecArray | null
    const commonsFiles = new Set<string>()
    
    while ((fileMatch = fileRegex.exec(html)) !== null) {
      commonsFiles.add(decodeURIComponent(fileMatch[1]))
    }

    const imgRegex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g
    let imgMatch: RegExpExecArray | null
    let postImageCount = 0
    
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imageUrl = imgMatch[1]
      const altText = imgMatch[2]
      
      if (!imageUrl.includes('upload.wikimedia.org')) continue
      if (imageUrl.includes('/thumb/') && !imageUrl.includes('/1280px-')) continue
      if (imageUrl.match(/\.(svg|pdf|oga|png)(\?|$)/i)) continue
      if (imageUrl.includes('cropped-')) continue
      if (!imageUrl.endsWith('.jpg') && !imageUrl.endsWith('.jpeg')) continue

      const filename = imageUrl.split('/').pop() || ''
      const docid = `wle-${year}-${filename}`
      
      // Extract filename from Commons URL for the file page link
      const filenameMatch = imageUrl.match(/\/([^/]+\.jpg)$/i)
      const commonsFilename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : filename
      const commonsPageUrl = commonsFilename ? `https://commons.wikimedia.org/wiki/File:${commonsFilename}` : null

      entries.push({
        docid,
        title: altText.replace(/^(Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelveth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|seventh|eighth|ninth|tenth|) place\.\s*/i, '').trim(),
        author: '',
        imageUrl: imageUrl.includes('/thumb/') ? imageUrl.replace(/\/\d+px-/, '/1280px-') : imageUrl,
        commonsUrl: commonsPageUrl,
        license: 'CC BY-SA 4.0',
        year,
        source: 'EARTH',
      })
      postImageCount++
    }

    for (const file of commonsFiles) {
      if (!file.match(/\.(jpg|jpeg|png)$/i)) continue
      
      const alreadyExists = entries.some(e => e.docid.includes(file))
      if (!alreadyExists) {
        const docid = `wle-${year}-${file}`
        if (!entries.some(e => e.docid === docid)) {
          const cleanFilename = file.replace(/\s+/g, '_')
          const hash = crypto.createHash('md5').update(cleanFilename).digest('hex')
          const h1 = hash.substring(0, 1)
          const h2 = hash.substring(0, 2)
          const imageUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${h1}/${h2}/${cleanFilename}/1280px-${cleanFilename}`

          entries.push({
            docid,
            title: file.replace(/_/g, ' ').replace(/\.(jpg|jpeg|png)$/i, ''),
            author: '',
            imageUrl,
            commonsUrl: `https://commons.wikimedia.org/wiki/File:${cleanFilename}`,
            license: 'CC BY-SA 4.0',
            year,
            source: 'EARTH',
          })
          postImageCount++
        }
      }
    }
    
    console.log(`      Found ${postImageCount} images`)
  }

  console.log(`    Found ${entries.length} images`)
  return entries
}

async function cacheEntries(entries: WikiLovesImageEntry[]): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + MONTHS_MS)
  
  for (const entry of entries) {
    await prisma.cachedWikiLovesImage.upsert({
      where: { docid: entry.docid },
      update: { ...entry, scrapedAt: now, expiresAt },
      create: { ...entry, scrapedAt: now, expiresAt },
    })
  }
  
  console.log(`    Cached ${entries.length} images`)
}

async function cleanupExpired(): Promise<void> {
  const now = new Date()
  await prisma.cachedWikiLovesImage.deleteMany({
    where: { expiresAt: { lt: now } },
  })
  console.log('    Cleaned up expired entries')
}

export async function scrapeAndCacheWikiLoves(): Promise<void> {
  console.log('🌿 Scraping Wiki Loves...')
  
  const monumentsEntries = await scrapeWikiLovesMonuments()
  await cacheEntries(monumentsEntries)
  
  const earthEntries = await scrapeWikiLovesEarth()
  await cacheEntries(earthEntries)
  
  await cleanupExpired()
  
  console.log('✅ Wiki Loves scrape complete')
}

if (process.argv[1]?.includes('scrape-wikiloves')) {
  scrapeAndCacheWikiLoves()
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
