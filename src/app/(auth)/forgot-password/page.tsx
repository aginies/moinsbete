'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      const res = await fetch('/api/auth/reset-password/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(true)
        if (data.resetLink) {
          setResetLink(data.resetLink)
        }
      }
    } catch {
      setError('Erreur lors de l\'envoi')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>

        <div className="mb-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Mot de passe oublié ?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

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
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-card p-6 text-center">
              <div className="mb-3 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold">Token de réinitialisation généré</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Ce lien permet de réinitialiser votre mot de passe. Il expire dans 1 heure.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Lien de réinitialisation :</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-muted px-3 py-2 text-xs font-mono">
                  {resetLink}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="shrink-0 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <a href={resetLink} target="_blank" rel="noopener noreferrer">
              <Button className="w-full">Ouvrir le lien de réinitialisation</Button>
            </a>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Vous vous en souvenez ?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
