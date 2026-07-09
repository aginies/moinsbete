import Link from 'next/link'
import { BookOpen, LogOut, User, Clock, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { getSession } from '@/lib/auth'
import { logoutAction } from '@/actions/auth-actions'
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
            {session?.user ? (
              <>
                <Link href="/favoris">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Favoris
                  </Button>
                </Link>
                <Link href="/mon-historique">
                  <Button variant="ghost" size="sm">
                    <Clock className="h-4 w-4 mr-1" />
                    Historique
                  </Button>
                </Link>
                <Link href="/mon-compte" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{session.user.name || session.user.email}</span>
                </Link>
                <form action={async () => {
                  'use server'
                  await logoutAction()
                }}>
                  <Button variant="ghost" size="sm" type="submit">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
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
