import { NextResponse } from 'next/server'
import { shareToLobby, unshareFromLobby, isSharedToLobby, shareResourceToLobby, unshareResourceFromLobby, isSharedResourceToLobby } from '@/actions/lobby-share-actions'

export async function POST(req: Request) {
  const { ideaId, resourceType, resourceId, action } = await req.json()

  if (action === 'unshare') {
    if (resourceType && resourceId) {
      const result = await unshareResourceFromLobby(resourceType, resourceId)
      return NextResponse.json(result)
    }
    const result = await unshareFromLobby(ideaId)
    return NextResponse.json(result)
  }

  if (resourceType && resourceId) {
    const result = await shareResourceToLobby(resourceType, resourceId)
    if (result.error) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  }

  const result = await shareToLobby(ideaId)
  if (result.error) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ideaId = searchParams.get('ideaId')
  const resourceId = searchParams.get('resourceId')
  const resourceType = searchParams.get('resourceType')

  if (resourceType && resourceId) {
    const shared = await isSharedResourceToLobby(resourceType, resourceId)
    return NextResponse.json({ shared })
  }

  if (!ideaId) return NextResponse.json({ shared: false })

  const shared = await isSharedToLobby(ideaId)
  return NextResponse.json({ shared })
}
