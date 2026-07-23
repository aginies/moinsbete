'use server'

import { newsManager } from '@/lib/news-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(newsManager)

export const toggleNewsFavoriteAction = actions.toggle
export const getNewsFavoritesAction = actions.getFavorites
export const isNewsFavoriteAction = actions.isBookmarked
