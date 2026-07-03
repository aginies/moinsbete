import { prisma } from '@/lib/db'

import { getSession, authOptions } from '@/lib/auth'
import { Feed } from '@/components/feed/feed'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopicWithCount {
  id: string
  name: string
  slug: string
  icon: string
  _count?: Record<string, number>
}

interface FollowedUser {
  following: TopicWithCount[]
}

interface GrowthPlan {
  streakDays: number | null
}

interface FeedIdea {
  id: string
  [key: string]: unknown
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

  const growthPlan = await prisma.growthPlan.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        include: {
          following: {
            include: { _count: { select: { ideaTopics: true } } },
          },
        },
      },
    },
  })

  const followedTopics = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { following: true },
      })
    : null

  const topicIds = followedTopics?.following.map(t => t.id) || []

  let planIdeas: FeedIdea[] = []

  if (planIdeas.length === 0 && topicIds.length > 0) {
    const topicsRes = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?topic=${topicIds[0]}&page=1&limit=10&userId=${session.user.id}`,
    )
    const { ideas } = await topicsRes.json()
    planIdeas = ideas
  }

  if (planIdeas.length === 0) {
    const feedRes = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?page=1&limit=10&userId=${session.user.id}`,
    )
    const { ideas } = await feedRes.json()
    planIdeas = ideas
  }

  const savedIdeaIds = new Set(planIdeas.map((i) => i.id))

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
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

      {followedTopics && followedTopics.following.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Vos sujets</h2>
          <div className="flex flex-wrap gap-2">
            {followedTopics.following.map((topic: TopicWithCount & { _count?: { ideaTopics: number } }) => (
              <Link
                key={topic.id}
                href={`/sujets/${topic.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm transition-colors hover:border-border"
              >
                <span>{topic.icon}</span>
                <span>{topic.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(topic as any)._count?.ideaTopics || 0})
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {growthPlan ? 'Votre parcours' : 'Idées recommandées'}
        </h2>
        <Feed
          initialIdeas={planIdeas as any}
          initialHasMore={false}
          userId={session.user.id}
          savedIdeaIds={savedIdeaIds}
        />
      </div>
    </div>
  )
}
