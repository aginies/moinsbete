'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { deleteSuggestionAction } from '@/actions/suggestion-actions'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

interface SuggestionItem {
  id: string
  title: string
  description: string
  createdAt: Date
  _count: { comments: number }
  user: { id: string; displayName: string | null; email: string }
}

interface SuggestionListProps {
  suggestions: SuggestionItem[]
  currentUserId: string | null
  isAdmin?: boolean
}

export function SuggestionList({ suggestions, currentUserId, isAdmin = false }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucune suggestion</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((s) => (
        <div key={s.id} className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-2 flex items-start justify-between">
            <Link href={`/lobby/${s.id}`} className="flex-1">
              <h4 className="text-lg font-semibold text-primary hover:underline">{s.title}</h4>
            </Link>
            <div className="flex items-center gap-1">
              {(s.user.id === currentUserId || isAdmin) && (
                <>
                  {s.user.id === currentUserId && (
                    <Link href={`/lobby/${s.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <DeleteConfirmationDialog
                    suggestionTitle={s.title}
                    onConfirm={async () => {
                      const result = await deleteSuggestionAction(s.id)
                      if (result.error) {
                        toast.error(result.error)
                      } else {
                        toast.success('Suggestion supprimée')
                        window.location.reload()
                      }
                    }}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Par {s.user.displayName || s.user.email}</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {s._count.comments}
            </span>
            <span>{s.createdAt.toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
