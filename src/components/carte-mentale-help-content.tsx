'use client'

import { useTranslations } from 'next-intl'
import { Brain, ZoomIn, ZoomOut, Move, Sparkles, GitBranch } from 'lucide-react'

export function CarteMentaleHelpContent() {
  const t = useTranslations('help')
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Brain className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium">{t('carte_title')}</p>
          <p className="text-muted-foreground">
            {t('carte_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <ZoomIn className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{t('carte_zoom_title')}</p>
          <p className="text-muted-foreground">
            {t('carte_zoom_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
          <Move className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="font-medium">{t('carte_deplace_title')}</p>
          <p className="text-muted-foreground">
            {t('carte_deplace_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Sparkles className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="font-medium">{t('carte_explorer_title')}</p>
          <p className="text-muted-foreground">
            {t('carte_explorer_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <GitBranch className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="font-medium">{t('carte_connexions_title')}</p>
          <p className="text-muted-foreground">
            {t('carte_connexions_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
