'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>
}

function Tooltip({
  children,
  content,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <TooltipPrimitive.Root delayDuration={300} {...props}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={8}
          side={props.side || 'top'}
          align={props.align || 'center'}
          className="z-50 animate-in fade-in-0 slide-in-from-bottom-2 rounded-md bg-black px-3 py-1.5 text-xs text-white shadow-md"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-black" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
