'use server'

import { proverbeManager } from '@/lib/proverbe-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(proverbeManager)

export const toggleProverbeFavoriteAction = actions.toggle
export const getProverbeFavoritesAction = actions.getFavorites
export const isProverbeFavoriteAction = actions.isBookmarked
