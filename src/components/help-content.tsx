'use client'

import { useTranslations } from 'next-intl'
import { MousePointerClick, Share2, Bookmark, RefreshCw, EyeOff, Filter } from 'lucide-react'

export function HelpContent() {
  const t = useTranslations('help')
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <MousePointerClick className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{t('page_title')}</p>
          <p className="text-muted-foreground">
            {t('page_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Share2 className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">{t('share_title')}</p>
          <p className="text-muted-foreground">
            {t('share_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Bookmark className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">{t('save_title')}</p>
          <p className="text-muted-foreground">
            {t('save_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
          <Filter className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <p className="font-medium">{t('filter_title')}</p>
          <p className="text-muted-foreground">
            {t('filter_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <RefreshCw className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="font-medium">{t('refresh_title')}</p>
          <p className="text-muted-foreground">
            {t('refresh_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
          <EyeOff className="h-4 w-4 text-rose-500" />
        </div>
        <div>
          <p className="font-medium">{t('hide_title')}</p>
          <p className="text-muted-foreground">
            {t('hide_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
