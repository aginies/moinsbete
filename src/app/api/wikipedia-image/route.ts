import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

interface ImageEntry {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const archives = MONTHS.flatMap((m) =>
  Array.from({ length: 2026 - 2005 + 1 }, (_, i) => `${m} ${2005 + i}`)
)

function extractEntries(html: string): ImageEntry[] {
  const entries: ImageEntry[] = []
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/g
  let h2Match: RegExpExecArray | null

  while ((h2Match = h2Regex.exec(html)) !== null) {
    const h2Content = h2Match[1]
    const dateMatch = h2Content.match(/(\d{1,2}(?:er)?\s+\w+\s+\d{4})/)
    if (!dateMatch) continue

    const date = dateMatch[1].replace(/<[^>]*>/g, '').trim()
    const afterH2 = html.slice(h2Match.index + h2Match[0].length)

    const imgSrcMatch = afterH2.match(/src="(\/\/upload\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterH2.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterH2.match(/href="\/wiki\/Fichier:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      entries.push({
        imageUrl: `https:${imgSrcMatch[1]}`,
        description: imgAltMatch[1]
          .replace(/\s*\([^)]*définition réelle[^)]*\)/, '')
          .trim(),
        fileUrl: `https://fr.wikipedia.org/wiki/Fichier:${fileHrefMatch[1]}`,
        date,
      })
    }

    if (entries.length >= 31) break
  }

  return entries
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'moinsbete (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(15000),
      })
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        if (i < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
        return null
      }
    } catch {
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000))
        continue
      }
      return null
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!checkRateLimit(`wiki-image:${clientId}`, 10, 60_000)) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    // Retry logic: pick random archives until we find one with valid entries
    const usedArchives = new Set<string>()
    const maxRetries = 5
    let entries: ImageEntry[] = []
    let randomArchive: string

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Pick a random archive not yet tried
      do {
        randomArchive = archives[Math.floor(Math.random() * archives.length)]
      } while (usedArchives.has(randomArchive) && usedArchives.size < archives.length)
      
      usedArchives.add(randomArchive)

      const data = await fetchWithRetry(
        `https://fr.wikipedia.org/w/api.php?action=parse&page=Wikip%C3%A9dia:Image_du_jour/${encodeURIComponent(randomArchive)}&prop=text&format=json`
      )

      if (!data?.parse?.text?.['*']) continue

      entries = extractEntries(data.parse.text['*'])
      if (entries.length > 0) break
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: true })
    }

    const randomEntry = entries[Math.floor(Math.random() * entries.length)]

    return NextResponse.json({
      imageUrl: randomEntry.imageUrl,
      description: randomEntry.description,
      fileUrl: randomEntry.fileUrl,
      date: randomEntry.date,
    })
  } catch (error) {
    console.error('Wikipedia image error:', error)
    return NextResponse.json({ error: true })
  }
}
