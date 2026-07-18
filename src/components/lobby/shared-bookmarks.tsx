'use client'

import Link from 'next/link'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { unshareFromLobby } from '@/actions/lobby-share-actions'

interface SharedBookmark {
  id: string
  createdAt: Date
  user: { id: string; displayName: string | null; email: string }
  idea: { id: string; title: string; slug: string; content: string; takeaway: string; source: { title: string; type: string; url: string | null }; ideaTopics: { topic: { id: string; name: string; slug: string; icon: string; color: string } }[] } | null
}

interface SharedBookmarksProps {
  sharedBookmarks: SharedBookmark[]
  currentUserId: string | null
}

export function SharedBookmarks({ sharedBookmarks, currentUserId }: SharedBookmarksProps) {
  const handleUnshare = async (ideaId: string) => {
    const result = await unshareFromLobby(ideaId)
    if (result.success) {
      toast.success('Retiré du lobby')
      window.location.reload()
    } else {
      toast.error(result.error)
    }
  }

  if (sharedBookmarks.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
        <p className="text-muted-foreground">Aucun favori partagé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sharedBookmarks.map((bookmark) => {
        if (!bookmark.idea) return null
        const topics = bookmark.idea.ideaTopics.map((t: { topic: { id: string; name: string; slug: string; icon: string; color: string } }) => t.topic)
        const idea = {
          id: bookmark.idea.id,
          title: bookmark.idea.title,
          slug: bookmark.idea.slug,
          source: { title: bookmark.idea.source.title, type: bookmark.idea.source.type, url: bookmark.idea.source.url },
          topics,
          viewedAt: new Date().toISOString(),
        }

        return (
          <div key={bookmark.id} className="group relative">
            <CompactIdeaCard idea={idea} />
            <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                <User className="h-3 w-3" />
                {bookmark.user.displayName || bookmark.user.email}
              </span>
              {currentUserId === bookmark.user.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => bookmark.idea && handleUnshare(bookmark.idea.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
            </div>
          </div>
        )
      })}
    </div>
  )
}
