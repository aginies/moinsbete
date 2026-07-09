import { useState, useRef, useEffect, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDragStart?: () => void
  swipeable?: boolean
  triggerDistance?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetDep?: any
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onDragStart,
  swipeable = true,
  triggerDistance = 100,
  resetDep,
}: UseSwipeGestureOptions) {
  const [dragX, setDragX] = useState(0)
  const [hint, setHint] = useState<'prev' | 'next' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const bind = useGesture(
    {
      onDragStart: () => {
        if (!swipeable) return
        setIsDragging(true)
        if (onDragStart) {
          onDragStart()
        }
        const el = containerRef.current
        if (el) {
          el.style.userSelect = 'none'
          el.style.touchAction = 'pan-y'
        }
        dragStartRef.current = { x: 0, y: 0 }
      },
      onDrag: (state: { first: boolean; movement: [number, number] }) => {
        if (!swipeable) return
        const { first, movement } = state
        if (!first) {
          const [dx] = movement
          setDragX(dx)
          if (dx > 50) setHint('prev')
          else if (dx < -50) setHint('next')
          else setHint(null)
        }
      },
      onDragEnd: (state: { movement: [number, number] }) => {
        if (!swipeable) return
        setIsDragging(false)
        const el = containerRef.current
        if (el) {
          el.style.userSelect = ''
          el.style.touchAction = ''
        }
        dragStartRef.current = null

        const [dx] = state.movement
        if (dx > triggerDistance) {
          if (onSwipeRight) {
            setDragX(500)
            onSwipeRight()
          } else {
            setDragX(0)
            setHint(null)
          }
        } else if (dx < -triggerDistance) {
          if (onSwipeLeft) {
            setDragX(-500)
            onSwipeLeft()
          } else {
            setDragX(0)
            setHint(null)
          }
        } else {
          setDragX(0)
          setHint(null)
        }
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
      }
    }
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDragX(0)
    setHint(null)
  }, [resetDep])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const absX = Math.abs(dragX)
  const rotation = dragX * 0.04
  const scale = 1 - absX * 0.0003

  const swipeStyle = {
    transform: `translateX(${dragX}px) rotate(${rotation}deg) scale(${scale})`,
  }

  const prevHintOpacity = hint === 'prev' ? Math.min(absX / 100, 1) : 0
  const nextHintOpacity = hint === 'next' ? Math.min(absX / 100, 1) : 0

  return {
    bind,
    containerRef,
    dragX,
    setDragX,
    hint,
    setHint,
    swipeStyle,
    isDragging,
    prefersReducedMotion,
    prevHintOpacity,
    nextHintOpacity,
  }
}
