'use server'

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 204 })
  }

  const now = new Date()
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastVisited: true },
  })

  if (user?.lastVisited && user.lastVisited >= thirtyMinutesAgo) {
    return new NextResponse(null, { status: 204 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastVisited: now },
  })

  return new NextResponse(null, { status: 200 })
}
