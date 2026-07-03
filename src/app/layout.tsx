import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import { prisma } from '@/lib/db'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MoinsBête - Apprendre en s\'amusant',
  description: 'Des faits surprenants et des idées pour devenir moins bête tous les jours. Découvrez des faits insolites, des découvertes scientifiques et des anecdotes fascinantes.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [ideaCount, factCount] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.saviezVousFact.count(),
  ])

  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-xs text-muted-foreground">
            <Link href="/a-propos" className="hover:underline">À propos</Link>
            {' · '}
            {ideaCount} idées · {factCount} faits
          </footer>
          <BottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  )
}
