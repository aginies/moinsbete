import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { TopicSuggestion } from '@/generated/prisma'
import { ReviewQueue } from '@/components/admin/review-queue'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function handleApprove(id: string) {
  'use server'
  await fetch(`${process.env.NEXTAUTH_URL}/api/admin/suggestions/${id}/approve`, {
    method: 'POST',
  })
}

async function handleReject(id: string) {
  'use server'
  await fetch(`${process.env.NEXTAUTH_URL}/api/admin/suggestions/${id}/reject`, {
    method: 'POST',
  })
}

async function handleMerge(id: string, mergedIntoId: string) {
  'use server'
  await fetch(`${process.env.NEXTAUTH_URL}/api/admin/suggestions/${id}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mergedIntoId }),
  })
}

export default async function AdminReviewPage() {
  const session = await getSession()
  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Suggestions</h1>
          <p className="mt-2 text-muted-foreground">Non authentifié</p>
          <Link href="/login">
            <Button className="mt-4">Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  const suggestions: TopicSuggestion[] = await prisma.topicSuggestion.findMany({
    where: { status: 'PENDING' },
    include: {
      parentTopic: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const topics = await prisma.topic.findMany({
    select: { id: true, name: true },
  })

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Suggestions de sujets</h1>
          <p className="text-muted-foreground">
            Revoyez les suggestions automatiques de nouveaux sujets
          </p>
        </div>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Retour admin
        </Link>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Aucune suggestion en attente 🎉
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Les nouvelles suggestions apparaîtront ici quand du nouveau contenu sera ajouté.
          </p>
        </div>
      ) : (
        <ReviewQueue
          suggestions={suggestions}
          onApprove={handleApprove}
          onReject={handleReject}
          onMerge={handleMerge}
          availableTopics={topics}
        />
      )}
    </div>
  )
}
