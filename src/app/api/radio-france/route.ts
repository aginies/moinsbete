import { NextRequest, NextResponse } from 'next/server'
import { fetchRandomEpisode } from '@/lib/radio-france-episodes'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const clientId = ip.split(',')[0].trim()
  if (!checkRateLimit(`radio-france:${clientId}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans 60 secondes.' }, { status: 429 })
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
