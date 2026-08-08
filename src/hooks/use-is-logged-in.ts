'use client'

import { useState, useEffect } from 'react'

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    try {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('session='))
      setIsLoggedIn(!!cookie)
    } catch {
      setIsLoggedIn(false)
    }
  }, [])

  return isLoggedIn
}
