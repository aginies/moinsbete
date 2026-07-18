'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createSuggestionAction, updateSuggestionAction } from '@/actions/suggestion-actions'

interface SuggestionFormProps {
  mode?: 'create' | 'edit'
  suggestionId?: string
  initialTitle?: string
  initialDescription?: string
}

export function SuggestionForm({ mode = 'create', suggestionId, initialTitle = '', initialDescription = '' }: SuggestionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Titre requis'); return }
    if (title.trim().length > 100) { setError('Titre max 100 caractères'); return }
    if (!description.trim()) { setError('Description requise'); return }

    startTransition(async () => {
      let result
      if (mode === 'create') {
        result = await createSuggestionAction({ title, description })
      } else if (suggestionId) {
        result = await updateSuggestionAction(suggestionId, { title, description })
      } else {
        result = { error: 'ID de suggestion manquant' }
      }

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success(mode === 'create' ? 'Proposition créée !' : 'Proposition modifiée !')
        router.push('/lobby')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Titre</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: L'histoire de la poste française"
          maxLength={100}
        />
        <p className="mt-1 text-xs text-muted-foreground">{title.length}/100</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez brièvement votre suggestion..."
          maxLength={250}
          rows={4}
        />
        <p className="mt-1 text-xs text-muted-foreground">{description.length}/250</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : mode === 'create' ? 'Créer la suggestion' : 'Enregistrer'}
      </Button>
    </form>
  )
}
