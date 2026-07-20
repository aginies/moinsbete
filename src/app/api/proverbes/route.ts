import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const WIKTIONARY_BASE = 'https://fr.wiktionary.org'

const ANNEXE_PAGES = [
  { id: 12582, title: 'Annexe:Liste de proverbes français', source: 'Proverbe français' },
  { id: 1479706, title: 'Annexe:Liste de proverbes algériens en français', source: 'Proverbe algérien' },
  { id: 1483255, title: 'Annexe:Liste de proverbes allemands', source: 'Proverbe allemand' },
  { id: 1483271, title: 'Annexe:Liste de proverbes amérindiens en français', source: 'Proverbe amérindien' },
  { id: 2468554, title: 'Annexe:Liste de proverbes anglais', source: 'Proverbe anglais' },
  { id: 1483275, title: 'Annexe:Liste de proverbes anglais et français équivalents', source: 'Proverbe anglais/français' },
  { id: 2466555, title: 'Annexe:Liste de proverbes arabes', source: 'Proverbe arabe' },
  { id: 1482404, title: 'Annexe:Liste de proverbes arabes en français', source: 'Proverbe arabe' },
  { id: 13154, title: 'Annexe:Liste de proverbes bambaras', source: 'Proverbe bambara' },
  { id: 1482401, title: 'Annexe:Liste de proverbes berbères', source: 'Proverbe berbère' },
  { id: 1483278, title: 'Annexe:Liste de proverbes bretons', source: 'Proverbe breton' },
  { id: 1879258, title: 'Annexe:Liste de proverbes chinois', source: 'Proverbe chinois' },
  { id: 1483286, title: 'Annexe:Liste de proverbes corses', source: 'Proverbe corse' },
  { id: 2441870, title: 'Annexe:Liste de proverbes créoles', source: 'Proverbe créole' },
  { id: 1483298, title: 'Annexe:Liste de proverbes créoles de La Réunion', source: 'Proverbe créole' },
  { id: 1483244, title: 'Annexe:Liste de proverbes d\'Afrique noire', source: 'Proverbe africain' },
  { id: 1483239, title: 'Annexe:Liste de proverbes d\'Afrique noire en français', source: 'Proverbe africain' },
  { id: 1486520, title: 'Annexe:Liste de proverbes en espéranto', source: 'Proverbe espéranto' },
  { id: 1486561, title: 'Annexe:Liste de proverbes espagnols', source: 'Proverbe espagnol' },
  { id: 1487760, title: 'Annexe:Liste de proverbes et expressions sur le chat', source: 'Proverbe thématique' },
  { id: 5053913, title: 'Annexe:Liste de proverbes haoussa', source: 'Proverbe haoussa' },
  { id: 1483290, title: 'Annexe:Liste de proverbes haïtiens', source: 'Proverbe haïtien' },
  { id: 2231682, title: 'Annexe:Maximes juridiques françaises', source: 'Maxime juridique' },
  { id: 1486766, title: 'Annexe:Liste de proverbes indiens', source: 'Proverbe indien' },
  { id: 1486768, title: 'Annexe:Liste de proverbes indonésiens', source: 'Proverbe indonésien' },
  { id: 1486772, title: 'Annexe:Liste de proverbes italiens', source: 'Proverbe italien' },
  { id: 1486774, title: 'Annexe:Liste de proverbes ivoiriens', source: 'Proverbe ivoirien' },
  { id: 1487747, title: 'Annexe:Liste de proverbes japonais', source: 'Proverbe japonais' },
  { id: 1487748, title: 'Annexe:Liste de proverbes kabyles', source: 'Proverbe kabyle' },
  { id: 1487752, title: 'Annexe:Liste de proverbes marocains', source: 'Proverbe marocain' },
  { id: 1487754, title: 'Annexe:Liste de proverbes portugais', source: 'Proverbe portugais' },
  { id: 1487756, title: 'Annexe:Liste de proverbes roumains', source: 'Proverbe roumain' },
  { id: 1487757, title: 'Annexe:Liste de proverbes sundanais', source: 'Proverbe sundanais' },
  { id: 1487758, title: 'Annexe:Liste de proverbes tunisiens', source: 'Proverbe tunisien' },
]

