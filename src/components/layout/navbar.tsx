import Link from 'next/link'
import { BookOpen, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/sujets" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-lg">StashFru</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/sujets">
            <Button variant="ghost" size="sm">
              Sujets
            </Button>
          </Link>
          <Link href="/a-propos">
            <Button variant="ghost" size="sm">
              À propos
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
