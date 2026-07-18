'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Bookmark, BookOpen, Network, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/sujets', label: 'Accueil', icon: Home },
  { href: '/lobby', label: 'Lobby', icon: MessageSquare },
  { href: '/favoris', label: 'Favoris', icon: Bookmark },
  { href: '/review', label: 'Révision', icon: BookOpen, hidden: true },
  { href: '/carte-mentale', label: 'Carte', icon: Network },
  { href: '/mon-historique', label: 'Historique', icon: Clock },
]

const PROTECTED_PATHS = ['/lobby', '/favoris', '/mon-historique']

export function BottomNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item => {
    if (item.hidden) return false
    if (isLoggedIn) return true
    return !PROTECTED_PATHS.includes(item.href)
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
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
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
