'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, User as UserIcon, Lock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction, logoutAction } from '@/actions/auth-actions'
import type { Session } from 'next-auth'

export default function MonCompteClient({ session }: { session: Session }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    startTransition(async () => {
      const formData = new FormData(e.currentTarget)
      const result = await changePasswordAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Mot de passe mis à jour avec succès')
      }
    })
  }

  async function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Mon compte</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{session.user?.name || 'Utilisateur'}</h2>
              <p className="text-sm text-muted-foreground">Compte</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{session.user?.email}</p>
              </div>
            </div>

            {session.user?.name && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="text-sm">{session.user?.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Changer le mot de passe
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleLogout} className="flex-1" disabled={isPending}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
