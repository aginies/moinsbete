'use server'

import { portailLexicalManager } from '@/lib/portail-lexical-bookmark'
import { createBookmarkActions } from '@/actions/bookmark-actions-factory'

const actions = createBookmarkActions(portailLexicalManager)

export const togglePortailLexicalFavoriteAction = actions.toggle
export const getPortailLexicalFavoritesAction = actions.getFavorites
export const isPortailLexicalFavoriteAction = actions.isBookmarked
