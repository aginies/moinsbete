'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoveUp, MoveDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CARD_DEFINITIONS: { key: string; label: string; icon: string }[] = [
  { key: 'saviezVous', label: 'Saviez-vous ?', icon: '💡' },
  { key: 'wikipedia', label: 'Wikipedia', icon: '📖' },
  { key: 'cnrs', label: 'CNRS', icon: '🔬' },
  { key: 'radioFrance', label: 'Radio France', icon: '📻' },
  { key: 'wikimedia', label: 'Wikimedia', icon: '🖼️' },
  { key: 'wikiloves', label: 'Wiki Loves', icon: '🏛️' },
  { key: 'pixabay', label: 'Pixabay', icon: '🎨' },
  { key: 'portailLexical', label: 'Portail Lexical', icon: '📝' },
  { key: 'proverbe', label: 'Proverbe', icon: '🗣️' },
]

const DEFAULT_ORDER = ['saviezVous', 'wikipedia', 'cnrs', 'radioFrance', 'wikimedia', 'wikiloves', 'pixabay', 'portailLexical', 'proverbe']

function SortableCardItem({
  card,
  currentOrder,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  card: { key: string; label: string; icon: string }
  currentOrder: string[]
  index: number
  total: number
  onMoveUp: (key: string) => void
  onMoveDown: (key: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.key,
    data: {
      type: 'card',
      card,
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 sm:px-4 sm:py-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hidden sm:flex">
        <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
      <span className="text-sm sm:text-lg shrink-0">{card.icon}</span>
      <span className="font-medium flex-1 text-sm sm:text-base truncate">{index + 1}. {card.label}</span>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onMoveUp(card.key)}
          disabled={index === 0}
        >
          <MoveUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onMoveDown(card.key)}
          disabled={index === total - 1}
        >
          <MoveDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function CardOrdering({ userId }: { userId?: string }) {
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (userId) {
      fetch('/api/user-card-order', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (Array.isArray(data.order)) {
            setOrder(data.order)
          } else {
            setOrder(DEFAULT_ORDER)
          }
        })
        .catch(() => setOrder(DEFAULT_ORDER))
        .finally(() => setLoading(false))
    } else {
      setOrder(DEFAULT_ORDER)
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    return () => {
      if (saveRef.current) {
        clearTimeout(saveRef.current)
      }
    }
  }, [])

  const saveOrder = useCallback((newOrder: string[]) => {
    if (saveRef.current) {
      clearTimeout(saveRef.current)
    }
    saveRef.current = setTimeout(async () => {
      await fetch('/api/user-card-order', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      }).catch(() => {})
    }, 500)
  }, [])

  const moveItem = useCallback((key: string, direction: 'up' | 'down') => {
    setOrder(prev => {
      const index = prev.indexOf(key)
      if (index === -1) return prev
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const newOrder = arrayMove(prev, index, newIndex)
      saveOrder(newOrder)
      return newOrder
    })
  }, [saveOrder])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrder(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        const newOrder = arrayMove(prev, oldIndex, newIndex)
        saveOrder(newOrder)
        return newOrder
      })
    }
  }, [saveOrder])

  const handleReset = useCallback(() => {
    setOrder(DEFAULT_ORDER)
    saveOrder(DEFAULT_ORDER)
  }, [saveOrder])

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
          Ordre des cartes
        </h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
          Ordre des cartes
        </h2>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Glissez-déposez ou utilisez les fleches pour reordonner
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((key, index) => {
              const card = CARD_DEFINITIONS.find(c => c.key === key)
              if (!card) return null
              return (
                <SortableCardItem
                  key={card.key}
                  card={card}
                  currentOrder={order}
                  index={index}
                  total={order.length}
                  onMoveUp={(k) => moveItem(k, 'up')}
                  onMoveDown={(k) => moveItem(k, 'down')}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
