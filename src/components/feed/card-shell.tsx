'use client'

import type { CardColorName, CardTheme } from '@/lib/card-theme'
import { getTheme } from '@/lib/card-theme'

interface CardShellProps {
  color: CardColorName
  padding?: string
  noPadding?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function CardShell({ color, padding = 'p-3 sm:p-5', noPadding, children, className, style }: CardShellProps) {
  const t: CardTheme = getTheme(color)
  const pad = noPadding ? '' : padding
  const extra = className || ''
  return (
    <div className={`rounded-xl border-2 ${t.shellBorder} ${t.shellBgGradient} ${pad} ${t.shellBorderDark} ${t.shellBgGradientDark} ${t.shellShadow} transition-shadow ${extra}`} style={style}>
      {children}
    </div>
  )
}
