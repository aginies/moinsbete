'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { EyeOff, RefreshCw, Play, Pause } from 'lucide-react'
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
  enableAutoRefresh?: boolean
  storageKey?: string
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
  enableAutoRefresh = false,
  storageKey = 'card_auto',
}: CardHeaderProps) {
  const [isActive, setIsActive] = React.useState(() => {
    if (!enableAutoRefresh) return false
    const stored = localStorage.getItem(`${storageKey}_auto_active`)
    return stored === 'true'
  })
  const [intervalValue, setIntervalValue] = React.useState(() => {
    if (!enableAutoRefresh) return 10
    const stored = localStorage.getItem(`${storageKey}_auto_interval`)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed)) return parsed
    }
    return 10
  })
  const [timeLeft, setTimeLeft] = React.useState(() => {
    if (!enableAutoRefresh) return 10
    const stored = localStorage.getItem(`${storageKey}_auto_interval`)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed)) return parsed
    }
    return 10
  })
  const initializedRef = useRef(false)
  const justRefreshedRef = useRef(false)

  React.useEffect(() => {
    if (!enableAutoRefresh) return

    if (!initializedRef.current) {
      initializedRef.current = true
    }
  }, [enableAutoRefresh, storageKey])

  React.useEffect(() => {
    if (!enableAutoRefresh || !isActive || loading || !onRefresh) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [enableAutoRefresh, isActive, loading, onRefresh])

  React.useEffect(() => {
    if (!enableAutoRefresh || !isActive || loading || !onRefresh) return

    if (timeLeft <= 0) {
      if (!justRefreshedRef.current) {
        onRefresh()
        justRefreshedRef.current = true
      } else {
        setTimeLeft(intervalValue)
        justRefreshedRef.current = false
      }
    }
  }, [timeLeft, enableAutoRefresh, isActive, intervalValue, loading, onRefresh])

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
      <div className="flex items-center gap-1 sm:gap-2">
        {enableAutoRefresh && onRefresh && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsActive(prev => {
                  const next = !prev
                  localStorage.setItem(`${storageKey}_auto_active`, String(next))
                  return next
                })
              }}
              className={`${titleColor} hover:bg-current/10 transition-colors flex items-center`}
              title={isActive ? 'Pause' : 'Lecture'}
            >
              {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            </button>
            <div className="flex items-center">
              <select
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setIntervalValue(val)
                  setTimeLeft(val)
                  localStorage.setItem(`${storageKey}_auto_interval`, String(val))
                }}
                value={intervalValue}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 select-none border-none outline-none appearance-none"
                style={{ color: 'inherit' }}
              >
                <option value={5} className="text-black dark:text-white dark:bg-neutral-800">5s</option>
                <option value={10} className="text-black dark:text-white dark:bg-neutral-800">10s</option>
                <option value={15} className="text-black dark:text-white dark:bg-neutral-800">15s</option>
                <option value={30} className="text-black dark:text-white dark:bg-neutral-800">30s</option>
                <option value={60} className="text-black dark:text-white dark:bg-neutral-800">60s</option>
              </select>
            </div>
            {isActive && !loading && (
              <span className="text-[10px] opacity-70 font-mono select-none w-4 text-center">
                {timeLeft}
              </span>
            )}
          </div>
        )}
        {showToggle && onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className={`${titleColor} ${titleDarkColor} hover:bg-current/10 transition-colors`}
            title="Masquer la carte"
          >
            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        {showRefresh && onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRefresh()
              setTimeLeft(intervalValue)
            }}
            className={`${titleColor} ${titleDarkColor} hover:bg-current/10 transition-colors cursor-pointer`}
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
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
