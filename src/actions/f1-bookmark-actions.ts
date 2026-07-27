'use server'

import { f1Manager } from '@/lib/f1-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(f1Manager)

export const toggleF1FavoriteAction = actions.toggle
export const getF1FavoritesAction = actions.getFavorites
export const isF1FavoriteAction = actions.isBookmarked
export const isF1FavoriteBatchAction = actions.isBookmarkedBatch
