'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface IdeaModalProps {
  node: {
    id: string
    label: string
    color: string
    content?: string
    takeaway?: string
    slug?: string
  }
  onClose: () => void
}

export function IdeaModal({ node, onClose }: IdeaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: node.color }} />
            <h2 className="text-xl font-bold">{node.label}</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {node.content && (
          <div className="mb-4 space-y-2 text-sm text-muted-foreground">
            {node.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        )}

        {node.takeaway && (
          <div className="rounded bg-muted/50 p-3 text-sm">
            <span className="font-medium">Takeaway: </span>
            <span className="text-muted-foreground">{node.takeaway}</span>
          </div>
        )}
      </div>
    </div>
  )
}