const CATEGORY_PAGES = [
  { category: 'Proverbes en français', source: 'Proverbe français' },
  { category: 'Expressions en français', source: 'Expression française' },
  { category: 'Locutions-phrases en français', source: 'Locution-phrase française' },
  { category: 'Idiotismes corporels en français', source: 'Expression française (corps)' },
  { category: 'Idiotismes animaliers en français', source: 'Expression française (animaux)' },
  { category: 'Idiotismes gastronomiques en français', source: 'Expression française (cuisine)' },
  { category: 'Comparaisons en français', source: 'Comparaison française' },
]

let fetchProgress: { 
  status: 'idle' | 'fetching' | 'done' | 'stopped'
  progress: string
  currentPage: string
  total: number
  added: number
  perPage?: number
} = {
  status: 'idle',
  progress: '',
  currentPage: '',
  total: 0,
  added: 0
}

interface ProverbeEntry {
  id: string
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

interface CachedProverbe {
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

const cleanWikitext = (text: string): string => {
  if (!text) return ''
  
  // 1. Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, ' ')
  
  // 2. Format / strip mediawiki links [[target|text]] or [[target]]
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
    if (p1.includes('|')) {
      return p1.split('|')[1].trim()
    }
    return p1.trim()
  })
  
  // 3. Simple mediawiki template cleanup
  cleaned = cleaned.replace(/\{\{([^}]+)\}\}/g, (_, p1) => {
    const parts = p1.split('|')
    const name = parts[0].toLowerCase().trim()
    
    if (name === 'lang' || name === 'langue') {
      return parts[2] ? parts[2].trim() : ''
    }
    if (name === 'figuré' || name === 'fig') {
      return '(Figuré)'
    }
    if (name === 'familier' || name === 'fam') {
      return '(Familier)'
    }
    if (name === 'populaire' || name === 'pop') {
      return '(Populaire)'
    }
    if (name === 'littéraire' || name === 'lit') {
      return '(Littéraire)'
    }
    if (name === 'prov' || name === 'proverbe') {
      return '(Proverbe)'
    }
    if (name === 'cf' || name === 'voir') {
      return parts[1] ? `(cf. ${parts[1].trim()})` : ''
    }
    if (parts.length === 1) {
      return `(${parts[0].trim()})`
    }
    if (parts[1] === 'fr' || parts[parts.length - 1] === 'fr') {
      return `(${parts[0].trim()})`
    }
    return ''
  })

  // 4. Remove triple/double quotes
  cleaned = cleaned.replace(/'''/g, '').replace(/''/g, '')

  // 5. Clean up whitespace
  return cleaned.replace(/\s+/g, ' ').trim()
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAndParsePage(pageInfo: typeof ANNEXE_PAGES[0]): Promise<CachedProverbe[]> {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const url = `${WIKTIONARY_BASE}/w/api.php?action=query&pageids=${pageInfo.id}&prop=revisions&rvprop=content&format=json`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'MoinsBete/1.0 (https://moinsbete.com; mailto:admin@moinsbete.com)',
        },
      })
      if (!res.ok) {
        if (res.status === 429) {
          await delay(5000)
          continue
        }
        return []
      }

      const data = await res.json()
      const pages = data?.query?.pages
      console.log(`  Pages:`, Object.keys(pages || {}))
      if (!pages) return []

      for (const pageId of Object.keys(pages)) {
        const pageData = pages[pageId]
        console.log(`  Page ${pageId}: missing=`, pageData?.missing, 'hasRevisions=', !!pageData?.revisions?.[0]?.['*'])
        if (pageData?.revisions?.[0]?.['*']) {
          return parseAnnexContent(pageData.revisions[0]['*'], pageInfo.source)
        }
      }
    } catch (error) {
      console.error(`Retry ${retry + 1} for page: ${pageInfo.title}`, error)
      await delay(5000)
    }
  }
  return []
}

interface WiktionaryPage {
  pageid?: number
  title?: string
  missing?: string | boolean
  revisions?: Array<{
    '*'?: string
  }>
  categories?: Array<{
    title?: string
  }>
}

async function verifyFrenchWiktionnaire(proverbs: CachedProverbe[]): Promise<CachedProverbe[]> {
  const verified: CachedProverbe[] = []
  const batchSize = 50
  
  for (let i = 0; i < proverbs.length; i += batchSize) {
    const batch = proverbs.slice(i, i + batchSize)
    const titles = batch.map(p => p.text)
    
    try {
      const url = `${WIKTIONARY_BASE}/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=revisions|categories&rvprop=content&cllimit=500&format=json`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'MoinsBete/1.0 (https://moinsbete.com; mailto:admin@moinsbete.com)',
        },
      })
      
      if (!res.ok) {
        continue
      }
      
      const data = await res.json()
      const pages = (data?.query?.pages || {}) as Record<string, WiktionaryPage>
      
      const pageMap = new Map<string, WiktionaryPage>()
      for (const pageId of Object.keys(pages)) {
        const pageData = pages[pageId]
        if (pageData.title) {
          pageMap.set(pageData.title.toLowerCase(), pageData)
        }
      }
      
      for (const p of batch) {
        const pageData = pageMap.get(p.text.toLowerCase())
        if (pageData && pageData.pageid && pageData.pageid !== -1 && !pageData.missing) {
          const content = pageData.revisions?.[0]?.['*'] || ''
          const categories = pageData.categories || []
          
          const hasFrenchLanguageHeader = content.includes('{{langue|fr}}') || content.includes('{{L|fr}}')
          const hasFrenchProverbCategory = categories.some((c) => 
            c.title?.toLowerCase().includes('proverbes en français') || 
            c.title?.toLowerCase().includes('français')
          )
          const hasFrenchSection = hasFrenchLanguageHeader || hasFrenchProverbCategory || content.includes('== {{fr}} ==') || content.includes('== français ==') || content.includes('== Français ==')
          
          if (hasFrenchSection) {
            let etymologie = ''
            let definitions: string[] = []
            
            const etymMatch = content.match(/==\s*\{\{S\|étymologie\}\}\s*==([\s\S]*?)(?==\s*\{)/)
            if (etymMatch) {
              etymologie = cleanWikitext(etymMatch[1])
            }

            const defMatches = content.match(/#\s+([^(].*?)(?=\n\*|\n#|$)/g)
            if (defMatches) {
              definitions = defMatches.map((d: string) => cleanWikitext(d.replace(/^#\s+/, ''))).filter(Boolean)
            }
            
            verified.push({
              ...p,
              hasWiktionnairePage: true,
              wiktionnaireUrl: pageData.title ? `${WIKTIONARY_BASE}/wiki/${encodeURIComponent(pageData.title)}` : undefined,
              etymologie: etymologie || undefined,
              definitions: definitions.length > 0 ? definitions : undefined
            })
          }
        }
      }
    } catch (error) {
      console.error('Error verifying batch:', error)
    }
    
    await delay(1000)
  }
  
  return verified
}

async function fetchCategoryPages(category: string, source: string): Promise<CachedProverbe[]> {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const allProverbs: CachedProverbe[] = []
      let cmcontinue: string | undefined = undefined
      
      do {
        let url = `${WIKTIONARY_BASE}/w/api.php?action=query&list=categorymembers&cmtitle=Catégorie:${encodeURIComponent(category)}&cmlimit=500&cmnamespace=0&format=json`
        if (cmcontinue) {
          url += `&cmcontinue=${encodeURIComponent(cmcontinue)}`
        }
        
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'MoinsBete/1.0 (https://moinsbete.com; mailto:admin@moinsbete.com)',
          },
        })
        
        if (!res.ok) {
          if (res.status === 429) {
            await delay(5000)
            continue
          }
          break
        }
        
        const data = await res.json()
        const members = data?.query?.categorymembers || []
        
        for (const member of members) {
          if (member.title) {
            const text = member.title.trim()
            if (text && text.length > 3 && !text.includes(':') && !text.includes('{') && !text.includes('}')) {
              allProverbs.push({
                text,
                signification: '',
                source,
                hasWiktionnairePage: true,
                wiktionnaireUrl: `${WIKTIONARY_BASE}/wiki/${encodeURIComponent(text)}`
              })
            }
          }
        }
        
        cmcontinue = data?.continue?.cmcontinue
        if (cmcontinue) {
          await delay(500) // Small delay between pagination calls
        }
      } while (cmcontinue)
      
      return allProverbs
    } catch (error) {
      console.error(`Retry ${retry + 1} for category: ${category}`, error)
      await delay(5000)
    }
  }
  return []
}

async function fetchAllAnnexPagesSequentially(): Promise<{ total: number; added: number }> {
  // Clear the cache first to ensure a complete, clean, up-to-date fetch of all 14 pages
  await clearProverbesCache()
  
  const allProverbs: CachedProverbe[] = []
  const existingTexts = new Set<string>()
  
  let pageId = 0
  const totalPages = ANNEXE_PAGES.length + CATEGORY_PAGES.length
  
  for (const page of ANNEXE_PAGES) {
    pageId++
    
    fetchProgress.progress = `${pageId}/${totalPages}`
    fetchProgress.currentPage = page.title
    fetchProgress.perPage = undefined
    
    console.log(`  Page ${pageId}/${totalPages}: Fetching ${page.title}...`)
    const entries = await fetchAndParsePage(page)
    
    if (entries.length === 0) {
      console.log(`  Page ${pageId}/${totalPages}: ${page.title} - 0 entries, skipping`)
      continue
    }

    console.log(`  Page ${pageId}/${totalPages}: Verifying ${entries.length} parsed entries against Wiktionary (French check)...`)
    const verifiedEntries = await verifyFrenchWiktionnaire(entries)
    console.log(`  Page ${pageId}/${totalPages}: ${verifiedEntries.length}/${entries.length} entries verified.`)

    const newProverbs = verifiedEntries.filter(p => !existingTexts.has(p.text))
    allProverbs.push(...newProverbs)
    
    for (const entry of verifiedEntries) {
      existingTexts.add(entry.text)
    }
    
    const newCachedPageIds = [page.id] // Not strictly needed anymore since we clear cache, but good for record
    await saveCachedPageIds(newCachedPageIds)
    
    fetchProgress.perPage = verifiedEntries.length
    fetchProgress.total = allProverbs.length
    console.log(`  Page ${pageId}/${totalPages}: ${page.title} - ${verifiedEntries.length} verified (${newProverbs.length} new)`)
    await delay(2000)
  }
  
  for (const cat of CATEGORY_PAGES) {
    pageId++
    
    fetchProgress.progress = `${pageId}/${totalPages}`
    fetchProgress.currentPage = `Catégorie: ${cat.category}`
    fetchProgress.perPage = undefined
    
    console.log(`  Page ${pageId}/${totalPages}: Fetching category ${cat.category}...`)
    const entries = await fetchCategoryPages(cat.category, cat.source)
    
    if (entries.length === 0) {
      console.log(`  Page ${pageId}/${totalPages}: ${cat.category} - 0 entries, skipping`)
      continue
    }

    console.log(`  Page ${pageId}/${totalPages}: Verifying ${entries.length} entries from ${cat.category}...`)
    const verifiedEntries = await verifyFrenchWiktionnaire(entries)
    console.log(`  Page ${pageId}/${totalPages}: ${verifiedEntries.length}/${entries.length} entries verified as French.`)

    const newProverbs = verifiedEntries.filter(p => !existingTexts.has(p.text))
    allProverbs.push(...newProverbs)
    
    for (const entry of verifiedEntries) {
      existingTexts.add(entry.text)
    }
    
    fetchProgress.perPage = verifiedEntries.length
    fetchProgress.total = allProverbs.length
    console.log(`  Page ${pageId}/${totalPages}: ${cat.category} - ${verifiedEntries.length} verified (${newProverbs.length} new)`)
    await delay(2000)
  }
  
  const total = allProverbs.length
  const added = allProverbs.length
  
  await saveProverbesToDb(allProverbs)
  
  console.log(`Fetch complete: total=${total}, added=${added}`)
  return { total, added }
}

function parseAnnexContent(content: string, source: string): CachedProverbe[] {
  const entries: CachedProverbe[] = []
  const lines = content.split('\n')
  let inProverbSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.match(/^==.+==/i)) {
      inProverbSection = true
      continue
    }
    
    // If no section found yet, treat all lines as proverb section
    if (!inProverbSection && (trimmed.startsWith('*') || trimmed.startsWith(';'))) {
      inProverbSection = true
    }
    
    if (!inProverbSection) continue
    
    let text: string | null = null
    let signification: string = ''
    
    // 1. Semicolon format (Creole, Haiti/Esperanto)
    if (trimmed.startsWith(';')) {
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex !== -1) {
        let frenchPart = trimmed.substring(colonIndex + 1).trim()
        frenchPart = frenchPart.replace(/''/g, '').replace(/«|»/g, '').trim()
        if (frenchPart) {
          text = frenchPart
        }
      }
    } 
    // 2. Kabyle format starting with *; or * ;
    else if (trimmed.startsWith('*;') || trimmed.startsWith('*;')) {
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex !== -1) {
        let frenchPart = trimmed.substring(colonIndex + 1).trim()
        frenchPart = frenchPart.replace(/''/g, '').replace(/«|»/g, '').trim()
        if (frenchPart) {
          text = frenchPart
        }
      }
    }
    // 3. Corsican format starting with : and having bold
    else if (trimmed.startsWith(':') && trimmed.includes("'''")) {
      let withoutBold = trimmed.replace(/:\s*'''[^']+'''/, '').trim()
      withoutBold = withoutBold.replace(/\([^)]+\)/g, '').replace(/<ref[^>]*>.*?<\/ref>/gi, '').trim()
      if (withoutBold) {
        text = withoutBold
      }
    }
    // 4. Standard list format starting with * or :
    else if (trimmed.startsWith('* ') || trimmed.startsWith('*	') || trimmed.startsWith(':') || trimmed.startsWith(':- ')) {
      const quoteMatch = trimmed.match(/«([^»]+)»/)
      const wikiMatch = trimmed.match(/\[\[([^\]]+)\]\]/)
      const boldMatch = trimmed.match(/'''(.+?)'''/)
      const sourceMatch = trimmed.match(/\(([^)]+)\)/)
      
      // Prefer quoted text (African proverbs use « »), then bold, then wiki link
      let rawText = quoteMatch ? quoteMatch[1].trim() : (boldMatch ? boldMatch[1].trim() : (wikiMatch ? wikiMatch[1].trim() : null))
      
      if (wikiMatch && !quoteMatch && !boldMatch) {
        const rawWiki = wikiMatch[1].trim()
        if (rawWiki.includes('|')) {
          rawText = rawWiki.split('|')[0].trim() // Use the actual page title as the text/title
        } else {
          rawText = rawWiki
        }
      }

      // If no wiki link, quotes, or bold, use the whole line after '* ' or ':'
      if (!rawText) {
        const prefix = trimmed.startsWith(':') ? 1 : 2
        rawText = trimmed.substring(prefix).trim()
      }
      
      if (rawText) {
        // Clean up rawText
        rawText = rawText.replace(/<ref[^>]*>.*?<\/ref>/gi, '').replace(/<ref[^>]*\/>/gi, '').trim()
        const trailingSource = rawText.match(/^(.+?)\s*\(.*\)\s*$/)
        if (trailingSource) {
          rawText = trailingSource[1].trim()
        }
        rawText = rawText.replace(/[.;:]+$/, '').trim()
        text = rawText
      }
      
      if (sourceMatch) {
        signification = cleanWikitext(sourceMatch[1])
      }
    }
    
    if (text) {
      // Final sanitization of the proverb text
      const cleanText = text.replace(/\s+/g, ' ')
                            .replace(/<[^>]*>/g, '') // remove HTML tags
                            .replace(/[.;:]+$/, '')  // remove trailing punctuation
                            .trim()
      
      // Let's only add if it has some content and doesn't look like code/wiki markup
      if (cleanText && cleanText.length > 3 && !cleanText.includes('{') && !cleanText.includes('}') && !cleanText.includes('[')) {
        entries.push({
          text: cleanText,
          signification: cleanWikitext(signification),
          source,
          hasWiktionnairePage: false,
        })
      }
    }
  }

  return entries
}

