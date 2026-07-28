'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Unregister existing service workers in development to prevent caching and routing loops
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => {
            for (const registration of registrations) {
              registration.unregister()
                .then((success) => {
                  if (success) {
                    console.log('SW unregistered successfully in development')
                  }
                })
            }
          })
          .catch((error) => {
            console.error('Failed to unregister SW in development:', error)
          })
        return
      }

      navigator.serviceWorker.register('/sw.js', { type: 'classic' })
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }
  }, [])

  return null
}
