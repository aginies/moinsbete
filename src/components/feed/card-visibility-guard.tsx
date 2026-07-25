'use client'

import { useEffect, useState } from 'react'
import { VisibilityButton } from './visibility-button'

interface CardVisibilityGuardProps {
  isVisible?: boolean
  onToggle?: () => void
  showToggle?: boolean
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald' | 'indigo'
  label: string
  children: React.ReactNode
}

export function CardVisibilityGuard({
  isVisible = true,
  onToggle,
  showToggle = true,
  buttonColor,
  label,
  children,
}: CardVisibilityGuardProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{children}</>
  }

  if (!isVisible && showToggle) {
    return <VisibilityButton color={buttonColor} label={label} onClick={onToggle || (() => {})} />
  }

  return <>{children}</>
}
