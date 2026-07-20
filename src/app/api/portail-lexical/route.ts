import { NextResponse } from 'next/server'

const PORTAIL_LEXICAL_BASE = 'https://www.portail-lexical.fr'

const isValidSearchTerm = (term: string): boolean => {
  if (!term || term.length > 100) return false
  const safeRegex = /^[a-zA-ZàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]+$/
  return safeRegex.test(term)
}

interface PortailLexicalWord {
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

interface WotdResponse {
  form: string
  pos: string
  full_form: string
  full_pos: string
}

interface WordHeader {
  form: string
  pos: string
  full_form: string
  full_pos: string
  description: string
  ipa: string
}

interface WordContent {
  id: string
  content: unknown
}

interface SearchSuggestion {
  form: string
  pos: string
  label: string
}

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

async function fetchWotd(): Promise<WotdResponse | null> {
  try {
    const res = await fetch(`${PORTAIL_LEXICAL_BASE}/api/wotd`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchWordDetails(word: string): Promise<PortailLexicalWord | null> {
  try {
    const res = await fetch(`${PORTAIL_LEXICAL_BASE}/api/word/${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.header) return null

    const header: WordHeader = data.header

    const tlfidefinitions: string[] = []
    const tlfidata = data.content?.find((c: WordContent) => c.id === 'tlfi')
    if (tlfidata?.content?.[0]) {
      const tlfidiv = tlfidata.content[0]
      const html = typeof tlfidiv === 'string' ? tlfidiv : String((tlfidiv as Record<string, unknown>)?.innerHTML || '')
      const tlfidefs = extractDefinitions(html)
      if (tlfidefs.length > 0) {
        tlfidefinitions.push(...tlfidefs)
      }
    }

    const wiktionnaireDefinitions: string[] = []
    const wikidata = data.content?.find((c: WordContent) => c.id === 'wiktionnaire')
    if (wikidata?.content?.[0]) {
      const wiktionaryDiv = wikidata.content[0]
      const html = typeof wiktionaryDiv === 'string' ? wiktionaryDiv : String((wiktionaryDiv as Record<string, unknown>)?.innerHTML || '')
      const wikiDefs = extractDefinitions(html)
      if (wikiDefs.length > 0) {
        wiktionnaireDefinitions.push(...wikiDefs)
      }
    }

    let etymologie = ''
    const etymData = data.content?.find((c: WordContent) => c.id === 'etymology')
    if (etymData?.content?.[0]) {
      const etymDiv = etymData.content[0]
      const html = typeof etymDiv === 'string' ? etymDiv : String((etymDiv as Record<string, unknown>)?.innerHTML || (etymDiv as Record<string, unknown>)?.textContent || '')
      etymologie = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    const concordance: PortailLexicalWord['concordance'] = []
    const concordanceData = data.content?.find((c: WordContent) => c.id === 'concordance')
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
    return null
  }
}

async function searchWords(term: string): Promise<SearchSuggestion[]> {
  if (!term || term.length < 2 || !isValidSearchTerm(term)) return []
  try {
    const res = await fetch(`${PORTAIL_LEXICAL_BASE}/api/search/${encodeURIComponent(term)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((s: { form: string; pos: string; label: string }) => ({
      form: s.form,
      pos: s.pos,
      label: s.label || `${s.form}, ${s.pos}`,
    }))
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'search') {
    const term = searchParams.get('q') || ''
    if (!isValidSearchTerm(term)) {
      return NextResponse.json({ suggestions: [] })
    }
    const suggestions = await searchWords(term)
    return NextResponse.json({ suggestions })
  }

  if (action === 'word') {
    const word = searchParams.get('word') || ''
    if (!word || !isValidSearchTerm(word)) {
      return NextResponse.json({ error: 'Invalid or missing word parameter' }, { status: 400 })
    }
    const details = await fetchWordDetails(word)
    if (!details) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }
    return NextResponse.json(details)
  }

  // Default: return word of the day
  try {
    const wotd = await fetchWotd()
    if (!wotd) {
      return NextResponse.json({
        form: 'lexique',
        pos: 'nom',
        full_form: 'lexique',
        full_pos: 'nom masculin',
        description: 'Ensemble des mots d\'une langue.',
        ipa: '',
        tlfidefinitions: [],
        wiktionnaireDefinitions: [],
        etymologie: '',
        concordance: [],
      })
    }

    const details = await fetchWordDetails(wotd.form)
    if (!details) {
      return NextResponse.json({
        ...wotd,
        description: '',
        ipa: '',
        tlfidefinitions: [],
        wiktionnaireDefinitions: [],
        etymologie: '',
        concordance: [],
      })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error('Portail lexical error:', error)
    return NextResponse.json({
      form: 'lexique',
      pos: 'nom',
      full_form: 'lexique',
      full_pos: 'nom masculin',
      description: 'Ensemble des mots d\'une langue.',
      ipa: '',
      tlfidefinitions: [],
      wiktionnaireDefinitions: [],
      etymologie: '',
      concordance: [],
    })
  }
}
