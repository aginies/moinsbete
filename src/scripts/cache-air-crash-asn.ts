import { prisma } from '@/lib/db'
import { WIKIMEDIA_UA } from '@/lib/constants'
import { sleep } from '@/lib/cache-helpers'
import { searchAsnRecords, pickBestAsnRow, asnUrlFor } from '@/lib/asn-fetch'
import type { AsnRecord } from '@/lib/asn-fetch'
import { parseAirCrashInfobox, modelToken } from '@/lib/wiki-infobox'
import { runCacheScript } from './cache-script-helper'

const WIKI_BATCH_SIZE = 50
const WIKI_BATCH_DELAY_MS = 500

async function fetchWikitextBatch(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  for (let i = 0; i < titles.length; i += WIKI_BATCH_SIZE) {
    const batch = titles.slice(i, i + WIKI_BATCH_SIZE)
    const t = batch.map(x => encodeURIComponent(x)).join('|')
    const url = `https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${t}&prop=revisions&rvprop=content`
    console.log(`[cache-air-crash-asn] Fetching wikitext batch ${Math.floor(i / WIKI_BATCH_SIZE) + 1}: ${batch.length} articles`)
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': WIKIMEDIA_UA },
        signal: AbortSignal.timeout(30_000),
      })
      console.log(`[cache-air-crash-asn] Wikipedia API response: ${res.status}`)
      if (!res.ok) {
        console.log(`[cache-air-crash-asn] Wikipedia API error: ${res.status}`)
        continue
      }
      const data = (await res.json()) as {
        query?: { pages?: Record<string, { title?: string; revisions?: Array<{ '*': string }> }> }
      }
      const pages = data?.query?.pages
      if (pages) {
        let batchCount = 0
        for (const p of Object.values(pages)) {
          const content = p?.revisions?.[0]?.['*']
          if (p?.title && typeof content === 'string') {
            result.set(p.title, content)
            batchCount++
          }
        }
        console.log(`[cache-air-crash-asn] Batch ${Math.floor(i / WIKI_BATCH_SIZE) + 1}: got ${batchCount}/${batch.length} wikitexts`)
      } else {
        console.log(`[cache-air-crash-asn] Batch ${Math.floor(i / WIKI_BATCH_SIZE) + 1}: no pages in response`)
      }
    } catch (err) {
      console.log(`[cache-air-crash-asn] Batch ${Math.floor(i / WIKI_BATCH_SIZE) + 1} failed: ${err instanceof Error ? err.message : err}`)
    }
    if (i + WIKI_BATCH_SIZE < titles.length) await sleep(WIKI_BATCH_DELAY_MS)
  }
  return result
}

export interface AsnMatchResult {
  matched: number
  unmatched: number
  failed: number
}