async function getCachedPageIds(): Promise<number[]> {
  try {
    const cached = await prisma.cachedConfig.findUnique({
      where: { key: 'proverbes_cached_pages' },
    })
    if (cached) {
      return JSON.parse(cached.value) as number[]
    }
  } catch (error) {
    console.error('Failed to get cached page IDs:', error)
  }
  return []
}

async function saveCachedPageIds(pageIds: number[]): Promise<void> {
  try {
    await prisma.cachedConfig.upsert({
      where: { key: 'proverbes_cached_pages' },
      create: { key: 'proverbes_cached_pages', value: JSON.stringify(pageIds) },
      update: { value: JSON.stringify(pageIds) },
    })
  } catch (error) {
    console.error('Failed to save cached page IDs:', error)
  }
}

async function fetchAllProverbesFromDb(): Promise<CachedProverbe[]> {
  try {
    const cached = await prisma.cachedConfig.findUnique({
      where: { key: 'proverbes_all' },
    })
    if (cached) {
      const proverbs = JSON.parse(cached.value) as CachedProverbe[]
      if (proverbs.length > 0) {
        return proverbs
      }
    }
  } catch (error) {
    console.error('Failed to fetch proverbs from DB:', error)
  }
  return []
}

async function saveProverbesToDb(proverbes: CachedProverbe[]): Promise<void> {
  try {
    await prisma.cachedConfig.upsert({
      where: { key: 'proverbes_all' },
      create: { key: 'proverbes_all', value: JSON.stringify(proverbes) },
      update: { value: JSON.stringify(proverbes) },
    })
  } catch (error) {
    console.error('Failed to save proverbs to DB:', error)
  }
}

