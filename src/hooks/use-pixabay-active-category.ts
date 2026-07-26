import { useState, useCallback, useEffect, useRef } from 'react'
import { getCsrfToken } from 'next-auth/react'

const DB_FIELD = 'imagePixabayActiveCategory'

export function usePixabayActiveCategory(userId?: string) {
  const [activeCategory, setActiveCategory] = useState<string>('bird')
  const csrfTokenRef = useRef<string>('')

  useEffect(() => {
    const loadCsrf = async () => {
      const token = await getCsrfToken()
      if (token) csrfTokenRef.current = token
    }
    loadCsrf()
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/user-card-visibility?field=${DB_FIELD}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data[DB_FIELD]) {
            setActiveCategory(data[DB_FIELD])
          }
        }
      } catch {
        // Keep default 'bird'
      }
    }

    fetchCategory()
  }, [userId])

  const handleCategoryChange = useCallback(async (categoryId: string) => {
    setActiveCategory(categoryId)
    if (userId) {
      try {
        const token = csrfTokenRef.current
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) {
          headers['X-CSRF-Token'] = token
        }
        await fetch('/api/user-card-visibility', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({ field: DB_FIELD, value: categoryId }),
        })
      } catch {
        // Silently fail
      }
    }
  }, [userId])

  return { activeCategory, handleCategoryChange }
}
