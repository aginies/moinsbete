import { prisma } from '../lib/db'

const WIKTIONARY_BASE = 'https://fr.wiktionary.org'

const AFRICAN_PAGE = {
  id: 1483239,
  title: 'Annexe:Liste de proverbes d’Afrique noire en français',
  source: 'Proverbe africain',
}

const cleanWikitext = (text: string): string => {
  if (!text) return ''
  let cleaned = text.replace(/<[^>]*>/g, ' ')
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
    if (p1.includes('|')) return p1.split('|')[1].trim()
    return p1.trim()
  })
  cleaned = cleaned.replace(/\{\{([^}]+)\}\}/g, (_, p1) => {
    const parts = p1.split('|')
    const name = parts[0].toLowerCase().trim()
    if (name === 'lang' || name === 'langue') return parts[2] ? parts[2].trim() : ''
    if (parts.length === 1) return `(${parts[0].trim()})`
    return ''
  })
  cleaned = cleaned.replace(/'''/g, '').replace(/''/g, '')
  return cleaned.replace(/\s+/g, ' ').trim()
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAfricanProverbs(): Promise<any[]> {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const url = `${WIKTIONARY_BASE}/w/api.php?action=query&pageids=${AFRICAN_PAGE.id}&prop=revisions&rvprop=content&format=json`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'MoinsBete/1.0 (https://moinsbete.com)' },
      })
      if (!res.ok) {
        if (res.status === 429) { await delay(5000); continue }
        return []
      }
      const data = await res.json()
      const pages = data?.query?.pages
      for (const pageId of Object.keys(pages)) {
        const pageData = pages[pageId]
        if (pageData?.revisions?.[0]?.['*']) {
          return parseAnnexContent(pageData.revisions[0]['*'], AFRICAN_PAGE.source)
        }
      }
    } catch (error) {
      console.error(`Retry ${retry + 1}`, error)
      await delay(5000)
    }
  }
  return []
}

function parseAnnexContent(content: string, source: string): any[] {
  const entries: any[] = []
  const lines = content.split('\n')
  let inProverbSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.match(/^==.+==/i)) { inProverbSection = true; continue }
    if (!inProverbSection && (trimmed.startsWith('*') || trimmed.startsWith(';'))) { inProverbSection = true }
    if (!inProverbSection) continue

    let text: string | null = null
    let signification: string = ''

    if (trimmed.startsWith(';')) {
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex !== -1) {
        let frenchPart = trimmed.substring(colonIndex + 1).trim()
        frenchPart = frenchPart.replace(/''/g, '').replace(/«|»/g, '').trim()
        if (frenchPart) text = frenchPart
      }
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('*	') || trimmed.startsWith(':')) {
      const quoteMatch = trimmed.match(/«([^»]+)»/)
      const wikiMatch = trimmed.match(/\[\[([^\]]+)\]\]/)
      const boldMatch = trimmed.match(/'''(.+?)'''/)
      let rawText = quoteMatch ? quoteMatch[1].trim() : (boldMatch ? boldMatch[1].trim() : (wikiMatch ? wikiMatch[1].trim() : null))
      if (!rawText) {
        const prefix = trimmed.startsWith(':') ? 1 : 2
        rawText = trimmed.substring(prefix).trim()
      }
      if (rawText) {
        rawText = rawText.replace(/<ref[^>]*>.*?<\/ref>/gi, '').replace(/[.;:]+$/, '').trim()
        text = rawText
      }
    }

    if (text) {
      let cleanText = text.replace(/\[\[([^\]]+)\]\]/g, '$1')
      cleanText = cleanText.replace(/\s+/g, ' ').replace(/<[^>]*>/g, '').replace(/[.;:]+$/, '').trim()
      if (cleanText && cleanText.length > 3 && !cleanText.includes('{') && !cleanText.includes('}')) {
        entries.push({ text: cleanText, signification: cleanWikitext(signification), source })
      }
    }
  }
  return entries
}

async function main() {
  console.log('Fetching African proverbs...')
  const entries = await fetchAfricanProverbs()
  console.log(`Found ${entries.length} proverbs`)

  const existing = await prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } })
  let allProverbs: any[] = []
  if (existing) {
    allProverbs = JSON.parse(existing.value)
  }

  const existingTexts = new Set(allProverbs.map((p: any) => p.text))
  const newProverbs = entries.filter((e: any) => !existingTexts.has(e.text))

  console.log(`New proverbs to add: ${newProverbs.length}`)
  
  if (newProverbs.length > 0) {
    allProverbs.push(...newProverbs)
    await prisma.cachedConfig.upsert({
      where: { key: 'proverbes_all' },
      create: { key: 'proverbes_all', value: JSON.stringify(allProverbs) },
      update: { value: JSON.stringify(allProverbs) },
    })
    console.log('Saved to DB')
  } else {
    console.log('All already in DB')
  }

  // Show diarrhea proverbs
  const diarrhea = newProverbs.filter((p: any) => p.text.toLowerCase().includes('diarrhée'))
  if (diarrhea.length > 0) {
    console.log('\nDiarrhea proverbs:')
    diarrhea.forEach((p: any) => console.log(`  - "${p.text}" (${p.source})`))
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
