import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const { favorites } = await request.json()

  if (!Array.isArray(favorites)) {
    return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
  }

  // Delete existing RF favorites for this user
  await prisma.bookmark.deleteMany({
    where: { userId: session.user.id, type: 'RADIO_FRANCE' },
  })

  // Insert new favorites
  const metaEntries = favorites.map((fav) => ({
    userId: session.user.id,
    resourceId: fav.id,
    type: 'RADIO_FRANCE' as const,
    meta: {
      title: fav.title,
      description: fav.description,
      url: fav.url,
      radio: fav.radio,
      section: fav.section,
      image: fav.image,
      favoritedAt: fav.favoritedAt,
    },
  }))

  await prisma.bookmark.createMany({
    data: metaEntries,
    skipDuplicates: true,
  })

  return NextResponse.json({ success: true, count: favorites.length })
}
