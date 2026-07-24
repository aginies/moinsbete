'use client'

import { MousePointerClick, Share2, Bookmark, Star, Trash2 } from 'lucide-react'

export function FavoritesHelpContent() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Star className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">Ajouter aux favoris</p>
          <p className="text-muted-foreground">
            Cliquez sur l&apos;étoile d&apos;une carte pour sauvegarder un contenu. Il apparaîtra ici.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Bookmark className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">Catégories</p>
          <p className="text-muted-foreground">
            Vos favoris sont organisés par type : Idées, Le saviez-vous ?, Images, Proverbes, Portail Lexical, NEWS et plus.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Share2 className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">Partager depuis les favoris</p>
          <p className="text-muted-foreground">
            Depuis cette page, vous pouvez partager vos favoris avec la communauté (onglet Favoris du Lobby) ou avec des utilisateurs spécifiques.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <Trash2 className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="font-medium">Supprimer</p>
          <p className="text-muted-foreground">
            Cliquez sur la poubelle d&apos;un favori pour le retirer. Il reste dans vos favoris personnels mais n&apos;apparaît plus ici.
          </p>
        </div>
      </div>
    </div>
  )
}
