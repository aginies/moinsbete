import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.topicSuggestion.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject suggestion error:', error)
    return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 })
  }
}
