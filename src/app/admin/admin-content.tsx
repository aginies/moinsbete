'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Files, Database, Users, Eye, Bookmark, BookOpen, Radio, Image, ImagePlus, Newspaper, Podcast, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { cleanupExpiredCache } from '@/actions/cleanup-actions'
import { useState } from 'react'

interface AdminStats {
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
}

interface AdminContentProps {
  stats: AdminStats
}

export function AdminContent({ stats }: AdminContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      toast.success('Statistiques actualisées')
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Administration</h1>
          <p className="text-muted-foreground">Gérer les sujets, idées et contenu</p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Retour au site
        </Link>
      </div>

      <Tabs defaultValue="cleanup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cleanup">Nettoyage</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="cleanup">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Trash2 className="h-5 w-5 text-destructive" />
                Cache expiré
              </h3>
              <div className="mb-4 space-y-2 text-sm">
                {stats.cnrsExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-muted-foreground" />
                      Articles CNRS expirés
                    </span>
                    <span className="font-medium text-destructive">{stats.cnrsExpired}</span>
                  </div>
                )}
                {stats.radioExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-muted-foreground" />
                      Épisodes radio expirés
                    </span>
                    <span className="font-medium text-destructive">{stats.radioExpired}</span>
                  </div>
                )}
                {stats.wikiImageExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      Images Wikipédia expirées
                    </span>
                    <span className="font-medium text-destructive">{stats.wikiImageExpired}</span>
                  </div>
                )}
                {stats.wikiLovesExpired > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      Images Wiki Loves expirées
                    </span>
                    <span className="font-medium text-destructive">{stats.wikiLovesExpired}</span>
                  </div>
                )}
                {stats.cnrsExpired === 0 && stats.radioExpired === 0 && stats.wikiImageExpired === 0 && stats.wikiLovesExpired === 0 && (
                  <p className="text-muted-foreground">Aucun élément expiré</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startTransition(async () => {
                    const result = await cleanupExpiredCache()
                    if (result.totalDeleted > 0) {
                      toast.success(`${result.totalDeleted} éléments expirés supprimés`)
                      router.refresh()
                    } else {
                      toast.info('Rien à nettoyer')
                    }
                  })
                }}
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer cache expiré
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Idées publiées"
              value={stats.ideas}
            />
            <StatCard
              icon={<Database className="h-5 w-5" />}
              label="Sujets"
              value={stats.topics}
            />
            <StatCard
              icon={<Files className="h-5 w-5" />}
              label="Sources"
              value={stats.sources}
            />
            <StatCard
              icon={<Bookmark className="h-5 w-5" />}
              label="Signets totaux"
              value={stats.bookmarks}
            />

            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Utilisateurs"
              value={stats.users}
            />
            <StatCard
              icon={<Eye className="h-5 w-5" />}
              label="Idées consultées"
              value={stats.viewedIdeas}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Séries actives"
              value={stats.activeStreaks}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Révisions dues (SRS)"
              value={stats.srsDue}
            />

            <StatCard
              icon={<Newspaper className="h-5 w-5" />}
              label="Articles CNRS"
              value={stats.cnrsArticles}
              sublabel={stats.cnrsExpired > 0 ? `${stats.cnrsExpired} expirés` : undefined}
            />
            <StatCard
              icon={<Radio className="h-5 w-5" />}
              label="Épisodes radio"
              value={stats.radioEpisodes}
              sublabel={stats.radioExpired > 0 ? `${stats.radioExpired} expirés` : undefined}
            />
            <StatCard
              icon={<Image className="h-5 w-5" />}
              label="Images Wikipédia"
              value={stats.wikiImages}
              sublabel={stats.wikiImageExpired > 0 ? `${stats.wikiImageExpired} expirés` : undefined}
            />
            <StatCard
              icon={<ImagePlus className="h-5 w-5" />}
              label="Images Wiki Loves"
              value={stats.wikiLovesImages}
              sublabel={stats.wikiLovesExpired > 0 ? `${stats.wikiLovesExpired} expirés` : undefined}
            />
            <StatCard
              icon={<Podcast className="h-5 w-5" />}
              label="Le saviez-vous ?"
              value={stats.saviezVousFacts}
            />
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
