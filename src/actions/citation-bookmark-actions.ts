'use server'
import { citationManager } from '@/lib/citation-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(citationManager)

export const toggleCitationFavoriteAction = actions.toggle
export const getCitationFavoritesAction = actions.getFavorites
export const isCitationFavoriteAction = actions.isBookmarked
export const isCitationFavoriteBatchAction = actions.isBookmarkedBatch
