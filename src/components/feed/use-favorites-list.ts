'use client'

import { useCallback } from 'react'
import type { BookmarkType } from '@/generated/client'
import {
  toggleRadioFavoriteAction,
  toggleCnrsFavoriteAction,
  toggleNewsFavoriteAction,
  toggleSaviezVousFavoriteAction,
  toggleImageDuJourFavoriteAction,
  togglePixabayFavoriteAction,
  toggleWikimediaFavoriteAction,
  toggleWikiLovesFavoriteAction,
  togglePortailLexicalFavoriteAction,
  togglePortailWikipediaFavoriteAction,
  toggleProverbeFavoriteAction,
  toggleF1FavoriteAction,
  toggleCitationFavoriteAction,
  toggleInsoliteFavoriteAction,
} from '@/actions/bookmark-actions'

const TOGGLE_ACTIONS: Record<string, (docId: string, action?: 'add' | 'remove', meta?: Record<string, unknown>) => Promise<unknown>> = {
  RADIO_FRANCE: toggleRadioFavoriteAction,
  CNRS_NEWS: toggleCnrsFavoriteAction,
  NEWS: toggleNewsFavoriteAction,
  SAVIEZ_VOUS: toggleSaviezVousFavoriteAction,
  IMAGE_DU_JOUR: toggleImageDuJourFavoriteAction,
  IMAGE_PIXABAY: togglePixabayFavoriteAction,
  IMAGE_WIKIMEDIA: toggleWikimediaFavoriteAction,
  IMAGE_WIKILOVES: toggleWikiLovesFavoriteAction,
  PORTAIL_LEXICAL: togglePortailLexicalFavoriteAction,
  PORTAIL_WIKIPEDIA: togglePortailWikipediaFavoriteAction,
  PROVERBE: toggleProverbeFavoriteAction,
  F1: toggleF1FavoriteAction,
  CITATION: toggleCitationFavoriteAction,
  INSOLITE: toggleInsoliteFavoriteAction,
}

interface UseFavoritesListOptions<Doc extends { id: string }> {
  userId?: string
  storageKey: string
  resourceIdGetter: (item: Doc) => string
  bookmarkType: BookmarkType
}

export function useFavoritesList<Doc extends { id: string }>({
  userId,
  storageKey,
  resourceIdGetter,
  bookmarkType,
}: UseFavoritesListOptions<Doc>) {
  const handleRemove = useCallback(async (item: Doc) => {
    if (userId) {
      try {
        const toggleFn = TOGGLE_ACTIONS[bookmarkType]
        if (toggleFn) {
          await toggleFn(resourceIdGetter(item), 'remove')
        }
      } catch {
        // localStorage fallback
      }
    }
  }, [userId, bookmarkType, resourceIdGetter])

  const getFavorites = useCallback(async () => {
    if (userId) {
      return null // caller should fetch from DB via action
    }
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [userId, storageKey])

  return { handleRemove, getFavorites }
}
