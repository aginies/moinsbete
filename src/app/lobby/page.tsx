import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LobbyHeader } from '@/components/lobby/lobby-header'
import { LobbyTabs } from '@/components/lobby/lobby-tabs'

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

export default async function LobbyPage() {
  const session = await getSession()
  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  const sharedBookmarks = await prisma.sharedLobbyBookmark.findMany({
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
    take: 50,
  })

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
    ? await prisma.cachedWikipediaImage.findMany({
        where: { imageUrl: { in: wikiMediaBookmarks.map(b => b.resourceId!) } },
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
  wikiMediaImages.forEach(i => imageMap.set(i.imageUrl, i))
  const wikiLovesMap = new Map(wikiLovesImages.map(i => [i.docid, i]))

  const enrichedBookmarks = sharedBookmarks.map(bookmark => {
    if (bookmark.resourceType === 'SAVIEZ_VOUS' && bookmark.resourceId) {
      const fact = saviezMap.get(bookmark.resourceId)
      return { ...bookmark, saviezFact: fact }
    }
    if (bookmark.resourceType === 'IMAGE_DU_JOUR' && bookmark.resourceId) {
      const image = imageMap.get(bookmark.resourceId)
      return { ...bookmark, wikiImage: image }
    }
    if (bookmark.resourceType === 'IMAGE_WIKIMEDIA' && bookmark.resourceId) {
      const image = imageMap.get(bookmark.resourceId)
      return { ...bookmark, wikiImage: image }
    }
    if (bookmark.resourceType === 'IMAGE_WIKILOVES' && bookmark.resourceId) {
      const image = wikiLovesMap.get(bookmark.resourceId)
      return { ...bookmark, wikiLovesImage: image }
    }
    return bookmark
  }) as Array<SharedBookmarkRaw & { saviezFact?: any; wikiImage?: any; wikiLovesImage?: any }>

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <LobbyHeader isLoggedIn={!!session?.user} />

      <LobbyTabs
        suggestions={suggestions}
        sharedBookmarks={enrichedBookmarks}
        currentUserId={session?.user?.id ?? null}
        isAdmin={session?.user?.role === 'ADMIN'}
      />
    </div>
  )
}
