'use server'

import { bbcManager } from '@/lib/bbc-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(bbcManager)

export const toggleBbcFavoriteAction = actions.toggle
export const getBbcFavoritesAction = actions.getFavorites
export const isBbcFavoriteAction = actions.isBookmarked
