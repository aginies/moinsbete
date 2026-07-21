'use client'

import { useLocale } from 'next-intl'
import { useCallback } from 'react'

export function useSetLocale() {
  const locale = useLocale()

  const setLocale = useCallback(async (newLocale: 'fr' | 'en') => {
    if (newLocale === locale) return
    
    document.cookie = `locale=${newLocale};path=/;max-age=${365*24*60*60};SameSite=Lax`
    
    window.location.reload()
  }, [locale])

  return { setLocale, locale }
}
