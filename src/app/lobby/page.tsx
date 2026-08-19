import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LobbyHeader } from '@/components/lobby/lobby-header'
import { LobbyTabs } from '@/components/lobby/lobby-tabs'
import { cookies } from 'next/headers'
import type { JsonValue } from '@prisma/client/runtime/library'
import type { Idea, SharedLobbyBookmark, SaviezVousFact, CachedWikipediaImage, CachedWikiLovesImage, CachedNewsArticle, CachedCitationArticle } from '@/generated/client'
import { redirect } from 'next/navigation'
import { apodPageUrl } from '@/lib/utils'

interface SharedBookmarkRaw extends SharedLobbyBookmark {
  meta: JsonValue | null
  idea: (Idea & {
    ideaTopics: { topic: { id: string; name: string; slug: string; icon: string; color: string } }[]
    source: { title: string; type: string; url: string | null }
  }) | null
  user: { id: string; displayName: string | null; email: string }
  sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }>
  newsArticle?: { id: string; title: string; description: string; imageUrl: string | null; source: string; category: string; url: string } | null
  portailWikipediaArticle?: { id: string; title: string; extract: string; imageUrl: string | null; pageUrl: string } | null
  citation?: CachedCitationArticle | null
  insoliteArticle?: { id: string; title: string; description: string; url: string; imageUrl: string | null } | null
  airCrashArticle?: { id: string; title: string; description: string; url: string; imageUrl: string | null } | null
  apodImage?: { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | null
}

interface UserFavoriteIds {
  IDEA: Set<string>
  SAVIEZ_VOUS: Set<string>
  IMAGE_DU_JOUR: Set<string>
  IMAGE_WIKIMEDIA: Set<string>
  IMAGE_WIKILOVES: Set<string>
  PROVERBE: Set<string>
  PORTAIL_LEXICAL: Set<string>
  NEWS: Set<string>
  PORTAIL_WIKIPEDIA: Set<string>
  CITATION: Set<string>
  INSOLITE: Set<string>
  APOD: Set<string>
  AIR_CRASH: Set<string>
}

const PAGE_SIZE = 20

