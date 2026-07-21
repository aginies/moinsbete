import { NextResponse } from 'next/server'
import { getGlobalCardVisibility } from '@/actions/card-actions'

export async function GET() {
  const visibility = await getGlobalCardVisibility()
  return NextResponse.json(visibility)
}
