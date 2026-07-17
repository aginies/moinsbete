import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { TopicGrid } from '@/components/topics/topic-grid'
import { TopicForm } from '@/components/admin/topic-form'
import { ReviewQueue } from '@/components/admin/review-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { approveSuggestionAction, rejectSuggestionAction, mergeSuggestionAction } from '@/actions/topic-actions'

export const revalidate = 3600

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
    <AdminContent
      topics={topics}
      suggestions={suggestions}
      onApprove={approveSuggestionAction}
      onReject={rejectSuggestionAction}
      onMerge={mergeSuggestionAction}
    />
  )
}

import { AdminContent } from './admin-content'
