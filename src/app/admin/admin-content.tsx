'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw, Files, Database, Users, Eye, Bookmark, BookOpen, Radio, Image, ImagePlus, Newspaper, Podcast, CheckCircle2, Clock, Trash2, UserCheck, UserX, Quote, Globe, Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { cleanupExpiredCache } from '@/actions/cleanup-actions'
import { clearAllNewsAction } from '@/actions/cleanup-actions'
import { toggleUserEnabled } from '@/actions/user-actions'
import { updateGlobalCardVisibility } from '@/actions/card-actions'
import { useLocale, useTranslations } from 'next-intl'
import { useSetLocale } from '@/hooks/use-set-locale'

export interface AdminStats {
  ideas: number
  topics: number
  sources: number
  bookmarks: number
  users: number
  viewedIdeas: number
  activeStreaks: number
  cnrsArticles: number
  cnrsExpired: number
  radioEpisodes: number
  radioExpired: number
  wikiImages: number
  wikiImageExpired: number
  wikiLovesImages: number
  wikiLovesExpired: number
  saviezVousFacts: number
  srsDue: number
  proverbesCached: number
  newsArticles: number
  newsExpired: number
}

export interface AdminUser {
  id: string
  email: string
  displayName: string | null
  role: string
  enabled: boolean
  createdAt: Date
  lastLogin: Date | null
  lastVisited: Date | null
}

interface AdminContentProps {
  stats: AdminStats
  users: AdminUser[]
}

