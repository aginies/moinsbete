'use client'

import { ReviewQueue } from '@/components/admin/review-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Topic } from '@/generated/client'
import { SuggestionStatus } from '@/generated/client'

interface AdminContentProps {
  topics: Array<{ id: string } & Topic>
  suggestions: Array<{ id: string; status: SuggestionStatus; categoryName: string; icon: string; articleCount: number; confidence: number; parentId: string | null; createdAt: Date; mergedIntoId: string | null }> & { parentTopic?: { name: string } | null }
  onApprove: (id: string) => Promise<{ success?: boolean; error?: string; topicId?: string }>
  onReject: (id: string) => Promise<{ success?: boolean; error?: string }>
  onMerge: (id: string, mergedInto: string) => Promise<{ success?: boolean; error?: string; mergedInto?: any }>
}

export function AdminContent({ topics, suggestions, onApprove, onReject, onMerge }: AdminContentProps) {
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
        <TabsList className="grid w-full grid-cols-2">
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
      </Tabs>
    </div>
  )
}
