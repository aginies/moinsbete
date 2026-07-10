'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
              <h2 className="mb-2 text-lg font-semibold">Email envoyé</h2>
              <p className="mb-2 text-sm text-muted-foreground">
                Un lien de réinitialisation a été envoyé à votre adresse email.
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Le lien expire dans 1 heure. Vérifiez votre boîte de réception et vos spams.
              </p>
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setSuccess(false)
                setError('')
              }}
            >
              Réessayer avec un autre email
            </Button>
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
