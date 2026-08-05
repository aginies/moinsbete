'use client'

import { Eye } from 'lucide-react'
import { getTheme, type CardColorName } from '@/lib/card-theme'

interface VisibilityButtonProps {
  color: CardColorName
  label: string
  onClick: () => void
}

export function VisibilityButton({ color, label, onClick }: VisibilityButtonProps) {
  const c = getTheme(color)
  const shortLabel = label.replace(/^Afficher\s+/i, '')
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-2 border-dashed ${c.visBorder} ${c.visBg} p-2 ${c.visBorderDark} ${c.visBgDark} ${c.visHoverBorder} ${c.visHoverBg} ${c.visHoverBorderDark} ${c.visHoverBgDark} transition-colors min-h-12 flex items-center justify-center`}
    >
      <div className={`flex items-center justify-center gap-2 text-sm ${c.visText} ${c.visTextDark}`}>
        <Eye className="h-4 w-4" />
        <span>{shortLabel}</span>
      </div>
    </button>
  )
}
