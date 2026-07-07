import { prisma } from '@/lib/db'

import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopicCard } from '@/components/topics/topic-card'

interface TopicWithCount {
  id: string
  name: string
  slug: string
  icon: string
  description?: string | null
  color?: string
  createdAt?: Date
  parentId?: string | null
  _count?: Record<string, number>
}

export default async function MonPlanPage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Mon Plan</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour créer votre plan d&apos;apprentissage personnalisé
          </p>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  const followedTopics = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { following: true },
      })
    : null

  const growthPlan = await prisma.growthPlan.findUnique({
    where: { userId: session.user.id },
  })

  const allTopics = await prisma.topic.findMany({
    where: {
      parentId: null,
    },
    orderBy: { name: 'asc' },
  })

   return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <h1 className="text-2xl font-heading font-bold">Mon Plan d&apos;Apprentissage</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Sujets suivis</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {followedTopics?.following.length || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Série en cours</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {growthPlan?.streakDays || 0} jour{growthPlan?.streakDays !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Vos sujets suivis</h2>
        {followedTopics && followedTopics.following.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {followedTopics.following.map((topic: any) => (
              <TopicCard key={topic.id} topic={topic} isFollowing={true} isAuthenticated={true} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun sujet suivi. Choisissez des sujets ci-dessous !</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Découvrir des sujets</h2>
        {allTopics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {allTopics.map((topic: any) => (
              <TopicCard key={topic.id} topic={topic} isFollowing={false} isAuthenticated={true} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun sujet disponible.</p>
        )}
      </div>

    </div>
  )
}
