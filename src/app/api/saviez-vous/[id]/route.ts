import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const fact = await prisma.saviezVousFact.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        sourceUrl: true,
        imageFilename: true,
      },
    })

    if (!fact) {
      return NextResponse.json({ error: 'Fact not found' }, { status: 404 })
    }

    return NextResponse.json({ fact })
  } catch (error) {
    console.error('Saviez-vous GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
