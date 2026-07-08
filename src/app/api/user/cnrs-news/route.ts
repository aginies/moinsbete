import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { cnrsNewsEnabled } = body

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { cnrsNewsEnabled: !!cnrsNewsEnabled },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to update cnrsNewsEnabled:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
