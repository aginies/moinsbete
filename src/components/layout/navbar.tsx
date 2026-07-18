import Link from 'next/link'
import { BookOpen, User, Clock, Bookmark, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { getSession } from '@/lib/auth'
import { SearchButton } from './search-button'

export async function Navbar() {
  const session = await getSession()

  return <NavbarInner session={session} />
}

function NavbarInner({ session }: { session: Awaited<ReturnType<typeof getSession>> }) {
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
            <Link href="/lobby">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <MessageSquare className="h-4 w-4" />
                <span className="ml-1">Lobby</span>
              </Button>
            </Link>
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
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  )
}
