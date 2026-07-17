import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`radio-france:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const excludeId = searchParams.get('exclude')?.trim() || undefined

  if (excludeId && !/^[a-z0-9-]+$/i.test(excludeId)) {
    return NextResponse.json({ error: true }, { status: 400 })
  }

  // Try cache first
  const queryWhere: any = { expiresAt: { gte: new Date() } }
  if (excludeId) {
    queryWhere.title = { not: excludeId }
  }
  
  const cached = await prisma.cachedRadioEpisode.findMany({
    where: queryWhere,
    orderBy: { scrapedAt: 'desc' },
    take: 50,
  })

  if (cached.length > 0) {
    const filtered = excludeId ? cached.filter(e => e.id !== excludeId) : cached
    if (filtered.length > 0) {
      const doc = filtered[Math.floor(Math.random() * filtered.length)]
      return NextResponse.json({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        url: doc.link,
        radio: doc.radio,
        section: doc.radio,
        image: doc.imageUrl,
      })
    }
  }

  // Cache empty — serve from static data as fallback
  const { radioFranceDocs } = await import('@/data/radio-france')
  const filtered = excludeId ? radioFranceDocs.filter(d => d.id !== excludeId) : radioFranceDocs
  
  if (filtered.length > 0) {
    const doc = filtered[Math.floor(Math.random() * filtered.length)]
    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      url: doc.url,
      radio: doc.radio,
      section: doc.section,
      image: doc.image,
    })
  }

  // Last resort fallback
  return NextResponse.json({
    id: 'fallback',
    title: 'Documentaire France Culture',
    description: 'Écoutez les documentaires de France Culture',
    url: 'https://www.radiofrance.fr/franceculture/podcasts',
    radio: 'France Culture',
    section: 'Documentaires',
    image: '',
  })
}
