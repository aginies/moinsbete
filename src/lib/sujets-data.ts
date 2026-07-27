import { prisma } from './db'

export interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

export interface RadioFranceDoc {
  id: string
  title: string
  description: string
  url: string
  radio: string
  section: string
  image?: string
}

export interface ProverbeEntry {
  id: string
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

export interface PortailLexicalWord {
  form: string
  pos: string
  full_form: string
  full_pos: string
  description: string
  ipa: string
  tlfidefinitions: string[]
  wiktionnaireDefinitions: string[]
  etymologie: string
  concordance: Array<{
    name: string
    title: string
    date: string
    left: string
    matching: string
    right: string
  }>
}

export interface WikipediaImageData {
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

function extractEntries(html: string): Array<{ imageUrl: string; description: string; fileUrl: string; date: string }> {
  const entries: Array<{ imageUrl: string; description: string; fileUrl: string; date: string }> = []
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
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }

      entries.push({
        imageUrl,
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

export async function fetchCnrsArticle(): Promise<CnrsArticle | null> {
  const now = new Date()
  const articles = await prisma.cachedCnrsArticle.findMany({
    where: { expiresAt: { gte: now } },
    orderBy: { scrapedAt: 'desc' },
  })

  if (articles.length === 0) return null

  const article = articles[Math.floor(Math.random() * articles.length)]

  return {
    title: article.title || 'Actualité CNRS',
    imageUrl: article.imageUrl,
    link: article.link,
    category: article.category || 'Sciences',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
  }
}

export async function fetchRadioFranceDoc(): Promise<RadioFranceDoc | null> {
  const now = new Date()
  const totalCached = await prisma.cachedRadioEpisode.count({
    where: { expiresAt: { gte: now } },
  })

  if (totalCached === 0) return null

  const randomOffset = Math.floor(Math.random() * totalCached)
  const doc = await prisma.cachedRadioEpisode.findFirst({
    where: { expiresAt: { gte: now } },
    skip: randomOffset,
  })

  if (!doc) return null

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    url: doc.link,
    radio: doc.radio,
    section: doc.radio,
    image: doc.imageUrl || undefined,
  }
}

interface RawProverbe {
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

interface ProverbeCache {
  raw: RawProverbe[]
  expiresAt: number
}

let proverbesCache: ProverbeCache | null = null

function toEntry(p: RawProverbe): ProverbeEntry {
  const slug = p.text.toLowerCase()
    .replace(/[^a-zàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
  return {
    id: slug,
    text: p.text,
    signification: p.signification || '',
    source: p.source,
    hasWiktionnairePage: p.hasWiktionnairePage,
    wiktionnaireUrl: p.wiktionnaireUrl,
    etymologie: p.etymologie,
    definitions: p.definitions,
  }
}

export async function fetchProverbe(): Promise<ProverbeEntry | null> {
  const now = Date.now()
  if (proverbesCache && proverbesCache.expiresAt > now && proverbesCache.raw.length > 0) {
    const raw = proverbesCache.raw
    const random = raw[Math.floor(Math.random() * raw.length)]
    return toEntry(random)
  }

  try {
    const cached = await prisma.cachedConfig.findUnique({
      where: { key: 'proverbes_all' },
    })

    if (!cached) return null

    const proverbs = JSON.parse(cached.value) as RawProverbe[]

    if (proverbs.length === 0) return null

    proverbesCache = {
      raw: proverbs,
      expiresAt: now + 5 * 60 * 1000,
    }

    const random = proverbs[Math.floor(Math.random() * proverbs.length)]
    return toEntry(random)
  } catch {
    return null
  }
}

export async function fetchPortailLexical(): Promise<PortailLexicalWord | null> {
  const PORTAIL_LEXICAL_BASE = 'https://www.portail-lexical.fr'

  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  const extractDefinitions = (html: string): string[] => {
    const defs: string[] = []
    const regex = /<div[^>]*class=["']s-structure-item["'][^>]*>([\s\S]*?)<\/div>/gi
    let match
    while ((match = regex.exec(html)) !== null) {
      const block = match[1]
      const defMatch = block.match(/<span[^>]*class=["']s-definition["'][^>]*>([\s\S]*?)<\/span>/i)
      if (defMatch) {
        defs.push(stripHtml(defMatch[1]))
      }
    }
    return defs
  }

  try {
    const wotdRes = await fetch(`${PORTAIL_LEXICAL_BASE}/api/wotd`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!wotdRes.ok) {
      return {
        form: 'lexique',
        pos: 'nom',
        full_form: 'lexique',
        full_pos: 'nom masculin',
        description: "Ensemble des mots d'une langue.",
        ipa: '',
        tlfidefinitions: [],
        wiktionnaireDefinitions: [],
        etymologie: '',
        concordance: [],
      }
    }
    const wotd: { form: string } = await wotdRes.json()
    if (!wotd?.form) return null

    const detailsRes = await fetch(`${PORTAIL_LEXICAL_BASE}/api/word/${encodeURIComponent(wotd.form)}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!detailsRes.ok) return null
    const data = await detailsRes.json()
    if (!data?.header) return null

    const header = data.header

    const tlfidefinitions: string[] = []
    const tlfidata = data.content?.find((c: { id: string; content: unknown }) => c.id === 'tlfi')
    if (tlfidata?.content?.[0]) {
      const tlfidiv = tlfidata.content[0]
      const html = typeof tlfidiv === 'string' ? tlfidiv : String((tlfidiv as Record<string, unknown>)?.innerHTML || '')
      const tlfidefs = extractDefinitions(html)
      if (tlfidefs.length > 0) tlfidefinitions.push(...tlfidefs)
    }

    const wiktionnaireDefinitions: string[] = []
    const wikidata = data.content?.find((c: { id: string; content: unknown }) => c.id === 'wiktionnaire')
    if (wikidata?.content?.[0]) {
      const wiktionaryDiv = wikidata.content[0]
      const html = typeof wiktionaryDiv === 'string' ? wiktionaryDiv : String((wiktionaryDiv as Record<string, unknown>)?.innerHTML || '')
      const wikiDefs = extractDefinitions(html)
      if (wikiDefs.length > 0) wiktionnaireDefinitions.push(...wikiDefs)
    }

    let etymologie = ''
    const etymData = data.content?.find((c: { id: string; content: unknown }) => c.id === 'etymology')
    if (etymData?.content?.[0]) {
      const etymDiv = etymData.content[0]
      const html = typeof etymDiv === 'string' ? etymDiv : String((etymDiv as Record<string, unknown>)?.innerHTML || (etymDiv as Record<string, unknown>)?.textContent || '')
      etymologie = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    const concordance: PortailLexicalWord['concordance'] = []
    const concordanceData = data.content?.find((c: { id: string; content: unknown }) => c.id === 'concordance')
    if (concordanceData?.content) {
      const items = Array.isArray(concordanceData.content) ? concordanceData.content : [concordanceData.content]
      items.forEach((item: { content: { left: string; matching: string; right: string; name: string; title: string; date: string } }) => {
        if (item.content) {
          concordance.push({
            name: item.content.name || '',
            title: item.content.title || '',
            date: item.content.date || '',
            left: item.content.left || '',
            matching: item.content.matching || '',
            right: item.content.right || '',
          })
        }
      })
    }

    return {
      form: header.form,
      pos: header.pos,
      full_form: header.full_form,
      full_pos: header.full_pos,
      description: header.description || '',
      ipa: header.ipa || '',
      tlfidefinitions,
      wiktionnaireDefinitions,
      etymologie,
      concordance,
    }
  } catch {
    return {
      form: 'lexique',
      pos: 'nom',
      full_form: 'lexique',
      full_pos: 'nom masculin',
      description: "Ensemble des mots d'une langue.",
      ipa: '',
      tlfidefinitions: [],
      wiktionnaireDefinitions: [],
      etymologie: '',
      concordance: [],
    }
  }
}

export async function fetchWikipediaImage(): Promise<WikipediaImageData | null> {
  const now = new Date()
  const totalCached = await prisma.cachedWikipediaImage.count({
    where: { expiresAt: { gte: now } },
  })

  if (totalCached > 0) {
    const randomOffset = Math.floor(Math.random() * totalCached)
    const doc = await prisma.cachedWikipediaImage.findFirst({
      where: { expiresAt: { gte: now } },
      skip: randomOffset,
    })

    if (doc) {
      return {
        imageUrl: doc.imageUrl,
        description: doc.description,
        fileUrl: doc.fileUrl,
        date: doc.date,
      }
    }
  }

  try {
    const usedArchives = new Set<string>()
    const maxRetries = 3
    let entries: ReturnType<typeof extractEntries> = []

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let randomArchive: string
      do {
        randomArchive = archives[Math.floor(Math.random() * archives.length)]
      } while (usedArchives.has(randomArchive) && usedArchives.size < archives.length)
      usedArchives.add(randomArchive)

      const data = await fetch(
        `https://fr.wikipedia.org/w/api.php?action=parse&page=Wikip%C3%A9dia:Image_du_jour/${encodeURIComponent(randomArchive)}&prop=text&format=json`,
        {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'moinsbete (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        }
      )

      if (!data.ok) continue
      const json = await data.json()
      if (!json?.parse?.text?.['*']) continue

      entries = extractEntries(json.parse.text['*'])
      if (entries.length > 0) break
    }

    if (entries.length > 0) {
      return entries[Math.floor(Math.random() * entries.length)]
    }
  } catch {
    // ignore
  }

  return null
}
