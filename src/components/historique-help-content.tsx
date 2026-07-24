'use client'

import { useTranslations } from 'next-intl'
import { Clock, Search, Trash2, BookOpen } from 'lucide-react'

export function HistoriqueHelpContent() {
  const t = useTranslations('help')
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Clock className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">{t('historique_title')}</p>
          <p className="text-muted-foreground">
            {t('historique_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <Search className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{t('historique_recherche_title')}</p>
          <p className="text-muted-foreground">
            {t('historique_recherche_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <BookOpen className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">{t('historique_revoir_title')}</p>
          <p className="text-muted-foreground">
            {t('historique_revoir_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <Trash2 className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="font-medium">{t('historique_supprimer_title')}</p>
          <p className="text-muted-foreground">
            {t('historique_supprimer_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
