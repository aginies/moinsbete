'use server'

import { imageDuJourManager } from '@/lib/image-du-jour-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(imageDuJourManager)

export const toggleImageDuJourFavoriteAction = actions.toggle
export const getImageDuJourFavoritesAction = actions.getFavorites
export const isImageDuJourFavoriteAction = actions.isBookmarked
