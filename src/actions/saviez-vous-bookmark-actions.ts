'use server'

import { saviezVousManager } from '@/lib/saviez-vous-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(saviezVousManager)

export const toggleSaviezVousFavoriteAction = actions.toggle
export const getSaviezVousFavoritesAction = actions.getFavorites
export const isSaviezVousFavoriteAction = actions.isBookmarked