export async function scrapeAndCacheAirCrashAsn(options: { limit?: number } = {}): Promise<AsnMatchResult> {
  console.log(`[cache-air-crash-asn] Starting ASN matching (limit: ${options.limit || 'none'})`)
  
  const missing = await prisma.cachedAirCrashArticle.findMany({
    where: { asnId: null },
    orderBy: { title: 'asc' },
    take: options.limit,
    select: { id: true, title: true },
  })
  
  console.log(`[cache-air-crash-asn] Found ${missing.length} articles without ASN links`)
  
  if (missing.length === 0) {
    console.log('[cache-air-crash-asn] All articles already have ASN links, nothing to do')
    return { matched: 0, unmatched: 0, failed: 0 }
  }
  
  console.log(`[cache-air-crash-asn] Matching ${missing.length} articles...`)
  console.log(`[cache-air-crash-asn] Fetching wikitext for ${missing.length} articles...`)

  const wikitexts = await fetchWikitextBatch(missing.map(a => a.title))
  console.log(`[cache-air-crash-asn] Fetched wikitext for ${wikitexts.size}/${missing.length} articles`)

  let matched = 0
  let unmatched = 0
  let failed = 0

  for (let i = 0; i < missing.length; i++) {
    const article = missing[i]
    console.log(`[cache-air-crash-asn] Processing ${i + 1}/${missing.length}: ${article.title}`)
    
    const wt = wikitexts.get(article.title)
    if (!wt) {
      failed++
      console.log(`  [cache-air-crash-asn]   FAIL: wikitext unavailable`)
      continue
    }

    const info = parseAirCrashInfobox(wt, article.title)
    console.log(`  [cache-air-crash-asn]   Infobox: dates=${info.dates.length}, type=${info.type || '?'}, reg=${info.reg || '?'}, operator=${info.operator || '?'}`)
    
    if (info.dates.length === 0) {
      unmatched++
      console.log(`  [cache-air-crash-asn]   UNMATCHED: no date in infobox`)
      continue
    }

    const wantedBase = {
      reg: info.reg,
      type: info.type,
      operator: info.operator,
    }

    const pick = (rows: AsnRecord[]): AsnRecord | null => {
      for (const d of info.dates) {
        console.log(`  [cache-air-crash-asn]   Searching ASN for date ${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`)
        const picked = pickBestAsnRow(rows, { ...wantedBase, date: d })
        if (picked) return picked
      }
      return null
    }

    const year = info.dates[0].year
    let best: AsnRecord | null = null
    
    if (info.reg) {
      console.log(`  [cache-air-crash-asn]   Searching by registration: ${info.reg}`)
      const rows = await searchAsnRecords({ year, reg: info.reg })
      console.log(`  [cache-air-crash-asn]   Found ${rows.length} ASN records for registration`)
      best = pick(rows)
    }
    
    if (!best && info.type) {
      console.log(`  [cache-air-crash-asn]   Searching by aircraft type: ${info.type}`)
      const rows = await searchAsnRecords({ year, type: modelToken(info.type) })
      console.log(`  [cache-air-crash-asn]   Found ${rows.length} ASN records for type`)
      best = pick(rows)
    }
    
    if (!best && info.operator) {
      console.log(`  [cache-air-crash-asn]   Searching by operator: ${info.operator}`)
      let rows = await searchAsnRecords({ year, op: info.operator })
      console.log(`  [cache-air-crash-asn]   Found ${rows.length} ASN records for operator`)
      
      if (rows.length === 0) {
        const firstWord = info.operator.split(/\s+/)[0]
        if (firstWord.length >= 4 && firstWord.toLowerCase() !== info.operator.toLowerCase()) {
          console.log(`  [cache-air-crash-asn]   Trying first word: ${firstWord}`)
          rows = await searchAsnRecords({ year, op: firstWord })
          console.log(`  [cache-air-crash-asn]   Found ${rows.length} ASN records for first word`)
        }
      }
      best = pick(rows)
    }

    if (best) {
      await prisma.cachedAirCrashArticle.update({
        where: { id: article.id },
        data: { asnId: best.id, asnUrl: asnUrlFor(best.id) },
      })
      matched++
      console.log(`  [cache-air-crash-asn]   MATCHED: /wikibase/${best.id} (${best.date}, ${best.type})`)
    } else {
      unmatched++
      const d = info.dates[0]
      console.log(`  [cache-air-crash-asn]   UNMATCHED: no ASN record found (dates ${info.dates.map(x => `${x.day}/${x.month}/${x.year}`).join(', ')}, type ${info.type ?? '?'}, reg ${info.reg ?? '?'})`)
    }
  }

  console.log(`[cache-air-crash-asn] Done: ${matched} matched, ${unmatched} unmatched, ${failed} failed`)
  return { matched, unmatched, failed }
}

if (process.argv[1]?.includes('cache-air-crash-asn')) {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : NaN
  runCacheScript(() => scrapeAndCacheAirCrashAsn(Number.isFinite(limit) ? { limit } : {}))
}
