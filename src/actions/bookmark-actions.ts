'use server'

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { toggleBookmark } from '@/lib/bookmark'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import { radioManager } from '@/lib/radio-bookmark'
import { cnrsManager } from '@/lib/cnrs-bookmark'
import { newsManager } from '@/lib/news-bookmark'
import { saviezVousManager } from '@/lib/saviez-vous-bookmark'
import { imageDuJourManager } from '@/lib/image-du-jour-bookmark'
import { pixabayManager } from '@/lib/image-pixabay-bookmark'
import { wikimediaManager } from '@/lib/image-wikimedia-bookmark'
import { wikilovesManager } from '@/lib/image-wikiloves-bookmark'
import { portailLexicalManager } from '@/lib/portail-lexical-bookmark'
import { portailWikipediaManager } from '@/lib/portail-wikipedia-bookmark'
import { proverbeManager } from '@/lib/proverbe-bookmark'
import { f1Manager } from '@/lib/f1-bookmark'
import { citationManager } from '@/lib/citation-bookmark'
import { insoliteManager } from '@/lib/insolite-bookmark'

export async function bookmarkAction(ideaId: string, action: 'add' | 'remove') {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    if (action === 'add') {
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId,
        },
      })
    } else {
      await prisma.bookmark.delete({
        where: {
          userId_ideaId: {
            userId: session.user.id,
            ideaId,
          },
        },
      })
    }

    return { success: true }
  } catch {
    return { error: 'Erreur lors de la sauvegarde' }
  }
}

export async function toggleBookmarkAction(ideaId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  const result = await toggleBookmark(session.user.id, ideaId)
  return { success: true, ...result }
}

export async function getSavedIdeas() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { ideas: [] }
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, type: 'IDEA' },
    include: {
      idea: {
        include: {
          ideaTopics: {
            select: { topic: { select: { name: true, slug: true, icon: true, color: true, id: true } } },
          },
          source: { select: { title: true, type: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    ideas: bookmarks.map(b => ({
      ...b.idea!,
      topics: mapIdeaWithTopics(b.idea!),
    })),
    count: bookmarks.length,
  }
}

export async function toggleTopic(topicId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { following: { where: { id: topicId } } },
  })

  if (!user) {
    return { error: 'Utilisateur non trouvé' }
  }

  const isFollowing = user.following.some(t => t.id === topicId)

  if (isFollowing) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        following: {
          disconnect: { id: topicId },
        },
      },
    })
    return { success: true, followed: false }
  } else {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        following: {
          connect: { id: topicId },
        },
      },
    })
    return { success: true, followed: true }
  }
}

export async function getFollowedTopics() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { topics: [] }
  }

  const topics = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { following: true },
  })

  return { topics: topics?.following || [] }
}

// Consolidated source bookmark managers
const radioActions = createBookmarkManagerActions(radioManager)
const cnrsActions = createBookmarkManagerActions(cnrsManager)
const newsActions = createBookmarkManagerActions(newsManager)
const saviezVousActions = createBookmarkManagerActions(saviezVousManager)
const imageDuJourActions = createBookmarkManagerActions(imageDuJourManager)
const pixabayActions = createBookmarkManagerActions(pixabayManager)
const wikimediaActions = createBookmarkManagerActions(wikimediaManager)
const wikilovesActions = createBookmarkManagerActions(wikilovesManager)
const portailLexicalActions = createBookmarkManagerActions(portailLexicalManager)
const portailWikipediaActions = createBookmarkManagerActions(portailWikipediaManager)
const proverbeActions = createBookmarkManagerActions(proverbeManager)
const f1Actions = createBookmarkManagerActions(f1Manager)
const citationActions = createBookmarkManagerActions(citationManager)
const insoliteActions = createBookmarkManagerActions(insoliteManager)

// Radio France
export const toggleRadioFavoriteAction = radioActions.toggle
export const getRadioFavoritesAction = radioActions.getFavorites
export const isRadioFavoriteAction = radioActions.isBookmarked

// CNRS
export const toggleCnrsFavoriteAction = cnrsActions.toggle
export const getCnrsFavoritesAction = cnrsActions.getFavorites
export const isCnrsFavoriteAction = cnrsActions.isBookmarked

// News
export const toggleNewsFavoriteAction = newsActions.toggle
export const getNewsFavoritesAction = newsActions.getFavorites
export const isNewsFavoriteAction = newsActions.isBookmarked
export const isNewsFavoriteBatchAction = newsActions.isBookmarkedBatch

// Saviez-vous
export const toggleSaviezVousFavoriteAction = saviezVousActions.toggle
export const getSaviezVousFavoritesAction = saviezVousActions.getFavorites
export const isSaviezVousFavoriteAction = saviezVousActions.isBookmarked

// Image du jour
export const toggleImageDuJourFavoriteAction = imageDuJourActions.toggle
export const getImageDuJourFavoritesAction = imageDuJourActions.getFavorites
export const isImageDuJourFavoriteAction = imageDuJourActions.isBookmarked

// Pixabay
export const togglePixabayFavoriteAction = pixabayActions.toggle
export const getPixabayFavoritesAction = pixabayActions.getFavorites
export const isPixabayFavoriteAction = pixabayActions.isBookmarked

// Wikimedia
export const toggleWikimediaFavoriteAction = wikimediaActions.toggle
export const getWikimediaFavoritesAction = wikimediaActions.getFavorites
export const isWikimediaFavoriteAction = wikimediaActions.isBookmarked

// Wiki Loves
export const toggleWikiLovesFavoriteAction = wikilovesActions.toggle
export const getWikiLovesFavoritesAction = wikilovesActions.getFavorites
export const isWikiLovesFavoriteAction = wikilovesActions.isBookmarked

// Portail Lexical
export const togglePortailLexicalFavoriteAction = portailLexicalActions.toggle
export const getPortailLexicalFavoritesAction = portailLexicalActions.getFavorites
export const isPortailLexicalFavoriteAction = portailLexicalActions.isBookmarked

// Portail Wikipedia
export const togglePortailWikipediaFavoriteAction = portailWikipediaActions.toggle
export const getPortailWikipediaFavoritesAction = portailWikipediaActions.getFavorites
export const isPortailWikipediaFavoriteAction = portailWikipediaActions.isBookmarked
export const isPortailWikipediaFavoriteBatchAction = portailWikipediaActions.isBookmarkedBatch

// Proverbe
export const toggleProverbeFavoriteAction = proverbeActions.toggle
export const getProverbeFavoritesAction = proverbeActions.getFavorites
export const isProverbeFavoriteAction = proverbeActions.isBookmarked

// F1
export const toggleF1FavoriteAction = f1Actions.toggle
export const getF1FavoritesAction = f1Actions.getFavorites
export const isF1FavoriteAction = f1Actions.isBookmarked
export const isF1FavoriteBatchAction = f1Actions.isBookmarkedBatch

// Citation
export const toggleCitationFavoriteAction = citationActions.toggle
export const getCitationFavoritesAction = citationActions.getFavorites
export const isCitationFavoriteAction = citationActions.isBookmarked
export const isCitationFavoriteBatchAction = citationActions.isBookmarkedBatch

// Insolite
export const toggleInsoliteFavoriteAction = insoliteActions.toggle
export const getInsoliteFavoritesAction = insoliteActions.getFavorites
export const isInsoliteFavoriteAction = insoliteActions.isBookmarked
