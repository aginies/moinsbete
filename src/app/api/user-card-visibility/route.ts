import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const field = request.nextUrl.searchParams.get('field')
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      wikipediaImageCardVisible: true,
      saviezVousCardVisible: true,
      radioFranceCardVisible: true,
      imageWikimediaCardVisible: true,
      cnrsNewsEnabled: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (field && field in user) {
    return NextResponse.json({ [field]: user[field as keyof typeof user] })
  }

  return NextResponse.json(user)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const body = await request.json()
  const { field, value } = body

  const validFields = [
    'wikipediaImageCardVisible',
    'saviezVousCardVisible',
    'radioFranceCardVisible',
    'imageWikimediaCardVisible',
    'cnrsNewsEnabled',
  ]

  if (!validFields.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { [field]: value },
  })

  return NextResponse.json({ success: true })
}
