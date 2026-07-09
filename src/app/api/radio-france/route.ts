import { NextRequest, NextResponse } from 'next/server'
import { fetchRandomEpisode } from '@/lib/radio-france-episodes'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!checkRateLimit(`radio-france:${clientId}`, 30, 60_000)) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const excludeId = searchParams.get('exclude')?.trim() || undefined

  if (excludeId && !/^[a-z0-9-]+$/i.test(excludeId)) {
    return NextResponse.json({ error: true }, { status: 400 })
  }

  const doc = await fetchRandomEpisode(excludeId)

  if (!doc) {
    return NextResponse.json({ error: true }, { status: 502 })
  }

  return NextResponse.json(doc)
}

export const revalidate = 86400
