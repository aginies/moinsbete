import { NextResponse } from 'next/server'
import { shareToLobby, unshareFromLobby, isSharedToLobby } from '@/actions/lobby-share-actions'

export async function POST(req: Request) {
  const { ideaId, action } = await req.json()

  if (action === 'unshare') {
    const result = await unshareFromLobby(ideaId)
    return NextResponse.json(result)
  }

  const result = await shareToLobby(ideaId)
  if (result.error) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ideaId = searchParams.get('ideaId')
  if (!ideaId) return NextResponse.json({ shared: false })

  const shared = await isSharedToLobby(ideaId)
  return NextResponse.json({ shared })
}
