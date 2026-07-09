'use client'

import { ImageIcon } from 'lucide-react'

interface ImageHintProps {
  color: 'teal' | 'blue' | 'purple' | 'green' | 'amber'
}

const colorMap: Record<ImageHintProps['color'], { bg: string; darkBg: string; text: string; darkText: string }> = {
  teal: { bg: 'bg-teal-100/80', darkBg: 'dark:bg-teal-900/40', text: 'text-teal-600', darkText: 'dark:text-teal-400' },
  blue: { bg: 'bg-blue-100/80', darkBg: 'dark:bg-blue-900/40', text: 'text-blue-600', darkText: 'dark:text-blue-400' },
  purple: { bg: 'bg-purple-100/80', darkBg: 'dark:bg-purple-900/40', text: 'text-purple-600', darkText: 'dark:text-purple-400' },
  green: { bg: 'bg-green-100/80', darkBg: 'dark:bg-green-900/40', text: 'text-green-600', darkText: 'dark:text-green-400' },
  amber: { bg: 'bg-amber-100/80', darkBg: 'dark:bg-amber-900/40', text: 'text-amber-600', darkText: 'dark:text-amber-400' },
}

export function ImageHint({ color = 'teal' }: ImageHintProps) {
  const c = colorMap[color]
  return (
    <div className={`flex items-center justify-center gap-1 ${c.bg} px-3 py-1.5 ${c.darkBg}`}>
      <ImageIcon className={`h-3.5 w-3.5 ${c.text} ${c.darkText}`} />
      <span className={`text-xs ${c.text} ${c.darkText}`}>Cliquez pour agrandir</span>
    </div>
  )
}
