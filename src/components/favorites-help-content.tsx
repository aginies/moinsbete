'use client'

import { useTranslations } from 'next-intl'
import { MousePointerClick, Share2, Bookmark, Star, Trash2 } from 'lucide-react'

export function FavoritesHelpContent() {
  const t = useTranslations('help')
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Star className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">{t('add_title')}</p>
          <p className="text-muted-foreground">
            {t('add_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Bookmark className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">{t('categories_title')}</p>
          <p className="text-muted-foreground">
            {t('categories_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Share2 className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">{t('share_favorites_title')}</p>
          <p className="text-muted-foreground">
            {t('share_favorites_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <Trash2 className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="font-medium">{t('delete_title')}</p>
          <p className="text-muted-foreground">
            {t('delete_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