export function AdminContent({ stats, users }: AdminContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [newsClearOpen, setNewsClearOpen] = useState(false)
  const locale = useLocale()
  const { setLocale } = useSetLocale()
  const t = useTranslations()
  const adminT = useTranslations('admin')
  const feedT = useTranslations('feed')

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      toast.success(adminT('statistics_updated'))
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{adminT('admin_title')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 h-9 dark:bg-zinc-950">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'fr' | 'en')}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="fr" className="dark:bg-zinc-900">FR</option>
              <option value="en" className="dark:bg-zinc-900">EN</option>
            </select>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            {adminT('back_to_site')}
          </Link>
        </div>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">{t('feed.stats')}</TabsTrigger>
          <TabsTrigger value="users">{t('feed.users')}</TabsTrigger>
          <TabsTrigger value="cartes">{adminT('cartes_title')}</TabsTrigger>
          <TabsTrigger value="cleanup">{t('feed.cleanup')}</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              {t('feed.refresh')}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label={t('feed.published_ideas')}
              value={stats.ideas}
            />
            <StatCard
              icon={<Database className="h-5 w-5" />}
              label={t('feed.topics')}
              value={stats.topics}
            />
            <StatCard
              icon={<Files className="h-5 w-5" />}
              label={t('feed.sources')}
              value={stats.sources}
            />
            <StatCard
              icon={<Bookmark className="h-5 w-5" />}
              label={t('feed.total_bookmarks')}
              value={stats.bookmarks}
            />

            <StatCard
              icon={<Users className="h-5 w-5" />}
              label={t('feed.users')}
              value={stats.users}
            />
            <StatCard
              icon={<Eye className="h-5 w-5" />}
              label={t('feed.viewed_ideas')}
              value={stats.viewedIdeas}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label={t('feed.active_streaks')}
              value={stats.activeStreaks}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label={t('feed.srs_due')}
              value={stats.srsDue}
            />

            <StatCard
              icon={<Newspaper className="h-5 w-5" />}
              label={t('feed.cnrs_articles')}
              value={stats.cnrsArticles}
              sublabel={stats.cnrsExpired > 0 ? `${stats.cnrsExpired} ${t('feed.expired')}` : undefined}
            />
            <StatCard
              icon={<Radio className="h-5 w-5" />}
              label={t('feed.radio_episodes')}
              value={stats.radioEpisodes}
              sublabel={stats.radioExpired > 0 ? `${stats.radioExpired} ${t('feed.expired')}` : undefined}
            />
            <StatCard
              icon={<Newspaper className="h-5 w-5" />}
              label={t('feed.news_articles')}
              value={stats.newsArticles}
              sublabel={stats.newsExpired > 0 ? `${stats.newsExpired} ${t('feed.expired')}` : undefined}
            />
            <StatCard
              icon={<Image className="h-5 w-5" />}
              label={t('feed.wiki_images')}
              value={stats.wikiImages}
              sublabel={stats.wikiImageExpired > 0 ? `${stats.wikiImageExpired} ${t('feed.expired')}` : undefined}
            />
            <StatCard
              icon={<ImagePlus className="h-5 w-5" />}
              label={t('feed.wiki_loves_images')}
              value={stats.wikiLovesImages}
              sublabel={stats.wikiLovesExpired > 0 ? `${stats.wikiLovesExpired} ${t('feed.expired')}` : undefined}
            />
            <StatCard
              icon={<Podcast className="h-5 w-5" />}
              label={t('feed.saviez_vous_facts')}
              value={stats.saviezVousFacts}
            />
            <StatCard
              icon={<Quote className="h-5 w-5" />}
              label={t('feed.proverbes')}
              value={stats.proverbesCached}
            />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="rounded-xl border border-border/60 bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.name')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.email')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.role')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.status')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.last_login')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.last_visit')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('feed.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="cartes">
          <CartesTab />
        </TabsContent>

        <TabsContent value="cleanup">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Trash2 className="h-5 w-5 text-destructive" />
                {t('feed.expired_cache', { fallback: 'Expired cache' })}
              </h3>
              <div className="mb-4 space-y-2 text-sm">
                {stats.cnrsExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-muted-foreground" />
                      {t('feed.cnrs_expired')}
                    </span>
                    <span className="font-medium text-destructive">{stats.cnrsExpired}</span>
                  </div>
                )}
                {stats.radioExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-muted-foreground" />
                      {t('feed.radio_expired')}
                    </span>
                    <span className="font-medium text-destructive">{stats.radioExpired}</span>
                  </div>
                )}
                {stats.wikiImageExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      {t('feed.wiki_images_expired')}
                    </span>
                    <span className="font-medium text-destructive">{stats.wikiImageExpired}</span>
                  </div>
                )}
                {stats.wikiLovesExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      {t('feed.wiki_loves_expired')}
                    </span>
                    <span className="font-medium text-destructive">{stats.wikiLovesExpired}</span>
                  </div>
                )}
                {stats.newsExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-muted-foreground" />
                      {t('feed.news_expired')}
                    </span>
                    <span className="font-medium text-destructive">{stats.newsExpired}</span>
                  </div>
                )}
                {stats.cnrsExpired === 0 && stats.radioExpired === 0 && stats.wikiImageExpired === 0 && stats.wikiLovesExpired === 0 && stats.newsExpired === 0 && (
                  <p className="text-muted-foreground">{t('feed.no_expired')}</p>
                )}
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCleanupOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('feed.delete_expired_cache')}
                </Button>
              </div>

              <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirmer le nettoyage</DialogTitle>
                    <DialogDescription>
                      Supprimer {stats.cnrsExpired + stats.radioExpired + stats.wikiImageExpired + stats.wikiLovesExpired + stats.newsExpired} éléments expirés ?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCleanupOpen(false)} disabled={isPending}>
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        setCleanupOpen(false)
                        startTransition(async () => {
                          const result = await cleanupExpiredCache()
                          if (result.totalDeleted > 0) {
                            toast.success(adminT('items_deleted', { count: result.totalDeleted }))
                            router.refresh()
                          } else {
                            toast.info(adminT('nothing_to_clean'))
                          }
                        })
                      }}
                      disabled={isPending}
                    >
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Trash2 className="h-5 w-5 text-destructive" />
                {t('feed.clear_all_news')}
              </h3>
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                    {t('feed.news_articles')}
                  </span>
                  <span className="font-medium text-destructive">{stats.newsArticles}</span>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewsClearOpen(true)}
                  disabled={isPending || stats.newsArticles === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('feed.delete_all')}
                </Button>
              </div>

              <Dialog open={newsClearOpen} onOpenChange={setNewsClearOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                    <DialogDescription>
                      Supprimer tous les {stats.newsArticles} articles NEWS ?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewsClearOpen(false)} disabled={isPending}>
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        setNewsClearOpen(false)
                        startTransition(async () => {
                          const result = await clearAllNewsAction()
                          if (result.success && result.deletedCount > 0) {
                            toast.success(t('feed.news_cleared', { count: result.deletedCount }))
                            router.refresh()
                          } else if (result.error) {
                            toast.error(result.error)
                          }
                        })
                      }}
                      disabled={isPending}
                    >
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: number; sublabel?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sublabel && (
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const adminT = useTranslations('admin')
  const feedT = useTranslations('feed')

  const handleToggle = async () => {
    startTransition(async () => {
      const result = await toggleUserEnabled(user.id, !user.enabled)
      if (result.success) {
        toast.success(user.enabled ? adminT('user_disabled') : adminT('user_enabled'))
        router.refresh()
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <tr className="border-b border-border/40 hover:bg-muted/50">
      <td className="px-4 py-3">{user.displayName || user.email}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          user.role === 'ADMIN'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }`}>
          {user.role === 'ADMIN' ? adminT('admin') : adminT('user')}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          user.enabled
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {user.enabled ? adminT('active') : adminT('disabled')}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {user.lastVisited ? new Date(user.lastVisited).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : '—'}
      </td>
      <td className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className={user.enabled ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
        >
          {user.enabled ? (
            <>
              <UserX className="mr-1 h-3 w-3" />
              {feedT('disable')}
            </>
          ) : (
            <>
              <UserCheck className="mr-1 h-3 w-3" />
              {feedT('enable')}
            </>
          )}
        </Button>
      </td>
    </tr>
  )
}

const cardConfigs: Array<{ key: string; labelKey: string; icon: React.ReactNode }> = [
  { key: 'saviezVous', labelKey: 'feed.saviez_vous_tab', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'wikipedia', labelKey: 'feed.wikipedia_tab', icon: <Globe className="h-4 w-4" /> },
  { key: 'cnrs', labelKey: 'feed.cnrs_tab', icon: <Newspaper className="h-4 w-4" /> },
  { key: 'radioFrance', labelKey: 'feed.radio_tab', icon: <Radio className="h-4 w-4" /> },
  { key: 'news', labelKey: 'feed.news_tab', icon: <Newspaper className="h-4 w-4" /> },
  { key: 'wikimedia', labelKey: 'feed.wikimedia_tab', icon: <Image className="h-4 w-4" /> },
  { key: 'wikiloves', labelKey: 'feed.wiki_loves_tab', icon: <ImagePlus className="h-4 w-4" /> },
  { key: 'pixabay', labelKey: 'feed.pixabay_tab', icon: <Image className="h-4 w-4" /> },
  { key: 'portailLexical', labelKey: 'feed.lexical_tab', icon: <Quote className="h-4 w-4" /> },
  { key: 'proverbe', labelKey: 'feed.proverbe_tab', icon: <Podcast className="h-4 w-4" /> },
]

function CartesTab() {
  const [isPending, startTransition] = useTransition()
  const adminT = useTranslations('admin')

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {adminT('cartes_desc')}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cardConfigs.map(card => (
          <Card key={card.key}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {card.icon}
                </div>
                <span className="text-sm font-medium">{adminT(card.labelKey)}</span>
              </div>
              <CardToggle cardKey={card.key} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CardToggle({ cardKey }: { cardKey: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('admin')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/card-visibility')
        if (res.ok) {
          const data = await res.json()
          setEnabled(data[cardKey] ?? true)
        }
      } catch {
        setEnabled(true)
      }
    }
    load()
  }, [cardKey])

  const handleToggle = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await updateGlobalCardVisibility(cardKey as import('@/actions/card-actions').CardKey, next)
      if (result.success) {
        toast.success(next ? t('feed.enable') : t('feed.disable'))
        router.refresh()
      } else if (result.error) {
        toast.error(result.error)
        setEnabled(!next)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={enabled ? 'text-green-600 hover:text-green-700' : 'text-destructive hover:text-destructive'}
    >
      {enabled ? (
        <>
          <UserCheck className="mr-1 h-3 w-3" />
          {t('feed.card_enabled')}
        </>
      ) : (
        <>
          <UserX className="mr-1 h-3 w-3" />
          {t('feed.card_disabled')}
        </>
      )}
    </Button>
  )
}
