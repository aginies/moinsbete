import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'MoinsBête - Apprendre en s\'amusant',
    description: 'Des faits surprenants et des idées pour devenir moins bête tous les jours. Découvrez des faits insolites, des découvertes scientifiques et des anecdotes fascinantes.',
    other: securityHeaders,
  }
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
          <footer className="py-6 text-center text-xs text-muted-foreground">
            <Link href="/a-propos" className="hover:underline">À propos</Link>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
