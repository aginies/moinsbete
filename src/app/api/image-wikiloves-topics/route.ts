import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Topic {
  id: string
  label: string
  icon: string
  enabled: boolean
  active: boolean
  default: boolean
}

const DEFAULT_TOPICS: Topic[] = [
  { id: 'wle', label: 'Wiki Loves Earth', icon: '🌿', enabled: true, active: true, default: true },
  { id: 'wlm', label: 'Wiki Loves Monuments', icon: '🏛️', enabled: true, active: true, default: true },
]

async function getCustomTopics(userId: string): Promise<Topic[]> {
  const dbTopics = await prisma.userWikiLovesTopic.findMany({
    where: { userId },
  })

  return dbTopics.map(dbTopic => ({
    id: dbTopic.topicId,
    label: dbTopic.label || 'Custom',
    icon: dbTopic.icon || '📌',
    enabled: dbTopic.enabled,
    active: dbTopic.active,
    default: false,
  }))
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { imageWikiLovesCardVisible: true },
  })

  const defaultTopics = DEFAULT_TOPICS.map(t => ({
    ...t,
    enabled: user?.imageWikiLovesCardVisible !== false,
  }))

  const customTopics = await getCustomTopics(session.user.id)

  const mergedTopics = defaultTopics.map(defaultTopic => {
    const dbTopic = customTopics.find(t => t.id === defaultTopic.id)
    if (dbTopic) {
      return { ...defaultTopic, enabled: dbTopic.enabled, active: dbTopic.active }
    }
    return defaultTopic
  })

  return NextResponse.json({ topics: [...mergedTopics, ...customTopics.filter(t => !t.default)] })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === 'toggle_active') {
    const defaultTopic = DEFAULT_TOPICS.find(t => t.id === body.topicId)
    const current = await prisma.userWikiLovesTopic.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
    })

    const currentActive = current ? current.active : (defaultTopic ? defaultTopic.active : false)
    const newActive = !currentActive

    const currentEnabled = current ? current.enabled : (defaultTopic ? defaultTopic.enabled : true)

    await prisma.userWikiLovesTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
      create: {
        userId: session.user.id,
        topicId: body.topicId,
        enabled: currentEnabled,
        active: newActive,
        label: body.label || defaultTopic?.label || 'Custom',
        icon: body.icon || defaultTopic?.icon || '📌',
        searchTerms: undefined,
      },
      update: { active: newActive },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'toggle_enabled') {
    const defaultTopic = DEFAULT_TOPICS.find(t => t.id === body.topicId)
    const current = await prisma.userWikiLovesTopic.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
    })

    const currentEnabled = current ? current.enabled : (defaultTopic ? defaultTopic.enabled : true)
    const newEnabled = !currentEnabled

    const currentActive = current ? current.active : (defaultTopic ? defaultTopic.active : false)

    await prisma.userWikiLovesTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
      create: {
        userId: session.user.id,
        topicId: body.topicId,
        enabled: newEnabled,
        active: currentActive,
        label: body.label || defaultTopic?.label || 'Custom',
        icon: body.icon || defaultTopic?.icon || '📌',
        searchTerms: undefined,
      },
      update: { enabled: newEnabled },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
