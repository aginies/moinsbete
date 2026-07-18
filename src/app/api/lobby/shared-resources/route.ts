import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ resourceIds: [] })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (!type) return NextResponse.json({ resourceIds: [] })

  const sharedBookmarks = await prisma.sharedLobbyBookmark.findMany({
    where: {
      userId: session.user.id,
      resourceType: type,
    },
    select: { resourceId: true },
  })

  const resourceIds = sharedBookmarks
    .map(b => b.resourceId)
    .filter((id): id is string => id !== null)

  return NextResponse.json({ resourceIds })
}
