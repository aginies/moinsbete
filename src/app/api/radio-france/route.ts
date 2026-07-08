import { NextResponse } from 'next/server'
import { getRandomDoc } from '@/data/radio-france'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const excludeId = searchParams.get('exclude') || undefined

  const doc = getRandomDoc(excludeId)

  return NextResponse.json(doc)
}
