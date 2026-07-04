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

    const resolvedFacts = await resolveWikimediaImageUrls(facts.map(f => ({ id: f.id, imageFilename: f.imageFilename })))
    for (const resolved of resolvedFacts) {
      const original = facts.find(f => f.id === resolved.id)
      if (original && original.imageFilename !== resolved.imageFilename) {
        original.imageFilename = resolved.imageFilename
        await prisma.saviezVousFact.update({
          where: { id: resolved.id },
          data: { imageFilename: resolved.imageFilename },
        })
      }
    }

    return NextResponse.json({ facts: resolvedFacts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
