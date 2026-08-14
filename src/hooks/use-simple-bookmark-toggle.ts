'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSimpleBookmarkToggleOptions {
  toggleFn: (action: 'add' | 'remove') => Promise<void>
  resourceId: string | null | undefined
  meta?: Record<string, unknown> | null | undefined
  guard?: () => boolean
  initialFavorite?: boolean
  onFavoriteChange?: (fav: boolean) => void
}

const SESSION_CACHE_KEY = 'session_logged_in'
const SESSION_CACHE_TTL = 5 * 60 * 1000

let pendingCheck: Promise<boolean> | null = null

async function checkSession(): Promise<boolean> {
  if (pendingCheck) return pendingCheck

  pendingCheck = (async () => {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY)
      if (cached) {
        const { value, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < SESSION_CACHE_TTL) {
          return value
        }
      }

      const res = await fetch('/api/session')
      const data = await res.json()
      const isLoggedIn = !!data.user

      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({
        value: isLoggedIn,
        timestamp: Date.now(),
      }))

      return isLoggedIn
    } catch {
      return false
    } finally {
      pendingCheck = null
    }
  })()

  return pendingCheck
}

export function useSimpleBookmarkToggle({
  toggleFn,
  resourceId,
  guard,
  initialFavorite = false,
  onFavoriteChange,
}: UseSimpleBookmarkToggleOptions) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isPending, setIsPending] = useState(false)
  const prevInitialRef = useRef(initialFavorite)

  useEffect(() => {
    if (prevInitialRef.current !== initialFavorite) {
      setIsFavorite(initialFavorite)
      prevInitialRef.current = initialFavorite
    }
  }, [initialFavorite])

  const handleBookmark = useCallback(async () => {
    if (!resourceId || guard?.()) return
    const loggedIn = await checkSession()
    if (!loggedIn) return
    const newFavorite = !isFavorite
    setIsPending(true)
    try {
      await toggleFn(newFavorite ? 'add' : 'remove')
      setIsFavorite(newFavorite)
      onFavoriteChange?.(newFavorite)
    } catch {
      setIsFavorite(prev => !prev)
      onFavoriteChange?.(!newFavorite)
    } finally {
      setIsPending(false)
    }
  }, [toggleFn, resourceId, guard, isFavorite, onFavoriteChange])

  return { isFavorite, isPending, handleBookmark, setIsFavorite }
}
