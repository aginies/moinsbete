'use server'

import { insoliteManager } from '@/lib/insolite-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(insoliteManager)

export const toggleInsoliteFavoriteAction = actions.toggle
export const getInsoliteFavoritesAction = actions.getFavorites
export const isInsoliteFavoriteAction = actions.isBookmarked
