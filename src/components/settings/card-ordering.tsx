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
import { GripVertical, RotateCcw } from 'lucide-react'
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
}: {
  card: { key: string; label: string; icon: string }
  currentOrder: string[]
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

  const cardIndex = currentOrder.indexOf(card.key)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-move select-none hover:bg-muted/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-lg">{card.icon}</span>
      <span className="font-medium flex-1">{cardIndex + 1}. {card.label}</span>
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
        Glissez-déposez les cartes pour changer leur ordre sur la page /sujets
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map(key => {
              const card = CARD_DEFINITIONS.find(c => c.key === key)
              if (!card) return null
              return <SortableCardItem key={card.key} card={card} currentOrder={order} />
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
