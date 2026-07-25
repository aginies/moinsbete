import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllUsers } from '@/actions/lobby-share-actions'

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ users: [] }, { status: 401 })

  return getAllUsers().then(result => NextResponse.json(result))
}
