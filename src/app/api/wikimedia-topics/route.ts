import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Topic {
  id: string
  label: string
  icon: string
  searchTerms: string[]
  enabled: boolean
  active: boolean
  default: boolean
}

const DEFAULT_TOPIC_IDS = [
  'paintings', 'aviation', 'nasa', 'posters', 'ww', 'art',
  'advertisements', 'maps', 'sports-car', 'design', 'deep-space',
]

const DEFAULT_TOPICS: Topic[] = [
  { id: 'paintings', label: 'Peintures', icon: '🎨', searchTerms: ['Painting', 'Oil painting', 'Watercolor', 'Dali'], enabled: true, active: false, default: true },
  { id: 'aviation', label: 'Aviation Militaire', icon: '✈️', searchTerms: ['Avion Chasse', 'Armée Air', 'Air force'], enabled: true, active: true, default: true },
  { id: 'nasa', label: 'NASA', icon: '🚀', searchTerms: ['NASA', 'Apollo program'], enabled: true, active: false, default: true },
  { id: 'posters', label: 'Affiches', icon: '📋', searchTerms: ['Poster', 'Movie poster'], enabled: true, active: false, default: true },
  { id: 'ww', label: 'Guerre', icon: '🪖', searchTerms: ['World War II', 'Second World War', '1939-1945', 'World War I', 'First World War', 'Great War', '1914-1918'], enabled: true, active: false, default: true },
  { id: 'art', label: 'Art', icon: '🎭', searchTerms: ['Art', 'Sculpture', 'Illustration', 'Drawing', 'Musé Louvre', 'Musé Ermitage', 'Musée national de Chine', 'Metropolitan Museum of Art', 'Musées du Vatican'], enabled: true, active: false, default: true },
  { id: 'advertisements', label: 'Publicités', icon: '📰', searchTerms: ['Vintage advertisement', 'Vintage ad', 'Retro ad', 'Poster advertisement'], enabled: true, active: false, default: true },
  { id: 'maps', label: 'Cartes', icon: '🗺️', searchTerms: ['Historical map', 'Old map', 'Antique map', 'Cartography'], enabled: true, active: false, default: true },
  { id: 'sports-car', label: 'Voitures de sport', icon: '🏎️', searchTerms: ['Classic sports car', 'Sports car', 'Racing car', 'Rolls-Royce', 'Bentley', 'Ferrari', 'Lamborghini', 'Porsche'], enabled: true, active: false, default: true },
  { id: 'design', label: 'Design', icon: '📐', searchTerms: ['Industrial design', 'Graphic design', 'Product design', 'Modernist design', 'objets design', 'architecture design'], enabled: true, active: false, default: true },
  { id: 'deep-space', label: 'Espace', icon: '🌌', searchTerms: ['Deep space', 'Nebula', 'Hubble space telescope', 'Andromeda galaxy', 'Supernova'], enabled: true, active: false, default: true },
]

async function getCustomTopics(userId: string): Promise<Topic[]> {
  const dbTopics = await prisma.userWikimediaTopic.findMany({
    where: { userId },
  })
  
  return dbTopics.map(dbTopic => {
    let searchTerms: string[] = []
    if (dbTopic.searchTerms) {
      const raw = dbTopic.searchTerms
      if (Array.isArray(raw)) {
        searchTerms = raw
      } else {
        try {
          searchTerms = JSON.parse(raw)
        } catch {
          searchTerms = []
        }
      }
    }
    return {
      id: dbTopic.topicId,
      label: dbTopic.label || 'Custom',
      icon: dbTopic.icon || '📌',
      searchTerms,
      enabled: dbTopic.enabled,
      active: dbTopic.active,
      default: DEFAULT_TOPIC_IDS.includes(dbTopic.topicId),
    }
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { imageWikimediaCardVisible: true },
  })

  const defaultTopics = DEFAULT_TOPICS.map(t => ({
    ...t,
    enabled: user?.imageWikimediaCardVisible !== false,
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
    const current = await prisma.userWikimediaTopic.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
    })
    
    const currentActive = current ? current.active : (defaultTopic ? defaultTopic.active : false)
    const newActive = !currentActive

    const currentEnabled = current ? current.enabled : (defaultTopic ? defaultTopic.enabled : true)
    
    await prisma.userWikimediaTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
      create: {
        userId: session.user.id,
        topicId: body.topicId,
        enabled: currentEnabled,
        active: newActive,
        label: body.label || defaultTopic?.label || 'Custom',
        icon: body.icon || defaultTopic?.icon || '📌',
        searchTerms: defaultTopic ? JSON.stringify(defaultTopic.searchTerms) : JSON.stringify(body.searchTerms || []),
      },
      update: { active: newActive },
    })
    
    return NextResponse.json({ success: true })
  }

  if (body.action === 'toggle_enabled') {
    const defaultTopic = DEFAULT_TOPICS.find(t => t.id === body.topicId)
    const current = await prisma.userWikimediaTopic.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
    })
    
    const currentEnabled = current ? current.enabled : (defaultTopic ? defaultTopic.enabled : true)
    const newEnabled = !currentEnabled

    const currentActive = current ? current.active : (defaultTopic ? defaultTopic.active : false)
    
    await prisma.userWikimediaTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
      create: {
        userId: session.user.id,
        topicId: body.topicId,
        enabled: newEnabled,
        active: currentActive,
        label: body.label || defaultTopic?.label || 'Custom',
        icon: body.icon || defaultTopic?.icon || '📌',
        searchTerms: defaultTopic ? JSON.stringify(defaultTopic.searchTerms) : JSON.stringify(body.searchTerms || []),
      },
      update: { enabled: newEnabled },
    })
    
    return NextResponse.json({ success: true })
  }

  if (body.action === 'add_custom') {
    const newTopicId = `custom-${Date.now()}`

    await prisma.userWikimediaTopic.create({
      data: {
        userId: session.user.id,
        topicId: newTopicId,
        enabled: true,
        active: true,
        label: body.label,
        icon: body.icon || '📌',
        searchTerms: JSON.stringify(body.searchTerms || []),
      },
    })

    const customTopics = await getCustomTopics(session.user.id)
    return NextResponse.json({ topics: [...DEFAULT_TOPICS, ...customTopics.filter(t => !t.default)] })
  }

  if (body.action === 'delete_custom') {
    await prisma.userWikimediaTopic.delete({
      where: { userId_topicId: { userId: session.user.id, topicId: body.topicId } },
    })

    const customTopics = await getCustomTopics(session.user.id)
    return NextResponse.json({ topics: [...DEFAULT_TOPICS, ...customTopics.filter(t => !t.default)] })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
