import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { TopicGrid } from '@/components/topics/topic-grid'
import { TopicForm } from '@/components/admin/topic-form'
import { ReviewQueue } from '@/components/admin/review-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { approveSuggestionAction, rejectSuggestionAction, mergeSuggestionAction } from '@/actions/topic-actions'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-muted-foreground">Non authentifié</p>
          <Link href="/login">
            <Button className="mt-4">Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-muted-foreground">Accès réservé aux administrateurs</p>
        </div>
      </div>
    )
  }
  const topics = await prisma.topic.findMany({
    include: {
      _count: { select: { ideaTopics: true } },
      children: true,
    },
    orderBy: { name: 'asc' },
  })

  const suggestions = await prisma.topicSuggestion.findMany({
    where: { status: 'PENDING' },
    include: {
      parentTopic: true,
    },
    orderBy: { createdAt: 'desc' },
  })

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

      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Sujets</TabsTrigger>
          <TabsTrigger value="review">
            Suggestions
            {suggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <TopicForm topics={topics} topic={null} onSubmit={() => {}} />
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">Tous les sujets</h2>
            <TopicGrid topics={topics} />
          </div>
        </TabsContent>

        <TabsContent value="review">
          <ReviewQueue
            suggestions={suggestions}
            onApprove={approveSuggestionAction}
            onReject={rejectSuggestionAction}
            onMerge={mergeSuggestionAction}
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
      </Tabs>
    </div>
  )
}
