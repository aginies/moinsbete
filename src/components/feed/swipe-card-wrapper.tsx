'use client'

import React from 'react'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { SwipeBackgroundCard } from './swipe-background-card'
import type { CardColorName } from '@/lib/card-theme'

type SwipeGesture = ReturnType<typeof useSwipeGesture>

interface SwipeCardWrapperProps {
  gesture: SwipeGesture
  swipeable: boolean
  cardContent: React.ReactNode
  background?: {
    title: string
    icon: React.ReactNode
    color: CardColorName
    children: React.ReactNode
  }
}

export function SwipeCardWrapper({ gesture, swipeable, cardContent, background }: SwipeCardWrapperProps) {
  if (!swipeable) {
    return <>{cardContent}</>
  }

  const { bind, containerRef, swipeStyle, isDragging, prefersReducedMotion, prevHintOpacity, nextHintOpacity } = gesture

  return (
    <div className="relative touch-pan-y w-full" ref={containerRef} {...bind()}>
      {prevHintOpacity > 0 && (
        <div
          className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-green-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
          style={{ opacity: prevHintOpacity }}
        >
          ← Précédent
        </div>
      )}

      {nextHintOpacity > 0 && (
        <div
          className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-blue-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
          style={{ opacity: nextHintOpacity }}
        >
          Suivant →
        </div>
      )}

      {background && (
        <SwipeBackgroundCard title={background.title} icon={background.icon} color={background.color}>
          {background.children}
        </SwipeBackgroundCard>
      )}

      <div
        className={`w-full relative z-10 ${isDragging || prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'}`}
        style={swipeStyle}
      >
        {cardContent}
      </div>
    </div>
  )
}
