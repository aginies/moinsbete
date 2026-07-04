import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveWikimediaImageUrls } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 10)

    const total = await prisma.saviezVousFact.count()
    if (total === 0) {
      return NextResponse.json({ facts: [] })
    }

    const randomOffset = Math.floor(Math.random() * Math.max(total - count + 1, 1))
    const facts = await prisma.saviezVousFact.findMany({
      skip: randomOffset,
      take: count,
      select: {
        id: true,
        text: true,
        sourceUrl: true,
        imageFilename: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!facts.length) {
      return NextResponse.json({ facts: [] })
    }

    // Resolve image URLs directly on facts to avoid object duplication
    const pending = facts
      .filter(f => f.imageFilename && !f.imageFilename.startsWith('http'))
      .map(f => ({ id: f.id, imageFilename: f.imageFilename }))

    if (pending.length > 0) {
      const titles = pending.map(f => `File:${f.imageFilename}`).join('|')
      try {
        const res = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
          { headers: { 'User-Agent': 'MoinsBete/1.0' } }
        )
        const data = await res.json()
        const pages = data?.query?.pages || {}

        for (const pageId of Object.keys(pages)) {
          const page = pages[pageId]
          const url = page?.imageinfo?.[0]?.url
          if (url) {
            const pendingFact = pending.find(f => f.imageFilename === page.title.replace(/^File:/, ''))
            if (pendingFact) {
              const original = facts.find(f => f.id === pendingFact.id)
              if (original && original.imageFilename !== url) {
                original.imageFilename = url
                await prisma.saviezVousFact.update({
                  where: { id: original.id },
                  data: { imageFilename: url },
                })
              }
            }
          }
        }
      } catch {
        // If API fails, keep original filenames
      }
    }

    return NextResponse.json({ facts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
