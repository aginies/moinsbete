import { NextResponse } from 'next/server'
import { scrapeAndCacheCnrs } from '@/scripts/cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from '@/scripts/cache-radio-france'
import { scrapeAndCacheWikipediaImages } from '@/scripts/cache-wikipedia-image'
import { cleanupExpired } from '@/lib/cache-helpers'

export async function GET(request: Request) {
  const forwardedIp = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedIp?.split(',')[0].trim() || realIp || 'unknown'
  
  const allowedIps = ['62.210.207.184', '127.0.0.1', '::1', '10.0.0.0/8', '100.0.0.0/8', '192.168.0.0/16']
  
  function ipMatchesNetwork(ip: string, network: string, prefixLen: number): boolean {
    const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    const networkInt = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0
    return (ipInt & mask) === (networkInt & mask)
  }
  
  function isAllowedIp(checkIp: string): boolean {
    if (allowedIps.includes(checkIp)) return true
    for (const cidr of allowedIps) {
      if (cidr.includes('/')) {
        const [network, prefixLen] = cidr.split('/')
        if (ipMatchesNetwork(checkIp, network, parseInt(prefixLen, 10))) return true
      }
    }
    return false
  }
  
  if (!isAllowedIp(ip)) {
    return NextResponse.json({ error: 'unauthorized', ip }, { status: 401 })
  }
  
  const startTime = Date.now()
  console.log(`[cron] Starting cache update from IP: ${ip}`)
  
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