export default async function LobbyPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  try {
    const params = await searchParams
    const page = Math.max(1, parseInt(params.page || '1', 10))
    const skip = (page - 1) * PAGE_SIZE

    const session = await getSession()
    if (!session?.user) {
      return redirect('/login')
    }

    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value as 'fr' | 'en') || 'fr'

    const userFavoriteIds: UserFavoriteIds = {
      IDEA: new Set(),
      SAVIEZ_VOUS: new Set(),
      IMAGE_DU_JOUR: new Set(),
      IMAGE_WIKIMEDIA: new Set(),
      IMAGE_WIKILOVES: new Set(),
      PROVERBE: new Set(),
      PORTAIL_LEXICAL: new Set(),
      NEWS: new Set(),
      PORTAIL_WIKIPEDIA: new Set(),
      CITATION: new Set(),
      INSOLITE: new Set(),
      APOD: new Set(),
      AIR_CRASH: new Set(),
    }
    if (session?.user?.id) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: session.user.id,
          type: { in: ['IDEA', 'SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'PROVERBE', 'PORTAIL_LEXICAL', 'NEWS', 'CITATION', 'INSOLITE', 'APOD', 'AIR_CRASH'] },
        },
        select: { resourceId: true, type: true },
      })
      const knownTypes = ['IDEA', 'SAVIEZ_VOUS', 'IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'PROVERBE', 'PORTAIL_LEXICAL', 'NEWS', 'PORTAIL_WIKIPEDIA', 'INSOLITE', 'APOD', 'AIR_CRASH'] as const
      for (const bm of bookmarks) {
        if (bm.resourceId && knownTypes.includes(bm.type as typeof knownTypes[number])) {
          userFavoriteIds[bm.type as keyof UserFavoriteIds].add(bm.resourceId)
        }
      }
    }

    const sharedBookmarkInclude = {
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
      } as const,
    }

    const [suggestions, sharedBookmarks, proverbeConfig, sharedWithMeBookmarks, sharedByMeBookmarks] = await prisma.$transaction([
      prisma.userSuggestion.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          _count: { select: { comments: true } },
          user: { select: { id: true, displayName: true, email: true } },
        },
      }),
      prisma.sharedLobbyBookmark.findMany({
        ...sharedBookmarkInclude,
        where: { sharedWithUserId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } }),
      prisma.sharedLobbyBookmark.findMany({
        ...sharedBookmarkInclude,
        where: { sharedWithUserId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.sharedLobbyBookmark.findMany({
        ...sharedBookmarkInclude,
        where: { userId: session.user.id, sharedWithUserId: { not: null } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
    ])

    const total = await prisma.sharedLobbyBookmark.count({
      where: { sharedWithUserId: null },
    })
    const totalSharedWithMe = await prisma.sharedLobbyBookmark.count({
      where: { sharedWithUserId: session.user.id },
    })
    const totalSharedByMe = await prisma.sharedLobbyBookmark.count({
      where: { userId: session.user.id, sharedWithUserId: { not: null } },
    })

    const saviezBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'SAVIEZ_VOUS' && b.resourceId)
    const sharedWithMeSaviez = sharedWithMeBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'SAVIEZ_VOUS' && b.resourceId)
    const sharedByMeSaviez = sharedByMeBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'SAVIEZ_VOUS' && b.resourceId)
    const allSaviezIds = [...new Set([...saviezBookmarks, ...sharedWithMeSaviez, ...sharedByMeSaviez].map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean))]

    const imageBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'IMAGE_DU_JOUR' && b.resourceId)
    const wikiMediaBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'IMAGE_WIKIMEDIA' && b.resourceId)
    const wikiLovesBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'IMAGE_WIKILOVES' && b.resourceId)

    const saviezIds = allSaviezIds
    const imageIds = imageBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const wikiMediaIds = wikiMediaBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const wikiLovesIds = wikiLovesBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)

    const proverbeBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'PROVERBE' && b.resourceId)
    const newsBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'NEWS' && b.resourceId)
    const portailWikiBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'PORTAIL_WIKIPEDIA' && b.resourceId)
    const newsIds = newsBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const portailWikiIds = portailWikiBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const citationBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'CITATION' && b.resourceId)
    const citationIds = citationBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const insoliteBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'INSOLITE' && b.resourceId)
    const insoliteIds = insoliteBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const apodBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'APOD' && b.resourceId)
    const apodIds = apodBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const airCrashBookmarks = sharedBookmarks.filter((b: { resourceType: string; resourceId: string | null }) => b.resourceType === 'AIR_CRASH' && b.resourceId)
    const airCrashIds = airCrashBookmarks.map((b: { resourceId: string | null }) => b.resourceId!).filter(Boolean)
    const cachedProverbes: Array<{ text: string; signification: string; source: string; hasWiktionnairePage: boolean; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }> = proverbeConfig ? JSON.parse(proverbeConfig.value) : []

    const [saviezFacts, wikiImages, wikiLovesImages, cachedNewsArticles, cachedPortailWikiArticles, cachedCitationArticles, cachedInsoliteArticles, cachedApodImages, cachedAirCrashArticles] = await prisma.$transaction([
      prisma.saviezVousFact.findMany({ where: saviezIds.length > 0 ? { id: { in: saviezIds } } : {} }),
      prisma.cachedWikipediaImage.findMany({ where: imageIds.length > 0 ? { fileUrl: { in: imageIds } } : {} }),
      prisma.cachedWikiLovesImage.findMany({ where: wikiLovesIds.length > 0 ? { docid: { in: wikiLovesIds } } : {} }),
      prisma.cachedNewsArticle.findMany({ where: newsIds.length > 0 ? { url: { in: newsIds } } : {} }),
      prisma.cachedWikipediaPortalArticle.findMany({ where: portailWikiIds.length > 0 ? { id: { in: portailWikiIds } } : {} }),
      prisma.cachedCitationArticle.findMany({ where: citationIds.length > 0 ? { id: { in: citationIds } } : {} }),
      prisma.cachedInsoliteArticle.findMany({ where: insoliteIds.length > 0 ? { id: { in: insoliteIds } } : {} }),
      prisma.cachedApodImage.findMany({ where: apodIds.length > 0 ? { date: { in: apodIds } } : {} }),
      prisma.cachedAirCrashArticle.findMany({ where: airCrashIds.length > 0 ? { id: { in: airCrashIds } } : {} }),
    ])

    const proverbeMap = new Map<string, typeof cachedProverbes[0]>()
    for (const p of cachedProverbes) {
      const slug = p.text.toLowerCase()
        .replace(/[^a-zàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100)
      proverbeMap.set(slug, p)
    }

    const saviezMap = new Map(saviezFacts.map((f: SaviezVousFact) => [f.id, f]))
    const imageMap = new Map<string, CachedWikipediaImage>()
    wikiImages.forEach((i: CachedWikipediaImage) => imageMap.set(i.fileUrl, i))
    const wikiLovesMap = new Map(wikiLovesImages.map((i: CachedWikiLovesImage) => [i.docid, i]))
    const newsMap = new Map(cachedNewsArticles.map((a: { url: string; title: string; description: string | null; imageUrl: string | null; source: string; category: string }) => [a.url, a]))
    const portailWikiMap = new Map(cachedPortailWikiArticles.map((a: { id: string; title: string; extract: string; imageUrl: string | null; pageUrl: string }) => [a.id, a]))
    const citationMap = new Map(cachedCitationArticles.map((a: CachedCitationArticle) => [a.id, a]))
    const insoliteMap = new Map(cachedInsoliteArticles.map((a: { id: string; title: string; description: string; url: string; imageUrl: string | null }) => [a.id, a]))
    const apodMap = new Map(cachedApodImages.map((a: { date: string }) => [a.date, a]))
    const airCrashMap = new Map(cachedAirCrashArticles.map((a: { id: string }) => [a.id, a]))

    const allBookmarks = [...sharedBookmarks, ...sharedWithMeBookmarks, ...sharedByMeBookmarks]
    const missingIdeaIds = [...new Set(
      allBookmarks
        .filter(b => b.resourceType === 'IDEA' && b.resourceId && !b.idea)
        .map(b => b.resourceId!)
    )]
    const missingIdeas = missingIdeaIds.length > 0
      ? await prisma.idea.findMany({
          where: { id: { in: missingIdeaIds } },
          include: {
            ideaTopics: {
              include: {
                topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
              },
            },
            source: { select: { title: true, type: true, url: true } },
          },
        })
      : []
    const ideaMap = new Map(missingIdeas.map(i => [i.id, i]))

    const enrichBookmark = (bookmark: SharedLobbyBookmark & { idea: any; user: any }): SharedBookmarkRaw & { saviezFact?: SaviezVousFact | null; wikiImage?: CachedWikipediaImage | null; wikiMediaImage?: CachedWikiLovesImage | null; wikiLovesImage?: CachedWikiLovesImage | null; proverbe?: { id: string; text: string; signification: string; source: string; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }; citation?: CachedCitationArticle | null; apodImage?: { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | null; idea?: any } => {
      if (bookmark.resourceType === 'SAVIEZ_VOUS' && bookmark.resourceId) {
        const fact = saviezMap.get(bookmark.resourceId)
        if (fact) return { ...bookmark, saviezFact: fact as SaviezVousFact | null }
        if (bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'text' in meta) {
            const m = meta as Record<string, unknown>
            return {
              ...bookmark,
              saviezFact: {
                id: bookmark.resourceId,
                text: (m.text || '') as string,
                sourceUrl: (m.sourceUrl || m.url || null) as string | null,
                imageFilename: (m.imageFilename || null) as string | null,
              } as SaviezVousFact,
            }
          }
        }
        return { ...bookmark, saviezFact: null }
      }
      if (bookmark.resourceType === 'NEWS' && bookmark.resourceId) {
        const article = newsMap.get(bookmark.resourceId)
        if (article) return { ...bookmark, newsArticle: article as any }
        if (bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'title' in meta) {
            const m = meta as Record<string, unknown>
            return {
              ...bookmark,
              newsArticle: {
                id: bookmark.resourceId,
                title: (m.title || '') as string,
                description: (m.description || '') as string,
                imageUrl: (m.imageUrl || null) as string | null,
                source: (m.source || '') as string,
                category: (m.category || '') as string,
                url: bookmark.resourceId,
              },
            }
          }
        }
        return { ...bookmark, newsArticle: null }
      }
      if (bookmark.resourceType === 'IMAGE_DU_JOUR' && bookmark.resourceId) {
        let image = imageMap.get(bookmark.resourceId)
        if (!image && bookmark.meta) {
          try {
            const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
            if (typeof m === 'object' && m !== null) {
              image = {
                id: bookmark.resourceId,
                imageUrl: (m as Record<string, unknown>).imageUrl || '',
                description: (m as Record<string, unknown>).description || '',
                fileUrl: (m as Record<string, unknown>).fileUrl || '',
                date: (m as Record<string, unknown>).date || '',
              } as CachedWikipediaImage
            }
          } catch {}
        }
        return { ...bookmark, wikiImage: image as CachedWikipediaImage | null }
      }
      if (bookmark.resourceType === 'IMAGE_WIKIMEDIA' && bookmark.resourceId) {
        let image = null as CachedWikiLovesImage | null
        if (bookmark.meta) {
          try {
            const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
            if (typeof m === 'object' && m !== null && 'imageUrl' in m) {
              image = {
                id: bookmark.resourceId,
                docid: bookmark.resourceId,
                title: (m as Record<string, unknown>).titre || (m as Record<string, unknown>).title || '',
                author: (m as Record<string, unknown>).auteur || (m as Record<string, unknown>).author || '',
                imageUrl: (m as Record<string, unknown>).imageUrl || '',
                commonsUrl: (m as Record<string, unknown>).link || null,
                license: (m as Record<string, unknown>).droits || '',
                year: 0,
                source: '',
                scrapedAt: new Date(),
                expiresAt: new Date(),
              } as CachedWikiLovesImage
            }
          } catch {}
        }
        return { ...bookmark, wikiMediaImage: image as CachedWikiLovesImage | null }
      }
      if (bookmark.resourceType === 'IMAGE_WIKILOVES' && bookmark.resourceId) {
        let image = wikiLovesMap.get(bookmark.resourceId)
        if (!image && bookmark.meta) {
          try {
            const m = typeof bookmark.meta === 'string' ? JSON.parse(bookmark.meta) : bookmark.meta
            if (typeof m === 'object' && m !== null) {
              image = {
                id: bookmark.resourceId,
                docid: bookmark.resourceId,
                title: (m as Record<string, unknown>).titre || '',
                author: (m as Record<string, unknown>).auteur || '',
                imageUrl: (m as Record<string, unknown>).imageUrl || '',
                commonsUrl: (m as Record<string, unknown>).link || null,
                license: (m as Record<string, unknown>).droits || '',
                year: 0,
                source: '',
                scrapedAt: new Date(),
                expiresAt: new Date(),
              } as CachedWikiLovesImage
            }
          } catch {}
        }
        return { ...bookmark, wikiLovesImage: image as CachedWikiLovesImage | null }
      }
      if (bookmark.resourceType === 'PROVERBE' && bookmark.resourceId) {
        let proverbe = proverbeMap.get(bookmark.resourceId)
        if (!proverbe && bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'text' in meta) {
            const text = (meta as Record<string, unknown>).text as string
            if (text) {
              const slug = text.toLowerCase()
                .replace(/[^a-zàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 100)
              proverbe = proverbeMap.get(slug)
            }
          }
        }
        if (proverbe) {
          return {
            ...bookmark,
            proverbe: {
              id: bookmark.resourceId,
              text: proverbe.text,
              signification: proverbe.signification || '',
              source: proverbe.source || '',
              wiktionnaireUrl: proverbe.wiktionnaireUrl,
              etymologie: proverbe.etymologie || '',
              definitions: proverbe.definitions || [],
            },
          }
        }
        let meta = bookmark.meta as JsonValue | null
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
        }
        if (typeof meta !== 'object' || meta === null) {
          meta = {}
        }
        const m = meta as Record<string, unknown>
        return {
          ...bookmark,
          proverbe: {
            id: bookmark.resourceId,
            text: (m.text || '') as string,
            signification: (m.signification || '') as string,
            source: (m.source || '') as string,
            wiktionnaireUrl: (m.wiktionnaireUrl || m.url || '') as string | undefined,
            etymologie: (m.etymologie || '') as string,
            definitions: (m.definitions as string[] | undefined) || [],
          },
        }
      }
      if (bookmark.resourceType === 'IDEA' && (bookmark.resourceId || bookmark.ideaId)) {
        let ideaId = bookmark.ideaId || bookmark.resourceId!
        let idea = bookmark.idea || ideaMap.get(ideaId) || null
        if (idea) {
          return {
            ...bookmark,
            idea: idea as typeof idea,
          }
        }
      }
      if (bookmark.resourceType === 'PORTAIL_WIKIPEDIA' && bookmark.resourceId) {
        let article = portailWikiMap.get(bookmark.resourceId)
        if (article) return { ...bookmark, portailWikipediaArticle: article as any }
        if (bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'title' in meta) {
            const m = meta as Record<string, unknown>
            return {
              ...bookmark,
              portailWikipediaArticle: {
                id: bookmark.resourceId,
                title: (m.title || '') as string,
                extract: (m.extract || '') as string,
                imageUrl: (m.imageUrl || null) as string | null,
                pageUrl: (m.pageUrl || '') as string,
              },
            }
          }
        }
        return { ...bookmark, portailWikipediaArticle: null }
      }
      if (bookmark.resourceType === 'CITATION' && bookmark.resourceId) {
        let citation = citationMap.get(bookmark.resourceId)
        if (!citation && bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'text' in meta) {
            const m = meta as Record<string, unknown>
            citation = {
              id: bookmark.resourceId,
              text: (m.text || '') as string,
              author: (m.author || '') as string,
              source: (m.source || null) as string | null,
              category: (m.category || '') as string,
              categoryType: 'auteur',
              wikiUrl: (m.url || '') as string,
              imageUrl: (m.imageUrl || null) as string | null,
              scrapedAt: new Date(),
              expiresAt: new Date(),
            } as CachedCitationArticle
          }
        }
        return { ...bookmark, citation: citation as CachedCitationArticle | null }
      }
      if (bookmark.resourceType === 'INSOLITE' && bookmark.resourceId) {
        let article = insoliteMap.get(bookmark.resourceId)
        if (!article && bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) as JsonValue } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'title' in meta) {
            const m = meta as Record<string, unknown>
            article = {
              id: bookmark.resourceId,
              title: (m.title || '') as string,
              description: (m.description || '') as string,
              url: (m.url || '') as string,
              imageUrl: (m.imageUrl || null) as string | null,
              category: 'général',
              scrapedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            } as any
          }
        }
        return { ...bookmark, insoliteArticle: article as any }
      }
      if (bookmark.resourceType === 'AIR_CRASH' && bookmark.resourceId) {
        let article = airCrashMap.get(bookmark.resourceId)
        if (!article && bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'title' in meta) {
            const m = meta as Record<string, unknown>
            article = {
              id: bookmark.resourceId,
              title: (m.title || '') as string,
              description: (m.description || '') as string,
              url: (m.url || '') as string,
              imageUrl: (m.imageUrl || null) as string | null,
              scrapedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            } as any
          }
        }
        return { ...bookmark, airCrashArticle: article as any }
      }
      if (bookmark.resourceType === 'APOD' && bookmark.resourceId) {
        let image = apodMap.get(bookmark.resourceId) as { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | undefined
        if (!image && bookmark.meta) {
          let meta = bookmark.meta as JsonValue | null
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) } catch { meta = {} }
          }
          if (typeof meta === 'object' && meta !== null && 'imageUrl' in meta) {
            const m = meta as Record<string, unknown>
            image = {
              id: bookmark.resourceId,
              date: bookmark.resourceId,
              title: (m.titre || '') as string,
              explanation: (m.description || '') as string,
              titleFr: (m.titreFr || null) as string | null,
              explanationFr: (m.descriptionFr || null) as string | null,
              imageUrl: (m.imageUrl || '') as string,
              hdImageUrl: null,
              copyright: (m.auteur || null) as string | null,
              apodUrl: apodPageUrl(bookmark.resourceId) || (m.link as string) || '',
            }
          }
        }
        if (image) {
          image = { ...image, apodUrl: apodPageUrl(image.date) || image.apodUrl }
        }
        return { ...bookmark, apodImage: image ?? null }
      }
      return bookmark
    }

    const enrichedBookmarks = sharedBookmarks.map(enrichBookmark).map(b => ({ ...b, sharedToCommunity: b.sharedWithUserId === null, sharedWithUsers: [], formattedCreatedAt: b.createdAt.toLocaleDateString(locale) })) as Array<SharedBookmarkRaw & { saviezFact?: SaviezVousFact | null; wikiImage?: CachedWikipediaImage | null; wikiMediaImage?: CachedWikiLovesImage | null; wikiLovesImage?: CachedWikiLovesImage | null; proverbe?: { id: string; text: string; signification: string; source: string; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }; citation?: CachedCitationArticle | null; apodImage?: { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | null; idea?: any; formattedCreatedAt: string; sharedToCommunity?: boolean; sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }> }>

    const enrichedSharedWithMe = sharedWithMeBookmarks.map(enrichBookmark).map(b => ({ ...b, formattedCreatedAt: b.createdAt.toLocaleDateString(locale) })) as Array<SharedBookmarkRaw & { saviezFact?: SaviezVousFact | null; wikiImage?: CachedWikipediaImage | null; wikiMediaImage?: CachedWikiLovesImage | null; wikiLovesImage?: CachedWikiLovesImage | null; proverbe?: { id: string; text: string; signification: string; source: string; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }; citation?: CachedCitationArticle | null; apodImage?: { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | null; idea?: any; formattedCreatedAt: string }>

    const sharedByMeMap = new Map<string, { bookmark: typeof sharedByMeBookmarks[0]; recipientIds: string[] }>()
    for (const bookmark of sharedByMeBookmarks) {
      const key = `${bookmark.resourceType}:${bookmark.resourceId || bookmark.ideaId}`
      if (!sharedByMeMap.has(key)) {
        sharedByMeMap.set(key, { bookmark, recipientIds: [] })
      }
      const entry = sharedByMeMap.get(key)!
      if (bookmark.sharedWithUserId) {
        entry.recipientIds.push(bookmark.sharedWithUserId)
      }
    }
    
    const allRecipientIds = [...new Set(sharedByMeBookmarks
      .filter(b => b.sharedWithUserId)
      .map(b => b.sharedWithUserId!))]
    
    const recipientUsers = allRecipientIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allRecipientIds } },
          select: { id: true, displayName: true, email: true },
        })
      : []
    
    const recipientMap = new Map(recipientUsers.map(u => [u.id, u]))
    
    const enrichedSharedByMe = Array.from(sharedByMeMap.entries()).map(([key, { bookmark, recipientIds }]) => {
      const enriched = enrichBookmark(bookmark) as SharedBookmarkRaw & { saviezFact?: SaviezVousFact | null; wikiImage?: CachedWikipediaImage | null; wikiMediaImage?: CachedWikiLovesImage | null; wikiLovesImage?: CachedWikiLovesImage | null; proverbe?: { id: string; text: string; signification: string; source: string; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }; citation?: CachedCitationArticle | null; apodImage?: { id: string; date: string; title: string; explanation: string; titleFr?: string | null; explanationFr?: string | null; imageUrl: string; hdImageUrl: string | null; copyright: string | null; apodUrl: string } | null; idea?: any }
      return { 
        ...enriched, 
        sharedWithUsers: recipientIds.map(id => recipientMap.get(id)).filter(Boolean) as Array<{ id: string; displayName: string | null; email: string }>
      }
    })
    
    // Ensure all sharedByMe bookmarks have sharedWithUsers field
    const finalSharedByMe = enrichedSharedByMe.map(bookmark => ({
      ...bookmark,
      sharedWithUsers: bookmark.sharedWithUsers || [],
      formattedCreatedAt: bookmark.createdAt.toLocaleDateString(locale),
    }))

    const suggestionsWithFormattedDates = suggestions.map(s => ({
      ...s,
      formattedCreatedAt: s.createdAt.toLocaleDateString(locale),
      formattedUpdatedAt: s.updatedAt.toLocaleDateString(locale),
    }))

    return (
      <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
        <LobbyHeader isLoggedIn={!!session?.user} />

        <LobbyTabs
          suggestions={suggestionsWithFormattedDates}
          sharedBookmarks={enrichedBookmarks}
          sharedWithMeBookmarks={enrichedSharedWithMe}
          sharedByMeBookmarks={finalSharedByMe}
          currentUserId={session?.user?.id ?? null}
          isAdmin={session?.user?.role === 'ADMIN'}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          totalPagesSharedWithMe={Math.max(1, Math.ceil(totalSharedWithMe / PAGE_SIZE))}
          totalPagesSharedByMe={Math.max(1, Math.ceil(totalSharedByMe / PAGE_SIZE))}
          currentPage={page}
          userFavoriteIds={userFavoriteIds}
          locale={locale}
        />
      </div>
    )
  } catch (err: unknown) {
    console.error('[LobbyPage] Error:', err)
    return <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">Error: {err instanceof Error ? err.message : 'Unknown error'}</div>
  }
}
