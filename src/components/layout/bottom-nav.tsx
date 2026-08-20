'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Bookmark, BookOpen, Network, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVisitTracking } from '@/hooks/use-visit-tracking'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'

const navItems = [
  { href: '/sujets', labelKey: 'home', icon: Home },
  { href: '/lobby', labelKey: 'lobby', icon: MessageSquare },
  { href: '/favoris', labelKey: 'favorites', icon: Bookmark },
  { href: '/review', labelKey: 'review', icon: BookOpen, hidden: true },
  { href: '/carte-mentale', labelKey: 'map', icon: Network },
  { href: '/mon-historique', labelKey: 'history', icon: Clock },
]

const PROTECTED_PATHS = ['/lobby', '/favoris', '/mon-historique']

export function BottomNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useVisitTracking()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const lastScrollY = lastScrollYRef.current

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const visibleItems = navItems.filter(item => {
    if (item.hidden) return false
    if (isLoggedIn) return true
    return !PROTECTED_PATHS.includes(item.href)
  })

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden transition-transform duration-300',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      <div className="flex items-center justify-around px-1 py-0">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[10px] transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
