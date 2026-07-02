'use client'

import { TopicSuggestion } from '@/generated/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ReviewQueueProps {
  suggestions: (TopicSuggestion & { parentTopic?: { name: string } | null })[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onMerge: (id: string, mergedInto: string) => void
  availableTopics: Array<{ id: string; name: string }>
}

export function ReviewQueue({
  suggestions,
  onApprove,
  onReject,
  onMerge,
  availableTopics,
}: ReviewQueueProps) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucune suggestion en attente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="rounded-xl border border-border/60 bg-card p-5"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-foreground">
                {suggestion.categoryName}
              </h4>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{suggestion.icon}</span>
                <span>{suggestion.articleCount} article{suggestion.articleCount !== 1 ? 's' : ''}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}% confiance
                </Badge>
              </div>
            </div>
          </div>

          {suggestion.parentId && (
            <p className="mb-3 text-sm text-muted-foreground">
              Sujet parent suggéré: {suggestion.parentTopic?.name || 'N/A'}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(suggestion.id)}
            >
              ✓ Créer ce sujet
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(suggestion.id)}
            >
              ✗ Refuser
            </Button>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              onChange={(e) => {
                if (e.target.value) {
                  onMerge(suggestion.id, e.target.value)
                }
              }}
            >
              <option value="">Fusionner avec...</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
