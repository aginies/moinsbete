import { NextRequest, NextResponse } from 'next/server'
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
import { cleanupExpired, cleanupNewsByMaxAge } from '@/lib/cache-helpers'
import { cleanupOldInsoliteConfigs } from '@/lib/insolite'

const CRON_SECRET = process.env.CRON_SECRET || ''
const ALLOWED_IPS = ['62.210.207.184', '127.0.0.1', '::1']

function ipInPrivateRange(ip: string): boolean {
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('100.64.') || ip.startsWith('100.127.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('172.16.') || ip.startsWith('172.31.')) return true
  if (ip === '::1' || ip.startsWith('fe80:')) return true
  return false
}

function isAuthorized(request: NextRequest): { authorized: boolean; ip: string; reason: string } {
  const token = request.nextUrl.searchParams.get('token')
  const headerToken = request.headers.get('x-cron-token')
  const providedToken = token || headerToken
  
  if (CRON_SECRET && providedToken === CRON_SECRET) {
    return { authorized: true, ip: '', reason: 'token' }
  }
  
  const forwardedIp = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = (forwardedIp?.split(',')[0].trim() || realIp || 'unknown').trim()
  
  if (ALLOWED_IPS.includes(ip)) {
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
  
  const ip = auth.ip || (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown')
  
  const startTime = Date.now()
  console.log(`[cron] Starting cache update from IP: ${ip} (auth: ${auth.reason})`)
  
  const results: Record<string, string> = {}
  
  try {
    console.log('[cron] Step 1/12: Scraping CNRS...')
    await scrapeAndCacheCnrs()
    results.cnrs = 'ok'
    
    console.log('[cron] Step 2/12: Scraping Radio France...')
    await scrapeAndCacheRadioEpisodes()
    results.radio = 'ok'
    
    console.log('[cron] Step 3/12: Scraping News...')
    await scrapeAndCacheNews()
    results.news = 'ok'
    
    console.log('[cron] Step 4/12: Scraping Wikipedia Image (FR)...')
    await scrapeAndCacheWikipediaImages()
    results.wiki = 'ok'

    console.log('[cron] Step 5/12: Scraping Wikipedia Image (EN)...')
    await scrapeAndCacheWikipediaImagesEN()
    results.wikiEn = 'ok'

    console.log('[cron] Step 6/12: Scraping F1 portal...')
    await scrapeAndCacheF1()
    results.f1 = 'ok'

    console.log('[cron] Step 7/12: Scraping Portail Wikipédia...')
    await scrapeAndCachePortailWikipedia()
    results.portailWiki = 'ok'

    console.log('[cron] Step 8/12: Scraping Wikiquote...')
    await scrapeAndCacheCitation()
    results.citation = 'ok'

    console.log('[cron] Step 9/12: Cleanup...')
    const counts = await cleanupExpired()
    const citationSkipped = counts.citation === 0
    const insoliteSkipped = counts.insolite === 0
    let cleanupParts = [`cnrs:${counts.cnrs}`, `radio:${counts.radio}`, `wiki:${counts.wiki}`, `wikiLoves:${counts.wikiLoves}`, `news:${counts.news}`, `f1:${counts.f1}`, `portailWiki:${counts.portailWikipedia}`]
    if (!citationSkipped) {
      cleanupParts.push(`citation:${counts.citation}`)
    }
    if (!insoliteSkipped) {
      cleanupParts.push(`insolite:${counts.insolite}`)
    }
    results.cleanup = cleanupParts.join(',')
    const newsMaxAge = await cleanupNewsByMaxAge(5)
    results.newsMaxAge = newsMaxAge > 0 ? `maxage:${newsMaxAge}` : ''
    const oldConfigCleaned = await cleanupOldInsoliteConfigs(30)
    if (oldConfigCleaned > 0) {
      results.insoliteConfigCleanup = `configs:${oldConfigCleaned}`
    }

    console.log('[cron] Step 10/12: Resolving Saviez-vous images...')
    await scrapeAndCacheSaviezVousImages()
    results.saviezvous = 'ok'

    console.log('[cron] Step 11/12: Scraping Portail Lexical Word of the Day...')
    await scrapeAndCachePortailLexicalWotd()
    results.portailLexical = 'ok'

    console.log('[cron] Step 12/12: Scraping Articles insolites...')
    await scrapeAndCacheInsolite()
    results.insolite = 'ok'
    
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
