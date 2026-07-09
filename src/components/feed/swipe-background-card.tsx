'use client'

import React from 'react'

interface SwipeBackgroundCardProps {
  title: string
  icon: React.ReactNode
  iconBgColor: string
  iconDarkColor: string
  titleColor: string
  titleDarkColor: string
  borderColor: string
  borderDarkColor: string
  bgGradient: string
  bgGradientDark: string
  textColor: string
  textDarkColor: string
  children: React.ReactNode
}

export function SwipeBackgroundCard({
  title,
  icon,
  iconBgColor,
  iconDarkColor,
  titleColor,
  titleDarkColor,
  borderColor,
  borderDarkColor,
  bgGradient,
  bgGradientDark,
  children,
}: SwipeBackgroundCardProps) {
  return (
    <div className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out z-0">
      <div className={`rounded-xl border-2 ${borderColor} ${bgGradient} p-5 ${borderDarkColor} ${bgGradientDark} h-full opacity-60 overflow-hidden`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgColor} ${iconDarkColor}`}>
              {icon}
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${titleColor} ${titleDarkColor}`}>
              {title}
            </h3>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
