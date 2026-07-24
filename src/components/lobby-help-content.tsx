'use client'

import { Share2, Bookmark, MessageSquare, Users, ListPlus } from 'lucide-react'

export function LobbyHelpContent() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <ListPlus className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">4 onglets</p>
          <p className="text-muted-foreground">
            Le Lobby a quatre espaces : Favoris, Avec vous, J&apos;ai partagé, et Discuter.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Bookmark className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">Favoris</p>
          <p className="text-muted-foreground">
            Contenu que la communauté a partagé publiquement. Chaque utilisateur peut rendre ses favoris visibles à tous.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Users className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">Avec vous</p>
          <p className="text-muted-foreground">
            Contenu qu&apos;un autre utilisateur a partagé spécifiquement avec vous. Découvrez ce que vos camarades recommandent.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Share2 className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">J&apos;ai partagé</p>
          <p className="text-muted-foreground">
            Tous les contenus que vous avez partagés à des utilisateurs spécifiques. Gérez vos partages depuis ici.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="font-medium">Discuter</p>
          <p className="text-muted-foreground">
            Forum communautaire. Suggérez de nouvelles idées, proposez des améliorations ou discutez avec la communauté.
          </p>
        </div>
      </div>
    </div>
  )
}
