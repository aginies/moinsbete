'use server'

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { calculateNextReview, getInitialNextReviewAt, type SrsRating } from '@/lib/srs'
import { fetchWordDetails } from '@/lib/portail-lexical'

export interface DueWord {
  id: string
  word: string
  pos: string
  full_pos: string
  ipa: string
  description: string
  portailUrl: string
  bookmark: {
    id: string
    lastReviewAt: Date | null
    nextReviewAt: Date | null
    reviewCount: number
    easeFactor: number
  }
  isBookmarked: true
}

export interface HistoricalWord {
  id: string
  word: string
  date: string
  portailUrl: string
  isBookmarked: false
  hasSRS: false
}

export type LexicalReviewWord = DueWord | HistoricalWord

export interface LexicalReviewResult {
  words: LexicalReviewWord[]
  total: number
  hasMore: boolean
}

export interface WordDefinitions {
  tlfidefinitions: string[]
  wiktionnaireDefinitions: string[]
  etymologie: string
  concordance: Array<{
    name: string
    title: string
    date: string
    left: string
    matching: string
    right: string
  }>
}

export async function fetchDueLexicalWords(page: number = 1, pageSize: number = 10): Promise<{ words: DueWord[]; total: number; hasMore: boolean }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { words: [], total: 0, hasMore: false }
  }

  const now = new Date()
  const skip = (page - 1) * pageSize

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        type: 'PORTAIL_LEXICAL',
        resourceId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
      orderBy: { nextReviewAt: 'asc' },
      skip,
      take: pageSize + 1,
    }),
    prisma.bookmark.count({
      where: {
        userId: session.user.id,
        type: 'PORTAIL_LEXICAL',
        resourceId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
    }),
  ])

  const hasMore = bookmarks.length > pageSize
  const words = bookmarks.slice(0, pageSize).map(b => ({
    id: b.resourceId!,
    word: b.resourceId!,
    pos: (b.meta as any)?.pos || '',
    full_pos: (b.meta as any)?.full_pos || '',
    ipa: (b.meta as any)?.ipa || '',
    description: (b.meta as any)?.description || '',
    portailUrl: `https://www.portail-lexical.fr/definition/${encodeURIComponent(b.resourceId!)}`,
    bookmark: {
      id: b.id,
      lastReviewAt: b.lastReviewAt,
      nextReviewAt: b.nextReviewAt,
      reviewCount: b.reviewCount,
      easeFactor: b.easeFactor,
    },
    isBookmarked: true as const,
  }))

  return { words, total, hasMore }
}

export async function fetchLexicalReviewWords(page: number = 1, pageSize: number = 10): Promise<LexicalReviewResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { words: [], total: 0, hasMore: false }
  }

  const now = new Date()
  const skip = (page - 1) * pageSize

  const [bookmarks, bookmarkTotal, historicalWords] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        type: 'PORTAIL_LEXICAL',
        resourceId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
      orderBy: { nextReviewAt: 'asc' },
      skip,
      take: pageSize + 1,
    }),
    prisma.bookmark.count({
      where: {
        userId: session.user.id,
        type: 'PORTAIL_LEXICAL',
        resourceId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
    }),
    prisma.portailLexicalMotDuJour.findMany({
      orderBy: { date: 'desc' },
      take: pageSize * 3,
      select: { word: true, date: true },
    }),
  ])

  const hasMore = bookmarks.length > pageSize
  const total = bookmarkTotal + historicalWords.length

  const bookmarkedWords = bookmarks.slice(0, pageSize).map(b => ({
    id: b.resourceId!,
    word: b.resourceId!,
    pos: (b.meta as any)?.pos || '',
    full_pos: (b.meta as any)?.full_pos || '',
    ipa: (b.meta as any)?.ipa || '',
    description: (b.meta as any)?.description || '',
    portailUrl: `https://www.portail-lexical.fr/definition/${encodeURIComponent(b.resourceId!)}`,
    bookmark: {
      id: b.id,
      lastReviewAt: b.lastReviewAt,
      nextReviewAt: b.nextReviewAt,
      reviewCount: b.reviewCount,
      easeFactor: b.easeFactor,
    },
    isBookmarked: true as const,
  }))

  const historicalWordSet = new Set(bookmarkedWords.map(w => w.word))
  const historicalWordsList: HistoricalWord[] = historicalWords
    .filter(h => !historicalWordSet.has(h.word))
    .slice(0, pageSize)
    .map(h => ({
      id: h.date,
      word: h.word,
      date: h.date,
      portailUrl: `https://www.portail-lexical.fr/definition/${encodeURIComponent(h.word)}`,
      isBookmarked: false as const,
      hasSRS: false as const,
    }))

  const mixedWords: LexicalReviewWord[] = [
    ...bookmarkedWords,
    ...historicalWordsList,
  ]

  return {
    words: mixedWords,
    total,
    hasMore,
  }
}

export async function recordLexicalReview(bookmarkId: string, rating: SrsRating) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!bookmark) {
      return { error: 'Signet non trouvé' }
    }

    if (bookmark.userId !== session.user.id) {
      return { error: 'Accès non autorisé' }
    }

    const { nextReviewAt, newEaseFactor, newReviewCount } = calculateNextReview(
      bookmark.easeFactor,
      rating,
      bookmark.lastReviewAt,
      bookmark.reviewCount,
    )

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        lastReviewAt: new Date(),
        nextReviewAt,
        reviewCount: newReviewCount,
        easeFactor: newEaseFactor,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[recordLexicalReview] Error:', error)
    return { error: 'Erreur lors de l\'enregistrement' }
  }
}

export async function skipLexicalWord(bookmarkId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!bookmark || bookmark.userId !== session.user.id) {
      return { error: 'Signet non trouvé' }
    }

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        nextReviewAt: getInitialNextReviewAt(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[skipLexicalWord] Error:', error)
    return { error: 'Erreur lors du saut' }
  }
}

export async function removeLexicalFromSrs(bookmarkId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!bookmark || bookmark.userId !== session.user.id) {
      return { error: 'Signet non trouvé' }
    }

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        nextReviewAt: new Date('9999-12-31T00:00:00Z'),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[removeLexicalFromSrs] Error:', error)
    return { error: 'Erreur lors du retrait' }
  }
}

export async function fetchWordDefinitions(word: string): Promise<WordDefinitions | null> {
  try {
    const details = await fetchWordDetails(word)
    if (!details) {
      return null
    }
    return {
      tlfidefinitions: details.tlfidefinitions,
      wiktionnaireDefinitions: details.wiktionnaireDefinitions,
      etymologie: details.etymologie,
      concordance: details.concordance,
    }
  } catch (err) {
    console.error('[fetchWordDefinitions] Fetch error:', err)
    return null
  }
}
