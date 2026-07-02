'use client'

import { useState, useCallback } from 'react'
import { Feed } from '@/components/feed/feed'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { clearHistoryAction } from '@/actions/view-actions'

interface HistoryPageClientProps {
  initialIdeas: any[]
  initialHasMore: boolean
  initialTotal: number
  userId: string
}

export default function HistoryPageClient({ initialIdeas, initialHasMore, initialTotal, userId }: HistoryPageClientProps) {
  const [clearing, setClearing] = useState(false)

  const handleClearHistory = useCallback(async () => {
    if (!window.confirm('Vider tout l\'historique ?')) {
      return
    }
    setClearing(true)
    try {
      await clearHistoryAction(userId)
      window.location.reload()
    } catch (err) {
      console.error('Error clearing history:', err)
    } finally {
      setClearing(false)
    }
  }, [userId])

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Mon historique</h1>
          <p className="text-sm text-muted-foreground">
            {initialTotal} idées vues
          </p>
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={clearing}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Vider l&apos;historique
          </Button>
      </div>

      <Feed
        initialIdeas={initialIdeas}
        initialHasMore={initialHasMore}
        initialTotal={initialTotal}
        initialPage={1}
        userId={userId}
        isHistory={true}
      />
    </div>
  )
}
