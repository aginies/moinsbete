'use client'

import { useState, useEffect } from 'react'

const SESSION_CACHE_KEY = 'session_logged_in'
const SESSION_CACHE_TTL = 5 * 60 * 1000

let pendingCheck: Promise<boolean> | null = null

function getCachedSession(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY)
    if (cached) {
      const { value, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < SESSION_CACHE_TTL) {
        return value
      }
    }
  } catch {
    // ignore
  }
  return null
}

async function checkSession(): Promise<boolean> {
  if (pendingCheck) return pendingCheck

  pendingCheck = (async () => {
    try {
      const cached = getCachedSession()
      if (cached !== null) {
        return cached
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

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getCachedSession() ?? false)

  useEffect(() => {
    checkSession().then(setIsLoggedIn)
  }, [])

  return isLoggedIn
}
