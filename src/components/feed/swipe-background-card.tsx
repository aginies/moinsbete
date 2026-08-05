'use client'

import React from 'react'
import { getTheme, type CardColorName } from '@/lib/card-theme'

interface SwipeBackgroundCardProps {
  title: string
  icon: React.ReactNode
  color: CardColorName
  children: React.ReactNode
}

export function SwipeBackgroundCard({
  title,
  icon,
  color,
  children,
}: SwipeBackgroundCardProps) {
  const c = getTheme(color)
  return (
    <div className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out z-0">
      <div className={`rounded-xl border-2 ${c.shellBorder} ${c.shellBgGradient} p-5 ${c.shellBorderDark} ${c.shellBgGradientDark} h-full opacity-60 overflow-hidden`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.iconBg} ${c.iconBgDark}`}>
              {icon}
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${c.title} ${c.titleDark}`}>
              {title}
            </h3>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
