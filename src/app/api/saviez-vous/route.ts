import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveWikimediaImageUrls } from '@/lib/utils'

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

    // Pick random facts using Fisher-Yates shuffle
    const shuffled = [...rawFacts]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const facts = shuffled.slice(0, count)

    // Resolve image filenames to URLs and persist
    const resolvedFacts = await resolveWikimediaImageUrls(facts.map(f => ({ id: f.id, imageFilename: f.imageFilename })))
    for (const resolved of resolvedFacts) {
      const original = facts.find(f => f.id === resolved.id)
      if (original && original.imageFilename !== resolved.imageFilename) {
        await prisma.saviezVousFact.update({
          where: { id: resolved.id },
          data: { imageFilename: resolved.imageFilename },
        })
      }
    }

    console.log('[saviez-vous] returning:', resolvedFacts.length, 'facts')

    return NextResponse.json({ facts: resolvedFacts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
