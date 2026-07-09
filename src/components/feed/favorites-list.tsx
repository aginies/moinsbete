'use client'

import { useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'

export interface FavoriteItemBase {
  id: string
  favoritedAt: string
}

interface FavoritesListProps<T extends FavoriteItemBase> {
  favorites: T[]
  loading: boolean
  emptyTitle: string
  emptyDescription: string
  storageKey: string
  userId?: string
  removeFavorite: (item: T) => Promise<void>
  renderItem: (item: T, onRemove: () => void) => React.ReactNode
  borderColor?: string
  bgGradient?: string
  darkBorderColor?: string
  darkBgGradient?: string
  textColor?: string
  darkTextColor?: string
  buttonColor?: string
  buttonHoverBg?: string
}

export function FavoritesList<T extends FavoriteItemBase>({
  favorites,
  loading,
  emptyTitle,
  emptyDescription,
  userId,
  removeFavorite,
  renderItem,
  borderColor = 'border-purple-200',
  bgGradient = 'bg-gradient-to-br from-purple-50 to-violet-50',
  darkBorderColor = 'dark:border-purple-800',
  darkBgGradient = 'dark:from-purple-950/20 dark:to-violet-950/20',
  textColor = 'text-purple-900',
  darkTextColor = 'dark:text-purple-100',
  buttonColor = 'text-purple-600',
  buttonHoverBg = 'hover:bg-purple-100',
}: FavoritesListProps<T>) {
  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
        <p className="mb-2 text-lg font-semibold">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="space-y-3">
        {favorites.map((item) => (
          <div
            key={item.id}
            className={`group relative rounded-xl border-2 ${borderColor} ${bgGradient} p-4 ${darkBorderColor} ${darkBgGradient} hover:shadow-md transition-shadow`}
          >
            {renderItem(item, () => removeFavorite(item))}
          </div>
        ))}
      </div>
    </div>
  )
}
