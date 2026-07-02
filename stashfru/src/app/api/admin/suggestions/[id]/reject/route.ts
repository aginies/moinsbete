import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

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
