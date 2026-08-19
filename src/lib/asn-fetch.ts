import { decodeHtmlEntities } from '@/lib/utils'

const ASN_BASE = 'https://aviation-safety.net'
const ASN_UA = 'moinsbete/1.0 (air crash card; https://moinsbete.guibo.com)'
const ASN_DELAY_MS = 1500
const ASN_TIMEOUT_MS = 20_000
const ASN_MAX_RETRIES = 3

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export interface AsnRecord {
  id: string
  date: string
  type: string
  registration: string
  operator: string
  fatalities: number
  location: string
  damage: string
}

export interface AsnDate {
  day: number
  month: number
  year: number
}

export interface AsnMatchWanted {
  date: AsnDate | null
  reg?: string | null
  type?: string | null
  operator?: string | null
}

let lastRequestAt = 0

export function resetAsnFetchClock(): void {
  lastRequestAt = 0
}

async function politeFetchText(url: string): Promise<string> {
  const wait = lastRequestAt + ASN_DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)

  let lastError: unknown = null
  for (let attempt = 0; attempt < ASN_MAX_RETRIES; attempt++) {
    lastRequestAt = Date.now()
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': ASN_UA },
        signal: AbortSignal.timeout(ASN_TIMEOUT_MS),
      })
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`ASN fetch ${res.status}`)
        await sleep(10_000 * (attempt + 1))
        continue
      }
      if (!res.ok) throw new Error(`ASN fetch failed: ${res.status}`)
      return await res.text()
    } catch (err) {
      lastError = err
      await sleep(10_000 * (attempt + 1))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('ASN fetch failed')
}

const ROW_RE =
  /<tr><td class="list"><nobr><a href="\/wikibase\/(\d+)">([^<]+)<\/a><\/nobr><\/td><td class="list"><NOBR>([^<]*)<\/NOBR><\/td>\s*<td class="list">(.*?)<\/td>\s*<td class="list">(.*?)<\/td>\s*<td class="listdata">([^<]*)<\/td>\s*<td class="list">(.*?)<\/td>\s*<td class="list">([^<]*)<\/td>/gi

export function parseAsnSearchResults(html: string): AsnRecord[] {
  const records: AsnRecord[] = []
  for (const m of html.matchAll(ROW_RE)) {
    const fatMatch = m[6].match(/\d+/)
    records.push({
      id: m[1],
      date: decodeHtmlEntities(m[2]).trim(),
      type: decodeHtmlEntities(m[3]).trim(),
      registration: decodeHtmlEntities(m[4]).trim(),
      operator: decodeHtmlEntities(m[5]).trim(),
      fatalities: fatMatch ? parseInt(fatMatch[0], 10) : 0,
      location: decodeHtmlEntities(m[7]).trim(),
      damage: decodeHtmlEntities(m[8]).trim(),
    })
  }
  return records
}

export function isAsnNoOccurrence(html: string): boolean {
  return /no occurrences in the database/i.test(html)
}

export async function searchAsnRecords(params: { year: number; reg?: string; type?: string; op?: string }): Promise<AsnRecord[]> {
  const query: Record<string, string> = { yr: String(params.year) }
  if (params.reg) query.re = params.reg
  else if (params.type) query.at = params.type
  else if (params.op) query.op = params.op
  const url = `${ASN_BASE}/wikibase/dblist4.php?${new URLSearchParams(query).toString()}`
  const html = await politeFetchText(url)
  return parseAsnSearchResults(html)
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

export function parseAsnDate(s: string): AsnDate | null {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase().slice(0, 3)]
  if (!month) return null
  return { day: parseInt(m[1], 10), month, year: parseInt(m[3], 10) }
}

function normalizeReg(reg: string): string {
  return reg.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function scoreAsnRow(row: AsnRecord, wanted: AsnMatchWanted): number {
  let score = 0
  const rowDate = parseAsnDate(row.date)
  if (wanted.date && rowDate &&
    rowDate.day === wanted.date.day &&
    rowDate.month === wanted.date.month &&
    rowDate.year === wanted.date.year) {
    score += 40
  }
  if (wanted.reg && row.registration && normalizeReg(row.registration) === normalizeReg(wanted.reg)) {
    score += 20
  }
  if (wanted.type && row.type) {
    const a = normalizeText(row.type)
    const b = normalizeText(wanted.type)
    if (a.includes(b) || b.includes(a)) score += 10
  }
  if (wanted.operator && row.operator) {
    const a = normalizeText(row.operator)
    const b = normalizeText(wanted.operator)
    if (a.includes(b) || b.includes(a)) score += 10
  }
  return score
}

export function pickBestAsnRow(rows: AsnRecord[], wanted: AsnMatchWanted): AsnRecord | null {
  if (rows.length === 0 || wanted.date === null) return null
  let best: AsnRecord | null = null
  let bestScore = -1
  for (const row of rows) {
    const s = scoreAsnRow(row, wanted)
    if (s > bestScore) {
      bestScore = s
      best = row
    }
  }
  if (!best) return null
  const rowDate = parseAsnDate(best.date)
  const dateMatched = rowDate !== null &&
    rowDate.day === wanted.date.day &&
    rowDate.month === wanted.date.month &&
    rowDate.year === wanted.date.year
  return dateMatched ? best : null
}

export function asnUrlFor(id: string): string {
  return `${ASN_BASE}/wikibase/${id}`
}
