'use server'

import { portailWikipediaManager } from '@/lib/portail-wikipedia-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(portailWikipediaManager)

export const togglePortailWikipediaFavoriteAction = actions.toggle
export const getPortailWikipediaFavoritesAction = actions.getFavorites
export const isPortailWikipediaFavoriteAction = actions.isBookmarked
export const isPortailWikipediaFavoriteBatchAction = actions.isBookmarkedBatch
