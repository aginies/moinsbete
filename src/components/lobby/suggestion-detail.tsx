'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { addCommentAction, updateSuggestionAction, deleteSuggestionAction } from '@/actions/suggestion-actions'
import { useRouter } from 'next/navigation'
import { MessageSquare, Edit2, Trash2, Save, X, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { parseHTML } from '@/lib/utils'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked = local.length > 2 ? local[0] + '***' : local.slice(0, 1) + '*'
  return `${masked}@${domain}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface PropositionWithComments {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  user: { id: string; displayName: string | null; email: string }
  comments: Array<{
    id: string
    content: string
    createdAt: Date
    updatedAt: Date
    user: { id: string; displayName: string | null; email: string }
  }>
}

interface SuggestionDetailProps {
  suggestion: PropositionWithComments
  currentUserId: string
  isAdmin: boolean
}

export function SuggestionDetail({ suggestion: sug, currentUserId, isAdmin }: SuggestionDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(sug.title)
  const [description, setDescription] = useState(sug.description)
  const [commentText, setCommentText] = useState('')
  const router = useRouter()

  const isOwner = sug.user.id === currentUserId

  const handleSaveEdit = () => {
    if (!title.trim() || !description.trim()) return
    const result = updateSuggestionAction(sug.id, { title, description }).then((res) => {
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Proposition modifiée')
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleCancelEdit = () => {
    setTitle(sug.title)
    setDescription(sug.description)
    setIsEditing(false)
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addCommentAction({ suggestionId: sug.id, content: commentText }).then((res) => {
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Commentaire ajouté')
        setCommentText('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6">
        {isEditing ? (
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-bold"
              placeholder="Titre..."
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              rows={4}
              className="resize-none"
              placeholder="Description..."
            />
            <p className="text-xs text-muted-foreground">{description.length}/250</p>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={!title.trim() || !description.trim()} size="sm">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                <X className="h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <h1 className="text-2xl font-bold">{sug.title}</h1>
              <div className="flex items-center gap-1">
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {(isOwner || isAdmin) && (
                  <DeleteConfirmationDialog
                    suggestionTitle={sug.title}
                    onConfirm={async () => {
                      const result = await deleteSuggestionAction(sug.id)
                      if (result.error) {
                        toast.error(result.error)
                      } else {
                        toast.success('Proposition supprimée')
                        router.push('/lobby')
                      }
                    }}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground" dangerouslySetInnerHTML={{ __html: parseHTML(sug.description) }} />
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Par {sug.user.displayName || maskEmail(sug.user.email)}</span>
              <span>Créée le {formatDate(new Date(sug.createdAt))}</span>
              {sug.updatedAt.getTime() !== sug.createdAt.getTime() && (
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Modifiée le {formatDate(new Date(sug.updatedAt))}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" />
          Commentaires ({sug.comments.length})
        </h2>

        <div className="space-y-4">
          {sug.comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{comment.user.displayName || maskEmail(comment.user.email)}</span>
                <span>·</span>
                <span>{formatDate(new Date(comment.createdAt))}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: parseHTML(comment.content) }} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Votre commentaire..."
            maxLength={250}
            rows={3}
            className="flex-1 resize-none"
          />
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">{commentText.length}/250</span>
            <Button onClick={handleAddComment} disabled={!commentText.trim()} size="sm">
              <MessageSquare className="h-4 w-4" />
              Commenter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
