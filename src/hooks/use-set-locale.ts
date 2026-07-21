'use client'

import { useLocale } from 'next-intl'
import { useCallback } from 'react'

export function useSetLocale() {
  const locale = useLocale()

  const setLocale = useCallback(async (newLocale: 'fr' | 'en') => {
    if (newLocale === locale) return
    
    document.cookie = `locale=${newLocale};path=/;max-age=${365*24*60*60};SameSite=Lax`
    
    const pathname = window.location.pathname
    let newPathname = pathname

    if (pathname.startsWith('/fr/')) {
      newPathname = pathname.replace(/^\/fr\//, `/${newLocale}/`)
    } else if (pathname.startsWith('/en/')) {
      newPathname = pathname.replace(/^\/en\//, `/${newLocale}/`)
    } else if (pathname === '/fr') {
      newPathname = `/${newLocale}`
    } else if (pathname === '/en') {
      newPathname = `/${newLocale}`
    } else {
      newPathname = `/${newLocale}${pathname}`
    }

    window.location.href = newPathname
  }, [locale])

  return { setLocale, locale }
}
