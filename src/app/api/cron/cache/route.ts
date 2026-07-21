import { NextRequest, NextResponse } from 'next/server'
import { scrapeAndCacheCnrs } from '@/scripts/cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from '@/scripts/cache-radio-france'
import { scrapeAndCacheWikipediaImages } from '@/scripts/cache-wikipedia-image'
import { cleanupExpired } from '@/lib/cache-helpers'

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
    console.log('[cron] Step 1/4: Scraping CNRS...')
    await scrapeAndCacheCnrs()
    results.cnrs = 'ok'
    
    console.log('[cron] Step 2/4: Scraping Radio France...')
    await scrapeAndCacheRadioEpisodes()
    results.radio = 'ok'
    
    console.log('[cron] Step 3/4: Scraping Wikipedia Image...')
    await scrapeAndCacheWikipediaImages()
    results.wiki = 'ok'
    
    console.log('[cron] Step 4/4: Cleanup...')
    const counts = await cleanupExpired()
    results.cleanup = `cnrs:${counts.cnrs},radio:${counts.radio},wiki:${counts.wiki}`
    
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
