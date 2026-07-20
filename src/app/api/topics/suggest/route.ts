import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { suggestTopic } from '@/lib/llm'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

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

function isMetaCategory(category: string): boolean {
  return META_PATTERNS.some(pattern => category.includes(pattern))
}

export async function POST(request: NextRequest) {
  let category: string | undefined
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`suggest:${clientId}`, 10, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
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
