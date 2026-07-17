'use client'

import { RefreshCw } from 'lucide-react'

interface ImageLoadingProps {
  height?: string
  borderColor?: string
  borderDarkColor?: string
  bgColor?: string
  bgDarkColor?: string
  iconColor?: string
  iconDarkColor?: string
}

export function ImageLoading({
  height = 'h-48',
  borderColor = 'border-rose-200',
  borderDarkColor = 'dark:border-rose-800',
  bgColor = 'bg-neutral-100',
  bgDarkColor = 'dark:bg-neutral-800',
  iconColor = 'text-rose-400',
  iconDarkColor = 'dark:text-rose-400',
}: ImageLoadingProps) {
  return (
    <div className={`mb-3 overflow-hidden rounded-lg border ${borderColor} ${borderDarkColor}`}>
      <div className={`${height} flex items-center justify-center ${bgColor} ${bgDarkColor}`}>
        <RefreshCw className={`h-8 w-8 ${iconColor} ${iconDarkColor} animate-spin`} />
      </div>
    </div>
  )
}
