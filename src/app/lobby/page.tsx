import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionList } from '@/components/lobby/suggestion-list'
import { SharedBookmarks } from '@/components/lobby/shared-bookmarks'

export default async function LobbyPage() {
  const session = await getSession()
  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  const sharedBookmarks = await prisma.sharedLobbyBookmark.findMany({
    include: {
      idea: {
        include: {
          ideaTopics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
            },
          },
          source: { select: { title: true, type: true, url: true } },
        },
      },
      user: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lobby</h1>
          <p className="text-sm text-muted-foreground">Proposez des sujets, commentez et partagez des idées</p>
        </div>
        {session?.user && (
          <a href="/lobby/new">
            <span className="text-sm text-primary hover:underline">Proposer un sujet</span>
          </a>
        )}
      </div>

      <Tabs defaultValue="discuter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discuter">Discuter</TabsTrigger>
          <TabsTrigger value="favoris">Favoris partagés</TabsTrigger>
        </TabsList>

        <TabsContent value="discuter">
          <SuggestionList suggestions={suggestions} currentUserId={session?.user?.id ?? null} isAdmin={session?.user?.role === 'ADMIN'} />
        </TabsContent>

        <TabsContent value="favoris">
          <SharedBookmarks sharedBookmarks={sharedBookmarks} currentUserId={session?.user?.id ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
