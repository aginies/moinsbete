'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markSplashSeen } from '@/actions/user-actions'
import { HelpContent } from './help-content'

interface SplashProps {
  userId: string
}

export function Splash({ userId }: SplashProps) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('splash_hidden')
    if (stored !== userId) {
      setShow(true)
    }
  }, [userId])

  const handleDismiss = async () => {
    if (loading) return
    setLoading(true)
    localStorage.setItem('splash_hidden', userId)
    await markSplashSeen().catch(() => {})
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-4 text-lg font-heading font-bold">Bienvenue sur MoinsBête</h2>

        <HelpContent />

        <Button className="mt-6 w-full" onClick={handleDismiss} disabled={loading}>
          {loading ? '...' : 'Fermer'}
        </Button>
      </div>
    </div>
  )
}
