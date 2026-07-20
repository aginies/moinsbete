'use server'

import { pixabayManager } from '@/lib/image-pixabay-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(pixabayManager)

export const togglePixabayFavoriteAction = actions.toggle
export const getPixabayFavoritesAction = actions.getFavorites
export const isPixabayFavoriteAction = actions.isBookmarked
