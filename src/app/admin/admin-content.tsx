'use client'

import { ReviewQueue } from '@/components/admin/review-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Topic } from '@/generated/client'
import { SuggestionStatus } from '@/generated/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Files, Database, Users, Eye, Bookmark, BookOpen, Radio, Image, ImagePlus, Newspaper, Podcast, CheckCircle2, XCircle, Merge, Clock, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

interface AdminStats {
  ideas: number
  ideasUnpublished: number
  topics: number
  sources: number
  collections: number
  bookmarks: number
  users: number
  viewedIdeas: number
  activeStreaks: number
  pendingSuggestions: number
  approvedSuggestions: number
  rejectedSuggestions: number
  mergedSuggestions: number
  userSuggestions: number
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
  topics: Array<{ id: string } & Topic>
  suggestions: Array<{ id: string; status: SuggestionStatus; categoryName: string; icon: string; articleCount: number; confidence: number; parentId: string | null; createdAt: Date; mergedIntoId: string | null; userId: string | null }> & { parentTopic?: { name: string } | null }
  onApprove: (id: string) => Promise<{ success?: boolean; error?: string; topicId?: string }>
  onReject: (id: string) => Promise<{ success?: boolean; error?: string }>
  onMerge: (id: string, mergedInto: string) => Promise<{ success?: boolean; error?: string; mergedInto?: any }>
  stats: AdminStats
}

export function AdminContent({ topics, suggestions, onApprove, onReject, onMerge, stats }: AdminContentProps) {
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

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">
            Suggestions
            {suggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <ReviewQueue
            suggestions={suggestions}
            onApprove={onApprove}
            onReject={onReject}
            onMerge={onMerge}
            availableTopics={topics}
          />
        </TabsContent>

        <TabsContent value="content">
          <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Gestion du contenu</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Créez des sources et des idées depuis la ligne de commande ou l&apos;API.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
              {`# Ingerer un article Wikipédia
npx tsx scripts/ingest-wikipedia.ts

# Ou créer manuellement:
curl -X POST http://localhost:3000/api/admin/sources \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Article","type":"WIKIPEDIA","url":"..."}'`}
            </pre>
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
              icon={<Files className="h-5 w-5" />}
              label="Idées non publiées"
              value={stats.ideasUnpublished}
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
              icon={<Files className="h-5 w-5" />}
              label="Collections"
              value={stats.collections}
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

            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Suggestions approuvées"
              value={stats.approvedSuggestions}
            />
            <StatCard
              icon={<XCircle className="h-5 w-5" />}
              label="Suggestions rejetées"
              value={stats.rejectedSuggestions}
            />
            <StatCard
              icon={<Merge className="h-5 w-5" />}
              label="Suggestions fusionnées"
              value={stats.mergedSuggestions}
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" />}
              label="Suggestions utilisateurs"
              value={stats.userSuggestions}
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
