'use client'

import { useTranslations } from 'next-intl'
import { Share2, Bookmark, MessageSquare, Users, ListPlus } from 'lucide-react'

export function LobbyHelpContent() {
  const t = useTranslations('help')
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <ListPlus className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{t('tabs_title')}</p>
          <p className="text-muted-foreground">
            {t('tabs_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Bookmark className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">{t('favoris_title')}</p>
          <p className="text-muted-foreground">
            {t('favoris_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Users className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">{t('avec_vous_title')}</p>
          <p className="text-muted-foreground">
            {t('avec_vous_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Share2 className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">{t('jai_partage_title')}</p>
          <p className="text-muted-foreground">
            {t('jai_partage_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="font-medium">{t('discuter_title')}</p>
          <p className="text-muted-foreground">
            {t('discuter_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
