'use client'

import { useState, useTransition } from 'react'
import { Mail, User as UserIcon, Lock, LogOut, Bell, Eye, EyeOff, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { changePasswordAction, logoutAction, toggleEmailNotificationsAction } from '@/actions/auth-actions'
import type { Session } from 'next-auth'
import { useTranslations } from 'next-intl'
import { CardOrdering } from '@/components/settings/card-ordering'

interface SessionWithNotifs extends Session {
  emailNotificationsEnabled?: boolean
  cardNavBarEnabled?: boolean
}

export default function MonCompteClient({ session }: { session: SessionWithNotifs }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(session.emailNotificationsEnabled ?? true)
  const [cardNavBarEnabled, setCardNavBarEnabled] = useState(session.cardNavBarEnabled ?? true)
  const t = useTranslations('feed')

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
        e.currentTarget.reset()
      }
    })
  }

  async function handleLogout() {
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        await logoutAction()
      localStorage.removeItem('session_logged_in')
      } catch {
        // ignore
      }
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure'
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      window.location.href = '/login'
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">{t('email_notifications')}</h2>
                <p className="text-sm text-muted-foreground">{t('email_notifications_desc')}</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={async (checked) => {
                setEmailNotifications(checked)
                const result = await toggleEmailNotificationsAction(checked)
                if (result.error) {
                  setEmailNotifications(!checked)
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">{t('card_nav_bar')}</h2>
                <p className="text-sm text-muted-foreground">{t('card_nav_bar_desc')}</p>
              </div>
            </div>
            <Switch
              checked={cardNavBarEnabled}
              onCheckedChange={async (checked) => {
                setCardNavBarEnabled(checked)
                try {
                  await fetch('/api/user-card-visibility', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: 'cardNavBarEnabled', value: checked }),
                  })
                } catch {
                  setCardNavBarEnabled(!checked)
                }
              }}
            />
          </div>
        </div>

        {session.user?.id && <CardOrdering userId={session.user.id} />}

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
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('currentPassword') as HTMLInputElement
                    input.type = input.type === 'password' ? 'text' : 'password'
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </button>
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
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newPassword') as HTMLInputElement
                    input.type = input.type === 'password' ? 'text' : 'password'
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('confirmPassword') as HTMLInputElement
                    input.type = input.type === 'password' ? 'text' : 'password'
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
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
