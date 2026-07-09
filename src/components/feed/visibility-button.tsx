'use client'

import { Eye } from 'lucide-react'

interface VisibilityButtonProps {
  color: 'teal' | 'blue' | 'purple'
  label: string
  onClick: () => void
}

const colorMap: Record<VisibilityButtonProps['color'], { border: string; bg: string; darkBorder: string; darkBg: string; text: string; darkText: string }> = {
  teal: {
    border: 'border-teal-300',
    bg: 'bg-teal-50/50',
    darkBorder: 'dark:border-teal-800',
    darkBg: 'dark:bg-teal-950/20',
    text: 'text-teal-700',
    darkText: 'dark:text-teal-400',
  },
  blue: {
    border: 'border-blue-300',
    bg: 'bg-blue-50/50',
    darkBorder: 'dark:border-blue-800',
    darkBg: 'dark:bg-blue-950/20',
    text: 'text-blue-700',
    darkText: 'dark:text-blue-400',
  },
  purple: {
    border: 'border-purple-300',
    bg: 'bg-purple-50/50',
    darkBorder: 'dark:border-purple-800',
    darkBg: 'dark:bg-purple-950/20',
    text: 'text-purple-700',
    darkText: 'dark:text-purple-400',
  },
}

export function VisibilityButton({ color, label, onClick }: VisibilityButtonProps) {
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-2 border-dashed ${c.border} ${c.bg} p-4 ${c.darkBorder} ${c.darkBg} hover:border-teal-400 hover:bg-teal-50 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 transition-colors`}
    >
      <div className={`flex items-center justify-center gap-2 text-sm ${c.text} ${c.darkText}`}>
        <Eye className="h-4 w-4" />
        <span>{label}</span>
      </div>
    </button>
  )
}
