'use server'

import { cnrsManager } from '@/lib/cnrs-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(cnrsManager)

export const toggleCnrsFavoriteAction = actions.toggle
export const getCnrsFavoritesAction = actions.getFavorites
export const isCnrsFavoriteAction = actions.isBookmarked
