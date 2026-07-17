'use client'

import { useState, useEffect, useCallback } from 'react'
import Script from 'next/script'
import { registerAction, isRegistrationLocked } from '@/actions/auth-actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string, config?: { sitekey?: string; theme?: string }) => string
      reset?: (widgetId: string) => void
      getResponse?: (widgetId: string) => string
    }
  }
}

export default function RegisterPage() {
  const [registrationLocked, setRegistrationLocked] = useState(false)

  useEffect(() => {
    isRegistrationLocked().then(setRegistrationLocked)
  }, [])

  return <RegisterForm registrationLocked={registrationLocked} />
}

function RegisterForm({ registrationLocked }: { registrationLocked: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [widgetId, setWidgetId] = useState<string | null>(null)

  useEffect(() => {
    if (widgetId || typeof window === 'undefined' || !window.turnstile) return
    const id = window.turnstile.render('.cf-turnstile', {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      theme: 'light',
    })
    setWidgetId(id)
  }, [widgetId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let token = turnstileToken
    if (!token && typeof window !== 'undefined' && window.turnstile && widgetId) {
      token = window.turnstile?.getResponse!(widgetId)
    }

    const formData = new FormData(e.currentTarget)
    const result = await registerAction({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      displayName: formData.get('displayName') as string,
      cfToken: token,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Créer un compte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rejoignez MoinsBête et commencez à apprendre
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {registrationLocked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Inscriptions fermées pendant la mise à jour de la base de données.</span>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Compte créé avec succès!</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Votre nom"
                required
                disabled={registrationLocked}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                required
                disabled={registrationLocked}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 8 caractères"
                required
                minLength={8}
                disabled={registrationLocked}
                className="pl-10"
              />
            </div>
          </div>

          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-theme="light"
          />
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />

          <Button type="submit" className="w-full" disabled={loading || registrationLocked}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
