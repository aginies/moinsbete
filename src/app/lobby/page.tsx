import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LobbyHeader } from '@/components/lobby/lobby-header'
import { LobbyTabs } from '@/components/lobby/lobby-tabs'
import { redirect } from 'next/navigation'

interface SharedBookmarkRaw {
  id: string
  userId: string
  ideaId: string | null
  resourceId: string | null
  resourceType: string
  meta: any
  createdAt: Date
  idea: any
  user: { id: string; displayName: string | null; email: string }
}

interface UserFavoriteIds {
  IDEA: Set<string>
  SAVIEZ_VOUS: Set<string>
  IMAGE_DU_JOUR: Set<string>
  IMAGE_WIKIMEDIA: Set<string>
  IMAGE_WIKILOVES: Set<string>
  PROVERBE: Set<string>
}

const PAGE_SIZE = 20

export default async function LobbyPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  let userFavoriteIds: UserFavoriteIds = {
    IDEA: new Set(),
    SAVIEZ_VOUS: new Set(),
    IMAGE_DU_JOUR: new Set(),
    IMAGE_WIKIMEDIA: new Set(),
    IMAGE_WIKILOVES: new Set(),
    PROVERBE: new Set(),
  }
  if (session?.user?.id) {
    const bookmarks = await prisma.$queryRaw<Array<{ resourceId: string; type: string }>>`
      SELECT "resourceId" AS "resourceId", "type" AS "type"
      FROM "Bookmark"
      WHERE "userId" = ${session.user.id}
    `
    const knownTypes = ['IDEA', 'SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'PROVERBE'] as const
    for (const bm of bookmarks) {
      if (bm.resourceId && knownTypes.includes(bm.type as typeof knownTypes[number])) {
        userFavoriteIds[bm.type as keyof UserFavoriteIds].add(bm.resourceId)
      }
    }
  }

  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  const [total, sharedBookmarks] = await prisma.$transaction([
    prisma.sharedLobbyBookmark.count(),
    prisma.sharedLobbyBookmark.findMany({
      include: {
        idea: {
          include: {
            ideaTopics: {
              include: {
                topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
              },
            },
            source: { select: { title: true, type: true, url: true } },
          },
        },
        user: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
  ])

  const saviezBookmarks = sharedBookmarks.filter(b => b.resourceType === 'SAVIEZ_VOUS' && b.resourceId)
  const imageBookmarks = sharedBookmarks.filter(b => b.resourceType === 'IMAGE_DU_JOUR' && b.resourceId)
  const wikiMediaBookmarks = sharedBookmarks.filter(b => b.resourceType === 'IMAGE_WIKIMEDIA' && b.resourceId)
  const wikiLovesBookmarks = sharedBookmarks.filter(b => b.resourceType === 'IMAGE_WIKILOVES' && b.resourceId)

  const saviezFacts = saviezBookmarks.length > 0
    ? await prisma.saviezVousFact.findMany({
        where: { id: { in: saviezBookmarks.map(b => b.resourceId!) } },
      })
    : []

  const wikiImages = imageBookmarks.length > 0
    ? await prisma.cachedWikipediaImage.findMany({
        where: { fileUrl: { in: imageBookmarks.map(b => b.resourceId!) } },
      })
    : []

  const wikiMediaImages = wikiMediaBookmarks.length > 0
    ? await prisma.cachedWikiLovesImage.findMany({
        where: { docid: { in: wikiMediaBookmarks.map(b => b.resourceId!) } },
      })
    : []

  const wikiLovesImages = wikiLovesBookmarks.length > 0
    ? await prisma.cachedWikiLovesImage.findMany({
        where: { docid: { in: wikiLovesBookmarks.map(b => b.resourceId!) } },
      })
    : []

  const saviezMap = new Map(saviezFacts.map(f => [f.id, f]))
  const imageMap = new Map<string, any>()
  wikiImages.forEach(i => imageMap.set(i.fileUrl, i))
  const wikiMediaMap = new Map(wikiMediaImages.map(i => [i.docid, i]))
  const wikiLovesMap = new Map(wikiLovesImages.map(i => [i.docid, i]))

  const enrichedBookmarks = sharedBookmarks.map(bookmark => {
    if (bookmark.resourceType === 'SAVIEZ_VOUS' && bookmark.resourceId) {
      const fact = saviezMap.get(bookmark.resourceId)
      return { ...bookmark, saviezFact: fact }
    }
    if (bookmark.resourceType === 'IMAGE_DU_JOUR' && bookmark.resourceId) {
      let image = imageMap.get(bookmark.resourceId)
      if (!image && bookmark.meta) {
        try {
          const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
          image = {
            id: bookmark.resourceId,
            imageUrl: m.imageUrl || '',
            description: m.description || '',
            fileUrl: m.fileUrl || '',
            date: m.date || '',
          }
        } catch {}
      }
      return { ...bookmark, wikiImage: image }
    }
    if (bookmark.resourceType === 'IMAGE_WIKIMEDIA' && bookmark.resourceId) {
      let image = wikiMediaMap.get(bookmark.resourceId)
      if (!image && bookmark.meta) {
        try {
          const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
          image = {
            id: bookmark.resourceId,
            docid: bookmark.resourceId,
            title: m.titre || '',
            author: m.auteur || '',
            imageUrl: m.imageUrl || '',
            commonsUrl: m.link || '',
            license: m.droits || '',
            year: 0,
            source: '',
            scrapedAt: new Date(),
            expiresAt: new Date(),
          }
        } catch {}
      }
      return { ...bookmark, wikiMediaImage: image }
    }
    if (bookmark.resourceType === 'IMAGE_WIKILOVES' && bookmark.resourceId) {
      let image = wikiLovesMap.get(bookmark.resourceId)
      if (!image && bookmark.meta) {
        try {
          const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
          image = {
            id: bookmark.resourceId,
            docid: bookmark.resourceId,
            title: m.titre || '',
            author: m.auteur || '',
            imageUrl: m.imageUrl || '',
            commonsUrl: m.link || '',
            license: m.droits || '',
            year: 0,
            source: '',
            scrapedAt: new Date(),
            expiresAt: new Date(),
          }
        } catch {}
      }
      return { ...bookmark, wikiLovesImage: image }
    }
    if (bookmark.resourceType === 'PROVERBE' && bookmark.resourceId) {
      return { ...bookmark, proverbe: bookmark.meta }
    }
    return bookmark
  }) as Array<SharedBookmarkRaw & { saviezFact?: any; wikiImage?: any; wikiMediaImage?: any; wikiLovesImage?: any }>

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      <LobbyHeader isLoggedIn={!!session?.user} />

      <LobbyTabs
        suggestions={suggestions}
        sharedBookmarks={enrichedBookmarks}
        currentUserId={session?.user?.id ?? null}
        isAdmin={session?.user?.role === 'ADMIN'}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        currentPage={page}
        userFavoriteIds={userFavoriteIds}
      />
    </div>
  )
}
