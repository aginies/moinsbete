'use client'

import { Eye } from 'lucide-react'

interface VisibilityButtonProps {
  color: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange'
  label: string
  onClick: () => void
}

const colorMap: Record<VisibilityButtonProps['color'], { border: string; bg: string; darkBorder: string; darkBg: string; text: string; darkText: string; hoverBorder: string; hoverBg: string; darkHoverBorder: string; darkHoverBg: string }> = {
  teal: {
    border: 'border-teal-300',
    bg: 'bg-teal-50/50',
    darkBorder: 'dark:border-teal-800',
    darkBg: 'dark:bg-teal-950/20',
    text: 'text-teal-700',
    darkText: 'dark:text-teal-400',
    hoverBorder: 'hover:border-teal-400',
    hoverBg: 'hover:bg-teal-50',
    darkHoverBorder: 'dark:hover:border-teal-700',
    darkHoverBg: 'dark:hover:bg-teal-950/30',
  },
  blue: {
    border: 'border-blue-300',
    bg: 'bg-blue-50/50',
    darkBorder: 'dark:border-blue-800',
    darkBg: 'dark:bg-blue-950/20',
    text: 'text-blue-700',
    darkText: 'dark:text-blue-400',
    hoverBorder: 'hover:border-blue-400',
    hoverBg: 'hover:bg-blue-50',
    darkHoverBorder: 'dark:hover:border-blue-700',
    darkHoverBg: 'dark:hover:bg-blue-950/30',
  },
  purple: {
    border: 'border-purple-300',
    bg: 'bg-purple-50/50',
    darkBorder: 'dark:border-purple-800',
    darkBg: 'dark:bg-purple-950/20',
    text: 'text-purple-700',
    darkText: 'dark:text-purple-400',
    hoverBorder: 'hover:border-purple-400',
    hoverBg: 'hover:bg-purple-50',
    darkHoverBorder: 'dark:hover:border-purple-700',
    darkHoverBg: 'dark:hover:bg-purple-950/30',
  },
  amber: {
    border: 'border-amber-300',
    bg: 'bg-amber-50/50',
    darkBorder: 'dark:border-amber-800',
    darkBg: 'dark:bg-amber-950/20',
    text: 'text-amber-700',
    darkText: 'dark:text-amber-400',
    hoverBorder: 'hover:border-amber-400',
    hoverBg: 'hover:bg-amber-50',
    darkHoverBorder: 'dark:hover:border-amber-700',
    darkHoverBg: 'dark:hover:bg-amber-950/30',
  },
  green: {
    border: 'border-green-300',
    bg: 'bg-green-50/50',
    darkBorder: 'dark:border-green-800',
    darkBg: 'dark:bg-green-950/20',
    text: 'text-green-700',
    darkText: 'dark:text-green-400',
    hoverBorder: 'hover:border-green-400',
    hoverBg: 'hover:bg-green-50',
    darkHoverBorder: 'dark:hover:border-green-700',
    darkHoverBg: 'dark:hover:bg-green-950/30',
  },
  rose: {
    border: 'border-rose-300',
    bg: 'bg-rose-50/50',
    darkBorder: 'dark:border-rose-800',
    darkBg: 'dark:bg-rose-950/20',
    text: 'text-rose-700',
    darkText: 'dark:text-rose-400',
    hoverBorder: 'hover:border-rose-400',
    hoverBg: 'hover:bg-rose-50',
    darkHoverBorder: 'dark:hover:border-rose-700',
    darkHoverBg: 'dark:hover:bg-rose-950/30',
  },
  orange: {
    border: 'border-orange-300',
    bg: 'bg-orange-50/50',
    darkBorder: 'dark:border-orange-800',
    darkBg: 'dark:bg-orange-950/20',
    text: 'text-orange-700',
    darkText: 'dark:text-orange-400',
    hoverBorder: 'hover:border-orange-400',
    hoverBg: 'hover:bg-orange-50',
    darkHoverBorder: 'dark:hover:border-orange-700',
    darkHoverBg: 'dark:hover:bg-orange-950/30',
  },
}

export function VisibilityButton({ color, label, onClick }: VisibilityButtonProps) {
  const c = colorMap[color]
  const shortLabel = label.replace(/^Afficher\s+/i, '')
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-2 border-dashed ${c.border} ${c.bg} p-2 ${c.darkBorder} ${c.darkBg} ${c.hoverBorder} ${c.hoverBg} ${c.darkHoverBorder} ${c.darkHoverBg} transition-colors min-h-12 flex items-center justify-center`}
    >
      <div className={`flex items-center justify-center gap-2 text-sm ${c.text} ${c.darkText}`}>
        <Eye className="h-4 w-4" />
        <span>{shortLabel}</span>
      </div>
    </button>
  )
}