async function clearProverbesCache(): Promise<void> {
  try {
    await prisma.cachedConfig.deleteMany({
      where: {
        OR: [
          { key: 'proverbes_all' },
          { key: 'proverbes_cached_pages' },
        ],
      },
    })
  } catch (error) {
    console.error('Failed to clear proverbes cache:', error)
  }
}

async function fetchRandomAnnexPage(): Promise<CachedProverbe[]> {
  const cachedPageIds = await getCachedPageIds()
  
  const uncachedPages = ANNEXE_PAGES.filter(page => !cachedPageIds.includes(page.id))
  
  if (uncachedPages.length === 0) {
    return []
  }
  
  for (const page of uncachedPages) {
    const entries = await fetchAndParsePage(page)
    if (entries.length > 0) {
      const newCachedPageIds = [...cachedPageIds, page.id]
      await saveCachedPageIds(newCachedPageIds)
      return entries
    }
    await delay(2000)
  }
  
  return []
}

async function enrichWithWiktionnaire(proverbes: CachedProverbe[]): Promise<ProverbeEntry[]> {
  const enriched: ProverbeEntry[] = []

  for (const p of proverbes) {
    const slug = p.text.toLowerCase()
      .replace(/[^a-zàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100)

    // Use cached values directly if available to prevent unnecessary real-time fetches
    if (p.hasWiktionnairePage) {
      enriched.push({
        ...p,
        id: slug,
        signification: cleanWikitext(p.signification),
        wiktionnaireUrl: p.wiktionnaireUrl,
        etymologie: p.etymologie,
        definitions: p.definitions
      })
      continue
    }

    try {
      const url = `${WIKTIONARY_BASE}/w/api.php?action=query&titles=${encodeURIComponent(p.text)}&prop=revisions&rvprop=content&format=json`
      const res = await fetch(url, { 
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MoinsBete/1.0 (https://moinsbete.com; mailto:admin@moinsbete.com)',
        },
      })
      if (!res.ok) {
        enriched.push({ ...p, id: slug, signification: cleanWikitext(p.signification), wiktionnaireUrl: `https://fr.wiktionary.org/wiki/${encodeURIComponent(p.text)}` })
        continue
      }

      const data = await res.json()
      const pages = data?.query?.pages
      let hasPage = false
      let etymologie = ''
      let definitions: string[] = []

      for (const pageId of Object.keys(pages || {})) {
        const pageData = pages[pageId]
        const isMissing = pageId === '-1' || pageData.missing === true || pageData.missing === ''
        
        if (!isMissing) {
          hasPage = true
          const content = pageData.revisions?.[0]?.['*']
          if (content) {
            const etymMatch = content.match(/==\s*\{\{S\|étymologie\}\}\s*==([\s\S]*?)(?==\s*\{)/)
            if (etymMatch) {
              etymologie = cleanWikitext(etymMatch[1])
            }

            const defMatches = content.match(/#\s+([^(].*?)(?=\n\*|\n#|$)/g)
            if (defMatches) {
              definitions = defMatches.map((d: string) => cleanWikitext(d.replace(/^#\s+/, ''))).filter(Boolean)
            }
          }
        }
      }

      enriched.push({
        ...p,
        id: slug,
        signification: cleanWikitext(p.signification),
        hasWiktionnairePage: hasPage,
        wiktionnaireUrl: hasPage ? `https://fr.wiktionary.org/wiki/${encodeURIComponent(p.text)}` : undefined,
        etymologie: hasPage ? etymologie : undefined,
        definitions: hasPage ? definitions : undefined,
      })
    } catch {
      enriched.push({ ...p, id: slug, signification: cleanWikitext(p.signification), wiktionnaireUrl: `https://fr.wiktionary.org/wiki/${encodeURIComponent(p.text)}` })
    }
  }

  return enriched
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const q = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100)

  if (action === 'fetch-all') {
    if (request.method === 'POST') {
      if (fetchProgress.status === 'idle') {
        fetchProgress.status = 'fetching'
        fetchProgress.progress = `0/${ANNEXE_PAGES.length + CATEGORY_PAGES.length}`
        fetchProgress.currentPage = ''
        fetchProgress.total = 0
        fetchProgress.added = 0
        
        const result = await fetchAllAnnexPagesSequentially()
        fetchProgress.total = result.total
        fetchProgress.added = result.added
        fetchProgress.status = 'done'
        fetchProgress.progress = `${ANNEXE_PAGES.length + CATEGORY_PAGES.length}/${ANNEXE_PAGES.length + CATEGORY_PAGES.length}`
        
        return NextResponse.json({ 
          status: 'done',
          total: fetchProgress.total,
          added: fetchProgress.added
        })
      }
      
      return NextResponse.json({ 
        status: fetchProgress.status,
        progress: fetchProgress.progress,
        currentPage: fetchProgress.currentPage,
        total: fetchProgress.total,
        added: fetchProgress.added,
        perPage: fetchProgress.perPage
      })
    }
    
    return NextResponse.json({ 
      status: fetchProgress.status,
      progress: fetchProgress.progress,
      currentPage: fetchProgress.currentPage,
      total: fetchProgress.total,
      added: fetchProgress.added,
      perPage: fetchProgress.perPage
    })
  }

  if (action === 'clear-cache') {
    fetchProgress = {
      status: 'idle',
      progress: '',
      currentPage: '',
      total: 0,
      added: 0
    }
    await clearProverbesCache()
    return NextResponse.json({ success: true })
  }

  if (action === 'random') {
    try {
      let allProverbes = await fetchAllProverbesFromDb()
      
      if (allProverbes.length === 0) {
        const newProverbes = await fetchRandomAnnexPage()
        if (newProverbes.length > 0) {
          await saveProverbesToDb(newProverbes)
          allProverbes = newProverbes
        }
      }
      
      if (allProverbes.length === 0) {
        return NextResponse.json({ error: 'No proverbs available' }, { status: 503 })
      }
      const randomIndex = Math.floor(Math.random() * allProverbes.length)
      const proverb = allProverbes[randomIndex]
      const enriched = await enrichWithWiktionnaire([proverb])
      return NextResponse.json(enriched[0])
    } catch (error) {
      console.error('Proverbe random error:', error)
      return NextResponse.json({ error: 'Failed to fetch random proverb' }, { status: 500 })
    }
  }

  if (action === 'search' && q) {
    try {
      let allProverbes = await fetchAllProverbesFromDb()
      
      if (allProverbes.length === 0) {
        const newProverbes = await fetchRandomAnnexPage()
        if (newProverbes.length > 0) {
          await saveProverbesToDb(newProverbes)
          allProverbes = newProverbes
        }
      }
      
      const qLower = q.toLowerCase()
      const results = allProverbes.filter(p =>
        p.text.toLowerCase().includes(qLower) ||
        p.signification.toLowerCase().includes(qLower) ||
        p.source.toLowerCase().includes(qLower)
      ).slice(0, 20)
      const enriched = await enrichWithWiktionnaire(results)
      return NextResponse.json({ proverbs: enriched })
    } catch (error) {
      console.error('Proverbe search error:', error)
      return NextResponse.json({ proverbs: [] })
    }
  }

  if (action === 'list') {
    try {
      let allProverbes = await fetchAllProverbesFromDb()
      
      if (allProverbes.length === 0) {
        const newProverbes = await fetchRandomAnnexPage()
        if (newProverbes.length > 0) {
          await saveProverbesToDb(newProverbes)
          allProverbes = newProverbes
        }
      }
      
      const total = allProverbes.length
      const start = (page - 1) * limit
      const paginated = allProverbes.slice(start, start + limit)
      const enriched = await enrichWithWiktionnaire(paginated)
      return NextResponse.json({ proverbs: enriched, total, page, limit })
    } catch (error) {
      console.error('Proverbe list error:', error)
      return NextResponse.json({ proverbs: [], total: 0, page, limit })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'clear-cache') {
    fetchProgress = {
      status: 'idle',
      progress: '',
      currentPage: '',
      total: 0,
      added: 0
    }
    await clearProverbesCache()
    return NextResponse.json({ success: true })
  }

  if (action === 'fetch-all') {
    if (fetchProgress.status === 'idle') {
      fetchProgress.status = 'fetching'
      fetchProgress.progress = `0/${ANNEXE_PAGES.length + CATEGORY_PAGES.length}`
      fetchProgress.currentPage = ''
      fetchProgress.total = 0
      fetchProgress.added = 0
      
      fetchAllAnnexPagesSequentially().then(result => {
        fetchProgress.total = result.total
        fetchProgress.added = result.added
        fetchProgress.status = 'done'
        fetchProgress.progress = `${ANNEXE_PAGES.length + CATEGORY_PAGES.length}/${ANNEXE_PAGES.length + CATEGORY_PAGES.length}`
      }).catch(err => {
        console.error('Error during fetch-all:', err)
        fetchProgress.status = 'stopped'
      })
      
      return NextResponse.json({ status: 'started' })
    }
    
    if (fetchProgress.status === 'fetching') {
      return NextResponse.json({ 
        status: 'fetching',
        progress: fetchProgress.progress,
        currentPage: fetchProgress.currentPage,
        total: fetchProgress.total,
        added: fetchProgress.added,
        perPage: fetchProgress.perPage
      })
    }
    
    if (fetchProgress.status === 'done') {
      return NextResponse.json({ 
        status: 'done',
        total: fetchProgress.total,
        added: fetchProgress.added
      })
    }
    
    if (fetchProgress.status === 'stopped') {
      return NextResponse.json({ 
        status: 'stopped',
        total: fetchProgress.total,
        added: fetchProgress.added
      })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
