import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StashFru - Apprentissage rapide en français',
  description: 'Remplacez le scroll infini par l\'apprentissage rapide. Découvrez des idées issues de livres, articles et Wikipédia en français.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-xs text-muted-foreground md:hidden">
            <Link href="/a-propos" className="hover:underline">À propos</Link>
          </footer>
          <BottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  )
}
