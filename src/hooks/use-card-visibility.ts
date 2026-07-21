import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const COLOR_MAP: Record<string, 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald'> = {
  wikipedia_image_card_visible: 'teal',
  saviez_vous_card_visible: 'blue',
  cnrs_news_enabled: 'green',
  radio_france_card_visible: 'purple',
  image_wikimedia_card_visible: 'rose',
  image_wikimedia_show_categories: 'rose',
  image_pixabay_card_visible: 'orange',
  image_pixabay_show_categories: 'orange',
  image_wikiloves_card_visible: 'purple',
  image_wikiloves_show_categories: 'purple',
  portail_lexical_card_visible: 'amber',
  proverbe_card_visible: 'emerald',
}

const DB_FIELD_MAP: Record<string, string> = {
  wikipedia_image_card_visible: 'wikipediaImageCardVisible',
  saviez_vous_card_visible: 'saviezVousCardVisible',
  radio_france_card_visible: 'radioFranceCardVisible',
  image_wikimedia_card_visible: 'imageWikimediaCardVisible',
  image_wikimedia_show_categories: 'imageWikimediaShowCategories',
  image_pixabay_card_visible: 'imagePixabayCardVisible',
  image_pixabay_show_categories: 'imagePixabayShowCategories',
  image_wikiloves_card_visible: 'imageWikiLovesCardVisible',
  image_wikiloves_show_categories: 'imageWikiLovesShowCategories',
  portail_lexical_card_visible: 'portailLexicalCardVisible',
  cnrs_news_enabled: 'cnrsNewsEnabled',
  proverbe_card_visible: 'proverbeCardVisible',
}

interface UseCardVisibilityOptions {
  storageKey: string
  defaultShow?: boolean
  userId?: string
}

interface UseCardVisibilityReturn {
  show: boolean
  hasMounted: boolean
  handleToggle: () => void
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald'
}

export function useCardVisibility({ storageKey, defaultShow = true, userId }: UseCardVisibilityOptions): UseCardVisibilityReturn {
  const [show, setShow] = useState(defaultShow)
  const [hasMounted, setHasMounted] = useState(false)
  const buttonColor = COLOR_MAP[storageKey] || 'blue'
  const router = useRouter()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
    
    if (userId) {
      const dbField = DB_FIELD_MAP[storageKey]
      if (dbField) {
        console.log(`[useCardVisibility] Fetching visibility on mount for: ${dbField}, userId: ${userId}`)
        fetch(`/api/user-card-visibility?field=${dbField}`, { credentials: 'include' })
          .then(res => {
            console.log(`[useCardVisibility] GET Response status for ${dbField}: ${res.status}`)
            return res.json()
          })
          .then(data => {
            console.log(`[useCardVisibility] GET Data for ${dbField}:`, data)
            if (data[dbField] !== undefined) {
              setShow(data[dbField])
            }
          })
          .catch((err) => {
            console.error(`[useCardVisibility] GET Fetch Error for ${dbField}:`, err)
          })
      }
    } else {
      console.log(`[useCardVisibility] No userId on mount for storageKey: ${storageKey}`)
    }
  }, [userId, storageKey])

  const handleToggle = useCallback(async () => {
    setShow(prev => {
      const next = !prev
      if (userId) {
        const dbField = DB_FIELD_MAP[storageKey]
        if (dbField) {
          console.log(`[useCardVisibility] Toggling visibility for ${dbField} to ${next}, userId: ${userId}`)
          import('next-auth/react').then(({ getCsrfToken }) => {
            getCsrfToken().then(token => {
              console.log(`[useCardVisibility] CSRF Token fetched: ${token ? 'Present' : 'Missing'}`)
              const headers: Record<string, string> = { 'Content-Type': 'application/json' }
              if (token) {
                headers['X-CSRF-Token'] = token
              }
              fetch(`/api/user-card-visibility`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({ field: dbField, value: next }),
              })
              .then(res => {
                console.log(`[useCardVisibility] POST Response status for ${dbField}: ${res.status}`)
                if (!res.ok) {
                  return res.text().then(text => {
                    console.error(`[useCardVisibility] POST Error response: ${text}`)
                  })
                }
                router.refresh()
              })
              .catch((err) => {
                console.error(`[useCardVisibility] POST Fetch Error for ${dbField}:`, err)
              })
            })
          })
        }
      }
      return next
    })
  }, [storageKey, userId, router])

  return { show, hasMounted, handleToggle, buttonColor }
}
