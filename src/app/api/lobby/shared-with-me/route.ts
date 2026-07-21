import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSharedWithMe } from '@/actions/lobby-share-actions'

export async function GET() {
  return getSharedWithMe().then(result => NextResponse.json(result))
}
