import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function resolveImageUrls(facts: Array<{ id: string; text: string; sourceUrl: string | null; imageFilename: string | null; createdAt: Date }>) {
  const filenames = facts
    .map((f, i) => ({ filename: f.imageFilename, index: i }))
    .filter(f => f.filename)

  if (filenames.length === 0) return facts

  // Batch resolve using MediaWiki API
  const titles = filenames.map(f => `File:${f.filename}`).join('|')
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
      { headers: { 'User-Agent': 'MoinsBête/1.0' } }
    )
    const data = await res.json()
    const pages = data?.query?.pages || {}

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      const url = page?.imageinfo?.[0]?.url
      if (url) {
        const idx = filenames.find(f => f.filename === page.title)?.index
        if (idx !== undefined) {
          facts[idx].imageFilename = url
        }
      }
    }
  } catch {
    // If API fails, keep original filenames
  }

  return facts
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '1')

    console.log('[saviez-vous] GET request, count:', count)

    const total = await prisma.saviezVousFact.count()
    console.log('[saviez-vous] total facts:', total)
    if (total === 0) {
      return NextResponse.json({ facts: [] })
    }

    const rawFacts = await prisma.saviezVousFact.findMany({
      select: {
        id: true,
        text: true,
        sourceUrl: true,
        imageFilename: true,
        createdAt: true,
      },
    })

    console.log('[saviez-vous] found:', rawFacts.length, 'facts')

    // Pick random facts
    const shuffled = [...rawFacts].sort(() => Math.random() - 0.5)
    const facts = shuffled.slice(0, count)

    // Resolve image filenames to URLs
    const resolvedFacts = await resolveImageUrls(facts)

    console.log('[saviez-vous] returning:', resolvedFacts.length, 'facts')

    return NextResponse.json({ facts: resolvedFacts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
