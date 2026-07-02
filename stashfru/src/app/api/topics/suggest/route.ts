import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { suggestTopic } from '@/lib/llm'
import { slugify } from '@/lib/utils'

const META_PATTERNS = [
  'Portail:',
  'Wikipédia:',
  'Article ébauche',
  'À illustrer',
  'Articles à vérifier',
  'Bandeau de chapitre',
  'Section vide',
  'à recycler',
  'protection demande',
]

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 10
const rateLimitStore = new Map<string, number[]>()

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitStore.get(clientId) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(clientId, recent)
    return false
  }
  
  recent.push(now)
  rateLimitStore.set(clientId, recent)
  return true
}

function isMetaCategory(category: string): boolean {
  return META_PATTERNS.some(pattern => category.includes(pattern))
}

export async function POST(request: NextRequest) {
  let category: string | undefined
  try {
    const clientId = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientId)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans 60 secondes.' }, { status: 429 })
    }

    const body = await request.json()
    category = body.category

    if (!category) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    if (isMetaCategory(category)) {
      return NextResponse.json({ action: 'skip', reason: 'meta-category' })
    }

    const words = category.split(' ')
    if (words.length > 3) {
      return NextResponse.json({
        action: 'create',
        suggestion: {
          name: words.slice(0, 3).join(' '),
          icon: '📚',
        },
        confidence: 0.5,
      })
    }

    const existingTopics = await prisma.topic.findMany({
      include: {
        parent: { select: { name: true } },
      },
    })

    const suggestion = await suggestTopic(category, existingTopics)

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Topic suggest error:', error)
    return NextResponse.json(
      {
        action: 'create',
        suggestion: { name: category, icon: '📚' },
        confidence: 0.3,
      },
      { status: 200 }
    )
  }
}
