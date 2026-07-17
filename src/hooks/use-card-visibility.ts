import { useState, useCallback, useEffect } from 'react'

const COLOR_MAP: Record<string, 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange'> = {
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
  }

const DB_FIELD_MAP: Record<string, string> = {
   wikipedia_image_card_visible: 'wikipediaImageCardVisible',
   saviez_vous_card_visible: 'saviezVousCardVisible',
   radio_france_card_visible: 'radioFranceCardVisible',
   image_wikimedia_card_visible: 'imageWikimediaCardVisible',
   image_wikimedia_show_categories: 'imageWikimediaShowCategories',
   image_pixabay_card_visible: 'imagePixabayCardVisible',
   image_pixabay_show_categories: 'imagePixabayShowCategories',
   cnrs_news_enabled: 'cnrsNewsEnabled',
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
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange'
}

export function useCardVisibility({ storageKey, defaultShow = true, userId }: UseCardVisibilityOptions): UseCardVisibilityReturn {
  const [show, setShow] = useState(defaultShow)
  const [hasMounted, setHasMounted] = useState(false)
  const buttonColor = COLOR_MAP[storageKey] || 'blue'

  useEffect(() => {
    setHasMounted(true)
    
    if (userId) {
      const dbField = DB_FIELD_MAP[storageKey]
      if (dbField) {
        fetch(`/api/user-card-visibility?field=${dbField}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data[dbField] !== undefined) {
              setShow(data[dbField])
            }
          })
          .catch(() => {})
      }
    }
  }, [storageKey, userId])

  const handleToggle = useCallback(async () => {
    setShow(prev => {
      const next = !prev
      if (userId) {
        const dbField = DB_FIELD_MAP[storageKey]
        if (dbField) {
          fetch(`/api/user-card-visibility`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: dbField, value: next }),
          }).catch(() => {})
        }
      }
      return next
    })
  }, [storageKey, userId])

  return { show, hasMounted, handleToggle, buttonColor }
}
