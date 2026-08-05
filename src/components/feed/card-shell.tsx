'use client'

import type {
  CardColorName,
  CardShape,
  CardBorderStyle,
  CardShadow,
  CardCompact,
} from '@/lib/card-theme'
import {
  getTheme,
  CARD_SHAPES,
  CARD_BORDER_STYLES,
  CARD_SHADOWS,
  CARD_COMPACTIONS,
} from '@/lib/card-theme'

interface CardShellProps {
  color: CardColorName
  padding?: string
  noPadding?: boolean
  shape?: CardShape
  borderStyle?: CardBorderStyle
  shadow?: CardShadow
  compact?: CardCompact
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function CardShell({
  color,
  padding,
  noPadding,
  shape = 'rounded',
  borderStyle = 'solid',
  shadow = 'md',
  compact = 'default',
  children,
  className,
  style,
}: CardShellProps) {
  const theme = getTheme(color)
  const pad = noPadding ? '' : (padding ?? CARD_COMPACTIONS[compact])
  const extra = className || ''
  return (
    <div
      className={`
        ${CARD_SHAPES[shape]}
        ${CARD_BORDER_STYLES[borderStyle]}
        ${theme.shellBorder}
        ${theme.shellBgGradient}
        ${pad}
        ${theme.shellBorderDark}
        ${theme.shellBgGradientDark}
        ${CARD_SHADOWS[shadow]}
        transition-shadow
        ${extra}
      `}
      style={style}
    >
      {children}
    </div>
  )
}
