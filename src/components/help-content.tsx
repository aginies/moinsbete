'use client'

import { MousePointerClick, Share2, Bookmark, RefreshCw, EyeOff, Filter } from 'lucide-react'

export function HelpContent() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <MousePointerClick className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">Page dédiée</p>
          <p className="text-muted-foreground">
            Cliquez sur le titre d'une carte pour voir tous les détails.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Share2 className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">Partager</p>
          <p className="text-muted-foreground">
            Copiez le lien ou partagez avec d'autres utilisateurs via le Lobby.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Bookmark className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">Sauvegarder</p>
          <p className="text-muted-foreground">
            Ajoutez une carte à vos favoris pour la retrouver plus tard.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
          <Filter className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <p className="font-medium">Filtrer</p>
          <p className="text-muted-foreground">
            Affiche ou masque les filtres de catégorie disponibles pour cette carte.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <RefreshCw className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="font-medium">Rafraîchir</p>
          <p className="text-muted-foreground">
            Actualisez le contenu d'une carte pour voir les nouveautés.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
          <EyeOff className="h-4 w-4 text-rose-500" />
        </div>
        <div>
          <p className="font-medium">Masquer</p>
          <p className="text-muted-foreground">
            Cachez une carte que vous ne souhaitez plus voir.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Share2 className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">Le Lobby</p>
          <p className="text-muted-foreground">
            Espace communautaire avec 4 onglets : Favoris (favoris partagés par la communauté), Avec vous (contenus partagés avec vous), j'ai partagé (contenus que vous avez partagés à des utilisateurs spécifiques), et Discuter (forum pour suggérer des idées d&apos;amélioration).
          </p>
        </div>
      </div>
    </div>
  )
}
