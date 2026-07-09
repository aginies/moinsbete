export function getStoredFavorites<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function removeStoredFavorite<T>(key: string, filter: (item: T) => boolean): T[] {
  const favorites = getStoredFavorites<T>(key).filter((f) => !filter(f))
  localStorage.setItem(key, JSON.stringify(favorites))
  return favorites
}
