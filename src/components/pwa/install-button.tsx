'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton({ variant = 'ghost', size = 'sm' }: { variant?: 'ghost' | 'outline' | 'default', size?: 'sm' | 'lg' }) {
  const t = useTranslations('pwa')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('pwa_installed')
    if (stored === 'true') {
      setShowButton(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null)
      setShowButton(false)
      localStorage.setItem('pwa_installed', 'true')
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowButton(false)
      localStorage.setItem('pwa_installed', 'true')
    }
    setDeferredPrompt(null)
  }

  if (!showButton) return null

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className="gap-1"
      aria-label={t('install_app')}
    >
      <Download className="h-4 w-4" />
      <span className="hidden md:inline">{t('install_app')}</span>
    </Button>
  )
}
