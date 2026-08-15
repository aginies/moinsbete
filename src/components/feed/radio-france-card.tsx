'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Lightbulb, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useItemShare } from './use-item-share'
import { ShareButton } from './share-button'
import { sanitizeUrl } from '@/lib/utils'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { toggleRadioFavoriteAction, isRadioFavoriteAction } from '@/actions/bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { useTranslations } from 'next-intl'

interface RadioFranceDoc {
  id: string
  title: string
  description: string
  url: string
  radio: string
  section: string
  image?: string
}

interface RadioFranceCardProps {
  initialDoc?: RadioFranceDoc
  onToggle?: () => void
  isVisible?: boolean
}

async function fetchRandomDoc(excludeId?: string): Promise<RadioFranceDoc | null> {
  try {
    const params = excludeId ? `?exclude=${excludeId}` : ''
    const res = await fetch(`/api/radio-france${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

function RadioFranceCardInner({ initialDoc, onToggle, isVisible }: RadioFranceCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('purple')
  const [doc, setDoc] = useState<RadioFranceDoc | null>(() => {
    if (typeof sessionStorage === 'undefined') return initialDoc || null
    const saved = sessionStorage.getItem('radio_france_doc')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return initialDoc || null
  })
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (isVisible === false) return
    if (!doc && !loading) {
      const timer = setTimeout(() => {
        setLoading(true)
        fetchRandomDoc().then(d => {
          if (d) {
            setDoc(d)
            sessionStorage.setItem('radio_france_doc', JSON.stringify(d))
          }
          setLoading(false)
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, doc, loading])

  useEffect(() => {
    if (doc) {
      isRadioFavoriteAction(doc.id).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [doc])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const newDoc = await fetchRandomDoc(doc?.id)
    if (newDoc) {
      setDoc(newDoc)
      sessionStorage.setItem('radio_france_doc', JSON.stringify(newDoc))
    }
    setLoading(false)
  }, [loading, doc])

  useAutoRefresh('radioFrance', handleRefresh)

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: doc?.id,
    guard: () => !doc,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      await toggleRadioFavoriteAction(doc!.id, action, {
        title: doc!.title,
        description: doc!.description,
        url: doc!.url,
        radio: doc!.radio,
        section: doc!.section,
        image: doc!.image,
        favoritedAt: action === 'add' ? new Date().toISOString() : undefined,
      })
    },
  })

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: doc?.url ?? '',
    title: doc?.title ?? '',
    text: doc ? `${doc.description}\n\n${doc.radio} · ${doc.section}` : '',
  })

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={true}
      buttonColor="purple"
      label="Afficher Docs Radio France"
    >
      <div className="mb-4 sm:mb-6">
        <CardShell color="purple">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={'flex h-8 w-8 items-center justify-center rounded-full ' + c.iconBg + ' ' + c.iconBgDark}>
                <Lightbulb className={'h-4 w-4 sm:h-5 sm:w-5 ' + c.iconForeground} />
              </div>
              <h3 className={'text-sm font-bold uppercase tracking-wide ' + c.title + ' ' + c.titleDark}>
                {t('radio_docs')}
              </h3>
            </div>
            <div className="flex items-center gap-6">
               <button
                onClick={onToggle || (() => {})}
                className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
               title={t('hide_card')}
               aria-label={t('hide_card')}
             >
               <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
             </button>
             <button
               onClick={handleRefresh}
               title={t('change_documentary')}
               aria-label={t('change_documentary')}
             >
               <RefreshCw className={'h-4 w-4 sm:h-5 sm:w-5 ' + c.action + ' ' + c.actionDark + ' ' + (loading ? 'animate-spin' : '')} />
             </button>
           {isLoggedIn && (
              <button
                onClick={handleBookmark}
                disabled={isPending}
                className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors disabled:opacity-50'}
                title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
              >
                <Bookmark className={'h-4 w-4 sm:h-5 sm:w-5 ' + (isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark)} />
              </button>
            )}
             <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
            </div>
          </div>

          {doc && (
            <>
              {doc.image && (
                <div className={'mb-3 overflow-hidden rounded-lg border ' + c.imageBorder + ' ' + c.imageBorderDark}>
                  <img
                    src={sanitizeUrl(doc.image, '')}
                    alt={doc.title}
                    loading="lazy"
                    className="w-full h-96 object-cover transition-opacity hover:opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              <p className={'text-sm font-semibold ' + c.bodyBold + ' ' + c.bodyBoldDark + ' mb-2'}>
                {doc.title}
              </p>

              <div className="mb-3">
                <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark}>
                  {doc.radio}
                </span>
                <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' ml-2'}>
                  {doc.section}
                </span>
              </div>

              <p className={'text-sm leading-relaxed ' + c.body + ' ' + c.bodyDark + ' mb-3'}>
                {doc.description}
              </p>

              <Link
                href={sanitizeUrl(doc.url)}
                target="_blank"
                rel="noopener noreferrer"
                className={'inline-flex items-center gap-1 text-xs ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
              >
                {t('listen_on_radio')}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}
        </CardShell>
      </div>
    </CardVisibilityGuard>
  )
}
export const RadioFranceCard = React.memo(RadioFranceCardInner)
