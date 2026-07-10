import { useState, useCallback, useEffect } from 'react'

const COLOR_MAP: Record<string, 'teal' | 'blue' | 'purple' | 'amber'> = {
   wikipedia_image_card_visible: 'teal',
   saviez_vous_card_visible: 'blue',
   cnrs_news_enabled: 'teal',
   radio_france_card_visible: 'purple',
   image_wikimedia_card_visible: 'amber',
 }

interface UseCardVisibilityOptions {
  storageKey: string
  defaultShow?: boolean
}

interface UseCardVisibilityReturn {
  show: boolean
  hasMounted: boolean
  handleToggle: () => void
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber'
}

export function useCardVisibility({ storageKey, defaultShow = true }: UseCardVisibilityOptions): UseCardVisibilityReturn {
  const [show, setShow] = useState(defaultShow)
  const [hasMounted, setHasMounted] = useState(false)
  const buttonColor = COLOR_MAP[storageKey] || 'blue'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(storageKey)
      if (stored !== null) {
        setShow(stored === 'true')
      }
    }
  }, [storageKey])

  const handleToggle = useCallback(() => {
    setShow(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, String(next))
      }
      return next
    })
  }, [storageKey])

  return { show, hasMounted, handleToggle, buttonColor }
}
