'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Bookmark, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/sujets', label: 'Accueil', icon: Home },
  { href: '/favoris', label: 'Favoris', icon: Bookmark },
  { href: '/review', label: 'Révision', icon: BookOpen },
  { href: '/mon-historique', label: 'Historique', icon: Clock },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
