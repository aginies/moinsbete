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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'MoinsBête',
    title: 'MoinsBête - Apprendre en s\'amusant',
    description: 'Des faits surprenants et des idées pour devenir moins bête tous les jours.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@MoinsBete',
    creator: '@MoinsBete',
    title: 'MoinsBête - Apprendre en s\'amusant',
    description: 'Des faits surprenants et des idées pour devenir moins bête tous les jours.',
  },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#372773" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script>
          {(function() {
            var updateThemeColor = function() {
              var isDark = document.documentElement.classList.contains('dark');
              document.querySelector('meta[name="theme-color"]').content = isDark ? '#372773' : '#7C6CF6';
            };
            updateThemeColor();
            var observer = new MutationObserver(updateThemeColor);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          })()}
        </script>
      </head>
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
