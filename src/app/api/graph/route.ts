import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

  try {
    const viewedIdeas = await prisma.viewedIdea.findMany({
      where: { userId: session.user.id },
      include: {
        idea: {
          include: {
            ideaTopics: {
              include: {
                topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
              },
            },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    })

    const nodesMap = new Map<string, { id: string; label: string; group: 'topic' | 'idea'; color: string; icon?: string; size: number; content?: string; takeaway?: string; slug?: string }>()
    const links: Array<{ source: string; target: string }> = []

    for (const viewed of viewedIdeas) {
      const idea = viewed.idea
      const firstTopic = idea.ideaTopics[0]?.topic

      if (!nodesMap.has(idea.id)) {
        nodesMap.set(idea.id, {
          id: idea.id,
          label: idea.title,
          group: 'idea',
          color: firstTopic?.color || '#6b7280',
          size: 15,
          content: idea.content,
          takeaway: idea.takeaway,
          slug: idea.slug,
        })
      }

      for (const ideaTopic of idea.ideaTopics) {
        const topic = ideaTopic.topic
        const topicId = `topic-${topic.id}`

        if (!nodesMap.has(topicId)) {
          nodesMap.set(topicId, {
            id: topicId,
            label: topic.name,
            group: 'topic',
            color: topic.color,
            icon: topic.icon,
            size: 30,
          })
        }

        links.push({ source: idea.id, target: topicId })
      }
    }

    const nodes = Array.from(nodesMap.values())

    return NextResponse.json({ nodes, links })
  } catch (error) {
    console.error('[GraphAPI] error:', error)
    return NextResponse.json({ nodes: [], links: [] })
  }
}
