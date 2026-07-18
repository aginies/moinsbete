import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ ideaIds: [] })

  const { searchParams } = new URL(req.url)
  const ideaIds = searchParams.get('ideaIds')?.split(',') || []

  if (ideaIds.length === 0) {
    return NextResponse.json({ ideaIds: [] })
  }

  const sharedBookmarks = await prisma.sharedLobbyBookmark.findMany({
    where: {
      userId: session.user.id,
      ideaId: { in: ideaIds },
    },
    select: { ideaId: true },
  })

  const sharedIds = new Set(sharedBookmarks.map(b => b.ideaId))
  return NextResponse.json({ ideaIds: Array.from(sharedIds) })
}
