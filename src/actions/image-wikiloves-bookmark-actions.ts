'use server'

import { wikilovesManager } from '@/lib/image-wikiloves-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(wikilovesManager)

export const toggleWikiLovesFavoriteAction = actions.toggle
export const getWikiLovesFavoritesAction = actions.getFavorites
export const isWikiLovesFavoriteAction = actions.isBookmarked
