export interface AirCrashDate {
  day: number
  month: number
  year: number
}

export interface AirCrashInfobox {
  dates: AirCrashDate[]
  type: string | null
  reg: string | null
  operator: string | null
}

const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, 'février': 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, 'août': 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, 'décembre': 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

export function stripWikiLinks(s: string): string {
  return s
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\{\{Langue\|[^|]*\|([^}]*)\}\}/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseFrenchDates(value: string): AirCrashDate[] {
  const v = stripWikiLinks(value).trim()
  const out: AirCrashDate[] = []
  const push = (day: string, monthRaw: string, year: string) => {
    const month = /^\d{1,2}$/.test(monthRaw) ? parseInt(monthRaw, 10) : MONTHS[monthRaw.toLowerCase()]
    if (month && month >= 1 && month <= 12) out.push({ day: parseInt(day, 10), month, year: parseInt(year, 10) })
  }
  for (const m of v.matchAll(/\{\{[Dd]ate-?\|(\d{4})-(\d{2})-(\d{2})/g)) push(m[3], m[2], m[1])
  for (const m of v.matchAll(/\{\{[Dd]ate-?\|(\d{1,2})\|(\d{1,2}|[A-Za-zÀ-ÿ]+)[A-Za-z\-]*\|(\d{4})/g)) push(m[1], m[2], m[3])
  for (const m of v.matchAll(/\{\{[Dd]ate-?\|(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/g)) push(m[1], m[2], m[3])
  for (const m of v.matchAll(/(?:^|\s)(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})(?:\s|$)/g)) push(m[1], m[2], m[3])
  const seen = new Set<string>()
  return out.filter(d => {
    const k = `${d.day}-${d.month}-${d.year}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function parseFrenchDate(value: string): AirCrashDate | null {
  return parseFrenchDates(value)[0] ?? null
}

function findInfobox(wikitext: string): string | null {
  const start = wikitext.indexOf('{{Infobox')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < wikitext.length - 1; i++) {
    if (wikitext.startsWith('{{', i)) depth++
    else if (wikitext.startsWith('}}', i)) {
      depth--
      if (depth === 0) return wikitext.slice(start + 2, i)
    }
  }
  return null
}

function splitInfoboxCells(content: string): string[] {
  const cells: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < content.length; i++) {
    if (content.startsWith('{{', i)) { depth += 1; current += '{{'; i += 1; continue }
    if (content.startsWith('}}', i)) { depth -= 1; current += '}}'; i += 1; continue }
    if (content.startsWith('[[' , i)) { depth += 1; current += '[['; i += 1; continue }
    if (content.startsWith(']]', i)) { depth -= 1; current += ']]'; i += 1; continue }
    if (content[i] === '|' && depth === 0) { cells.push(current); current = ''; continue }
    current += content[i]
  }
  if (current.trim()) cells.push(current)
  return cells
}

function infoboxField(infobox: string, name: string): string | null {
  const target = name.toLowerCase().replace(/\s+/g, '_')
  for (const cell of splitInfoboxCells(infobox)) {
    const m = cell.match(/^\s*([A-Za-z_À-ÿ ]+?)\s*=\s*([\s\S]*)$/)
    if (m && m[1].toLowerCase().replace(/\s+/g, '_') === target) {
      const value = m[2].trim()
      return value || null
    }
  }
  return null
}

const KNOWN_TYPE_RE =
  /\b(Boeing|Airbus|McDonnell Douglas|Douglas|Tupolev|De Havilland Canada|De Havilland|Beechcraft|Convair|Bombardier|Canadair|Embraer|Fokker|Lockheed|Northrop|Hawker Siddeley|British Aerospace|BAe|Ilyushin|Antonov|Sikorsky|Eurocopter|Aérospatiale|Bell|Piper|Cessna|Fairey|Vickers|Handley Page|Short|Fiat|Sukhoi|Soukhoï|Yakovlev|Yak)\s+([A-Za-z0-9.\-]+(?:\s?[A-Za-z0-9.\-]+)?)/

export function fallbackAircraftType(wikitext: string): string | null {
  const head = wikitext.slice(0, 3000)
  const m = head.match(KNOWN_TYPE_RE)
  if (!m) return null
  return `${m[1]} ${m[2]}`.trim()
}

export function parseAirCrashInfobox(wikitext: string, title?: string): AirCrashInfobox {
  const infobox = findInfobox(wikitext)
  if (!infobox) return { dates: [], type: null, reg: null, operator: null }

  const dateRaw = infoboxField(infobox, 'date')
  const dates = dateRaw ? parseFrenchDates(dateRaw) : []

  const typeRaw = infoboxField(infobox, 'appareil') ?? infoboxField(infobox, 'cible')
  const type = typeRaw ? stripWikiLinks(typeRaw) || null : fallbackAircraftType(wikitext)

  const regRaw = infoboxField(infobox, 'numéro_identification') ?? infoboxField(infobox, 'immatriculation')
  const reg = regRaw ? stripWikiLinks(regRaw) || null : null

  const operatorRaw = infoboxField(infobox, 'compagnie') ?? infoboxField(infobox, 'opérateur')
  let operator = operatorRaw ? stripWikiLinks(operatorRaw) || null : null
  if (!operator && title) {
    const tm = title.match(/^Vol\s+(.+?)\s+\d{1,4}$/)
    if (tm) operator = stripWikiLinks(tm[1])
  }

  return { dates, type, reg, operator }
}

export function modelToken(type: string): string {
  const tokens = type.trim().split(/\s+/)
  const withDigit = tokens.filter(t => /\d/.test(t) && !/^\d+$/.test(t))
  if (withDigit.length > 0) return withDigit[0]
  if (tokens.length >= 2 && !/^\d+$/.test(tokens[tokens.length - 1])) return tokens[tokens.length - 1]
  return tokens.slice(-2).join(' ')
}
