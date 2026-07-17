'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError() {
  const handleReset = () => window.location.reload()

  return (
    <html lang="fr">
      <body className="bg-cover bg-center bg-no-repeat min-h-screen relative"
        style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Comets_Kick_up_Dust_in_Helix_Nebula_%28PIA09178%29.jpg/1280px-Comets_Kick_up_Dust_in_Helix_Nebula_%28PIA09178%29.jpg")' }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative flex min-h-screen items-start justify-center pt-24 px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h2 className="mb-2 text-2xl font-bold text-white">Une erreur est survenue</h2>
            <p className="mb-6 text-sm text-white/80">
              La page n&apos;a pas pu se charger. Veuillez réessayer.
            </p>
            <Button onClick={handleReset} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
