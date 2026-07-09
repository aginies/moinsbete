'use client'

import React from 'react'
import Link from 'next/link'
import { EyeOff, RefreshCw } from 'lucide-react'
import { ShareButton } from './share-button'

interface CardHeaderProps {
  icon: React.ReactNode
  iconBgColor: string
  iconDarkColor: string
  title: string
  titleColor: string
  titleDarkColor: string
  linkHref?: string
  showLink?: boolean
  showToggle?: boolean
  onToggle?: () => void
  showRefresh?: boolean
  loading?: boolean
  onRefresh?: () => void
  shareOptions?: {
    onClick: () => Promise<void>
    copied: boolean
    shareUrl: string
  }
  extraActions?: React.ReactNode
  children?: React.ReactNode
}

export function CardHeader({
  icon,
  iconBgColor,
  iconDarkColor,
  title,
  titleColor,
  titleDarkColor,
  linkHref,
  showLink = true,
  showToggle = true,
  onToggle,
  showRefresh = true,
  loading,
  onRefresh,
  shareOptions,
  extraActions,
  children,
}: CardHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgColor} ${iconDarkColor}`}>
          {icon}
        </div>
        {showLink && linkHref ? (
          <Link href={linkHref} className={`text-sm font-bold uppercase tracking-wide ${titleColor} hover:underline ${titleDarkColor}`}>
            {title}
          </Link>
        ) : (
          <h3 className={`text-sm font-bold uppercase tracking-wide ${titleColor} ${titleDarkColor}`}>
            {title}
          </h3>
        )}
      </div>
      <div className="flex items-center gap-6">
        {showToggle && onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className={`${titleColor} hover:text-teal-800 dark:hover:text-teal-200 transition-colors`}
            title="Masquer la carte"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        )}
        {showRefresh && onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRefresh()
            }}
            className={`${titleColor} hover:text-teal-800 dark:hover:text-teal-200 transition-colors cursor-pointer`}
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {extraActions}
        {shareOptions && (
          <ShareButton onClick={shareOptions.onClick} copied={shareOptions.copied} shareUrl={shareOptions.shareUrl} />
        )}
        {children}
      </div>
    </div>
  )
}
