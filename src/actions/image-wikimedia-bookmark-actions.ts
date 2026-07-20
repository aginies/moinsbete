'use server'

import { wikimediaManager } from '@/lib/image-wikimedia-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(wikimediaManager)

export const toggleWikimediaFavoriteAction = actions.toggle
export const getWikimediaFavoritesAction = actions.getFavorites
export const isWikimediaFavoriteAction = actions.isBookmarked
