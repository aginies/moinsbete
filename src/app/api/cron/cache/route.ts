import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { scrapeAndCacheCnrs } from '@/scripts/cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from '@/scripts/cache-radio-france'
import { scrapeAndCacheWikipediaImages, scrapeAndCacheWikipediaImagesEN } from '@/scripts/cache-wikipedia-image'
import { scrapeAndCacheNews } from '@/scripts/cache-news'
import { scrapeAndCacheSaviezVousImages } from '@/scripts/cache-saviez-vous-images'
import { scrapeAndCacheF1 } from '@/scripts/cache-f1'
import { scrapeAndCachePortailWikipedia } from '@/scripts/cache-portail-wikipedia'
import { scrapeAndCacheCitation } from '@/scripts/cache-citation'
import { scrapeAndCachePortailLexicalWotd } from '@/scripts/cache-portail-lexical'
import { scrapeAndCacheInsolite } from '@/scripts/cache-insolite'
import { scrapeAndCacheApod } from '@/scripts/cache-apod'
import { cleanupExpired, cleanupNewsByMaxAge } from '@/lib/cache-helpers'
import { cleanupOldInsoliteConfigs } from '@/lib/insolite'
import { isAllowedIp, getClientIp } from '@/lib/ip'

const CRON_SECRET = process.env.CRON_SECRET || ''

function ipInPrivateRange(ip: string): boolean {
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('100.64.') || ip.startsWith('100.127.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('172.16.') || ip.startsWith('172.31.')) return true
  if (ip === '::1' || ip.startsWith('fe80:')) return true
  return false
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function isAuthorized(request: NextRequest): { authorized: boolean; ip: string; reason: string } {
  const token = request.nextUrl.searchParams.get('token')
  const headerToken = request.headers.get('x-cron-token')
  const providedToken = token || headerToken

  // Trusted IP resolution (platform IP / cf-connecting-ip first; x-forwarded-for
  // only honored when TRUST_PROXY=true). Never read x-forwarded-for blindly.
  const ip = getClientIp(request)

  // Token auth (constant-time compare). When a secret is configured it is REQUIRED —
  // no IP fallback, so header spoofing cannot bypass auth in production.
  if (CRON_SECRET) {
    if (providedToken && safeEqual(providedToken, CRON_SECRET)) {
      return { authorized: true, ip, reason: 'token' }
    }
    return { authorized: false, ip, reason: 'token-required' }
  }

  // No secret configured (dev / local cron): fall back to trusted IP resolution.
  if (isAllowedIp(ip)) {
    return { authorized: true, ip, reason: 'ip-whitelist' }
  }

  if (ipInPrivateRange(ip)) {
    return { authorized: true, ip, reason: 'private-range' }
  }

  return { authorized: false, ip, reason: 'unauthorized' }
}

export async function GET(request: NextRequest) {
  const auth = isAuthorized(request)
  
  if (!auth.authorized) {
    return NextResponse.json({ error: 'unauthorized', ip: auth.ip }, { status: 401 })
  }
  
  const ip = auth.ip
  
  const startTime = Date.now()
  console.log(`[cron] Starting cache update from IP: ${ip} (auth: ${auth.reason})`)
  
  const results: Record<string, string> = {}
  
  try {
    console.log('[cron] Step 1/13: Scraping CNRS...')
    await scrapeAndCacheCnrs()
    results.cnrs = 'ok'
    
    console.log('[cron] Step 2/13: Scraping Radio France...')
    await scrapeAndCacheRadioEpisodes()
    results.radio = 'ok'
    
    console.log('[cron] Step 3/13: Scraping News...')
    await scrapeAndCacheNews()
    results.news = 'ok'
    
    console.log('[cron] Step 4/13: Scraping Wikipedia Image (FR)...')
    await scrapeAndCacheWikipediaImages()
    results.wiki = 'ok'

    console.log('[cron] Step 5/13: Scraping Wikipedia Image (EN)...')
    await scrapeAndCacheWikipediaImagesEN()
    results.wikiEn = 'ok'

    console.log('[cron] Step 6/13: Scraping F1 portal...')
    await scrapeAndCacheF1()
    results.f1 = 'ok'

    console.log('[cron] Step 7/13: Scraping Portail Wikipédia...')
    await scrapeAndCachePortailWikipedia()
    results.portailWiki = 'ok'

    console.log('[cron] Step 8/13: Scraping Wikiquote...')
    await scrapeAndCacheCitation()
    results.citation = 'ok'

    console.log('[cron] Step 9/13: Scraping Articles insolites...')
    await scrapeAndCacheInsolite()
    results.insolite = 'ok'

    console.log('[cron] Step 10/13: Cleanup...')
    const counts = await cleanupExpired()
    const citationSkipped = counts.citation === 0
    const insoliteSkipped = counts.insolite === 0
    const apodSkipped = counts.apod === 0
    let cleanupParts = [`cnrs:${counts.cnrs}`, `radio:${counts.radio}`, `wiki:${counts.wiki}`, `wikiLoves:${counts.wikiLoves}`, `news:${counts.news}`, `f1:${counts.f1}`, `portailWiki:${counts.portailWikipedia}`]
    if (!citationSkipped) {
      cleanupParts.push(`citation:${counts.citation}`)
    }
    if (!insoliteSkipped) {
      cleanupParts.push(`insolite:${counts.insolite}`)
    }
    if (!apodSkipped) {
      cleanupParts.push(`apod:${counts.apod}`)
    }
    results.cleanup = cleanupParts.join(',')
    const newsMaxAge = await cleanupNewsByMaxAge(5)
    results.newsMaxAge = newsMaxAge > 0 ? `maxage:${newsMaxAge}` : ''
    const oldConfigCleaned = await cleanupOldInsoliteConfigs(30)
    if (oldConfigCleaned > 0) {
      results.insoliteConfigCleanup = `configs:${oldConfigCleaned}`
    }

    console.log('[cron] Step 11/13: Resolving Saviez-vous images...')
    await scrapeAndCacheSaviezVousImages()
    results.saviezvous = 'ok'

    console.log('[cron] Step 12/13: Scraping Portail Lexical Word of the Day...')
    await scrapeAndCachePortailLexicalWotd()
    results.portailLexical = 'ok'

    console.log('[cron] Step 13/13: Scraping APOD (NASA)...')
    await scrapeAndCacheApod()
    results.apod = 'ok'
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(0)
    console.log(`[cron] Cache update completed in ${duration}s`)
    
    return NextResponse.json({ 
      ok: true, 
      results,
      duration: `${duration}s`,
      ip,
    })
  } catch (error) {
    console.error('[cron] Cache update error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: String(error),
      results,
      duration: `${((Date.now() - startTime) / 1000).toFixed(0)}s`,
    }, { status: 500 })
  }
}
