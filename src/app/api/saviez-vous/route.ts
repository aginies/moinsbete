import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    console.log('[saviez-vous] returning:', facts.length, 'facts')

    return NextResponse.json({ facts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
