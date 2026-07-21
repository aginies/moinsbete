import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllUsers } from '@/actions/lobby-share-actions'

export async function GET() {
  return getAllUsers().then(result => NextResponse.json(result))
}
