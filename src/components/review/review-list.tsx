import { ReviewCard } from './review-card'
import { Button } from '@/components/ui/button'

interface ReviewListProps {
  ideas: any[]
  total: number
  loading: boolean
  currentPage: number
  onPageChange: (page: number) => void
  onIdeaRemoved: (ideaId: string) => void
}

export function ReviewList({ ideas, total, loading, currentPage, onPageChange, onIdeaRemoved }: ReviewListProps) {
  const hasMore = currentPage * 10 < total

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-lg border bg-card p-4"
          >
            <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
            <div className="mb-4 h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">Aucune idée à réviser aujourd&apos;hui</p>
        <p className="mt-2 text-sm text-muted-foreground">Revenez plus tard pour de nouvelles idées</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <ReviewCard
          key={idea.id}
          idea={idea}
          onRemoved={() => onIdeaRemoved(idea.id)}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
          >
             Charger plus d&apos;idées
          </Button>
        </div>
      )}
    </div>
  )
}
