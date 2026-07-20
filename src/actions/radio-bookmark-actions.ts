'use server'

import { radioManager } from '@/lib/radio-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(radioManager)

export const toggleRadioFavoriteAction = actions.toggle
export const getRadioFavoritesAction = actions.getFavorites
export const isRadioFavoriteAction = actions.isBookmarked
