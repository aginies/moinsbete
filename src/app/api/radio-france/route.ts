import { NextResponse } from 'next/server'
import { fetchRandomEpisode } from '@/lib/radio-france-episodes'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const excludeId = searchParams.get('exclude') || undefined

  const doc = await fetchRandomEpisode(excludeId)

  if (!doc) {
    return NextResponse.json({ error: true }, { status: 502 })
  }

  return NextResponse.json(doc)
}

export const revalidate = 86400
