'use client'

import Link from 'next/link'
import { BookOpen, User, Clock, Bookmark, MessageSquare, Shield, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { SearchButton } from './search-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HelpContent } from '@/components/help-content'
import { LobbyHelpContent } from '@/components/lobby-help-content'
import { FavoritesHelpContent } from '@/components/favorites-help-content'
import { CarteMentaleHelpContent } from '@/components/carte-mentale-help-content'
import { HistoriqueHelpContent } from '@/components/historique-help-content'
import { usePathname } from 'next/navigation'

interface NavbarInnerProps {
  session: {
    user?: {
      id: string
      name?: string | null
      email: string
      role: string
    }
    expires?: string
  } | null
}

export function NavbarInner({ session }: NavbarInnerProps) {
  const pathname = usePathname()
  const isLobby = pathname?.includes('/lobby')
  const isFavoris = pathname?.includes('/favoris')
  const isCarte = pathname?.includes('/carte-mentale')
  const isHistorique = pathname?.includes('/mon-historique')
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/sujets" className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold text-lg">MoinsBête</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {session?.user && <SearchButton />}
            {session?.user && (
              <Link href="/lobby">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  <MessageSquare className="h-4 w-4" />
                  <span className="ml-1">Lobby</span>
                </Button>
              </Link>
            )}
            {session?.user ? (
              <>
                <Link href="/favoris">
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                    <Bookmark className="h-4 w-4" />
                    <span className="ml-1">Favoris</span>
                  </Button>
                </Link>
                <Link href="/mon-historique">
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                    <Clock className="h-4 w-4" />
                    <span className="ml-1">Historique</span>
                  </Button>
                </Link>
                <Link href="/review" className="hidden">
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                    <BookOpen className="h-4 w-4" />
                    <span className="ml-1">Révision</span>
                  </Button>
                </Link>
                <Link href="/mon-compte" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{session.user.name || session.user.email}</span>
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" size="sm">
                     S&apos;inscrire
                  </Button>
                </Link>
              </>
            )}
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <CircleHelp className="h-6 w-6 text-muted-foreground" />
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                  {isHistorique ? 'Aide — Historique' : isCarte ? 'Aide — Carte Mentale' : isFavoris ? 'Aide — Favoris' : isLobby ? 'Aide — Lobby' : 'Aide'}
                </DialogTitle>
                </DialogHeader>
                {isHistorique ? <HistoriqueHelpContent /> : isCarte ? <CarteMentaleHelpContent /> : isFavoris ? <FavoritesHelpContent /> : isLobby ? <LobbyHelpContent /> : <HelpContent />}
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  )
}
