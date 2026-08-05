'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Newspaper, ExternalLink, RefreshCw, EyeOff, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { ShareButton } from './share-button'
import { toggleCnrsFavoriteAction, isCnrsFavoriteAction } from '@/actions/cnrs-bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { useTranslations } from 'next-intl'

interface CnrsNewsCardProps {
  onToggle?: () => void
  showToggle?: boolean
  isVisible?: boolean
}

interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

const CATEGORY_COLOR_MAP: Record<string, 'green' | 'purple' | 'blue' | 'amber' | 'teal' | 'indigo' | 'orange' | 'rose'> = {
  'Vivant': 'green',
  'Matière': 'purple',
  'Numérique': 'blue',
  'Sociétés': 'amber',
  'Terre': 'teal',
  'Univers': 'indigo',
  'actualite': 'green',
  'presse': 'blue',
  'lejournal': 'purple',
  'images': 'amber',
  'videos': 'rose',
  'diaporamas': 'teal',
  'bibliotheque': 'orange',
  'Sciences': 'green',
  '': 'green',
}

async function fetchRandomArticle(): Promise<CnrsArticle | null> {
  try {
    const res = await fetch(`/api/cnrs-news?t=${Date.now()}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

function CnrsNewsCardInner({ onToggle, showToggle = true, isVisible }: CnrsNewsCardProps) {
  const t = useTranslations('feed')
  const c = getTheme('green')
  const [article, setArticle] = useState<CnrsArticle | null>(() => {
    if (typeof sessionStorage === 'undefined') return null
    const saved = sessionStorage.getItem('cnrs_article')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const loadArticle = useCallback(async () => {
    setLoading(true)
    setError(false)
    setArticle(null)
    const newArticle = await fetchRandomArticle()
    if (newArticle) {
      setArticle(newArticle)
      sessionStorage.setItem('cnrs_article', JSON.stringify(newArticle))
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
    localStorage.setItem('last_refresh_cnrs', String(Date.now()))
  }, [])

  useAutoRefresh('cnrs', loadArticle)

  useEffect(() => {
    if (isVisible === false) return
    if (!article && !loading && !error) {
      const timer = setTimeout(() => {
        loadArticle()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, article, loading, error, loadArticle])

  useEffect(() => {
    if (article) {
      isCnrsFavoriteAction(article.link).then(result => {
        setIsFavorite(result.isBookmarked)
      }).catch(() => {})
    }
  }, [article])

  const categoryColor = article ? CATEGORY_COLOR_MAP[article.category] || 'green' : 'green'
  const cat = article ? getTheme(categoryColor) : null

  const { isPending, handleBookmark } = useSimpleBookmarkToggle({
    resourceId: article?.link,
    guard: () => !article,
    initialFavorite: isFavorite,
    onFavoriteChange: setIsFavorite,
    toggleFn: async (action) => {
      await toggleCnrsFavoriteAction(article!.link, action, {
        title: article!.title,
        category: article!.category,
        imageUrl: article!.imageUrl,
        link: article!.link,
        date: article!.date,
      })
    },
  })

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: article?.link ?? '',
    title: article?.title ?? '',
    text: article ? `${article.title}\n\nCatégorie: ${article.category || 'Sciences'}` : '',
  })

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="green"
      label="Afficher Actualité CNRS"
    >
      <CardShell color="green" className="flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.iconBg} ${c.iconBgDark}`}>
              <Newspaper className={`h-4 w-4 sm:h-5 sm:w-5 ${c.iconForeground}`} />
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${c.title} ${c.titleDark}`}>
              {t('cnrs_news')}
            </h3>
          </div>
          <div className="flex items-center gap-6">
            {showToggle && onToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                className={`${c.action} ${c.actionHover} ${c.actionDark} ${c.actionHoverDark} transition-colors`}
                title={t('hide_card')}
                aria-label={t('hide_card')}
              >
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${c.action} ${c.actionDark} cursor-pointer transition-transform hover:scale-110 ${loading ? 'animate-spin' : ''}`} onClick={(e) => { e.stopPropagation(); loadArticle() }} />
            {article && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleBookmark()
                }}
                disabled={isPending}
                className={`${c.action} ${c.actionHover} ${c.actionDark} ${c.actionHoverDark} transition-colors disabled:opacity-50`}
                title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
              >
                <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark}`} />
              </button>
            )}
            <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
          </div>
        </div>

        {error && !loading && (
          <div className={`mb-3 flex items-center gap-2 rounded-lg border ${c.errorBorder} ${c.errorBg} p-3 ${c.errorBorderDark} ${c.errorBgDark}`}>
            <p className={`text-xs ${c.errorText} ${c.errorTextDark}`}>
              Impossible de charger l&apos;article. Cliquez pour réessayer.
            </p>
          </div>
        )}

        {article?.imageUrl && (
          <div className={`mb-3 overflow-hidden rounded-lg border ${c.imageBorder} ${c.imageBorderDark}`}>
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-[28rem] object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        {article && (
          <>
            <p className={`text-sm font-semibold ${c.bodyBold} ${c.bodyBoldDark} mb-2`}>
              {article.title}
            </p>

            {article.category && cat && (
              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cat.pillBorder} ${cat.pillBg} ${cat.pillText} ${cat.pillBorderDark} ${cat.pillBgDark} ${cat.pillTextDark}`}>
                  {article.category}
                </span>
              </div>
            )}

            <Link
              href={sanitizeUrl(article.link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 text-xs ${c.link} ${c.linkHover} ${c.linkDark} ${c.linkHoverDark} hover:underline`}
            >
              {t('read_article_cnrs')}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </>
        )}
      </CardShell>
    </CardVisibilityGuard>
  )
}
export const CnrsNewsCard = React.memo(CnrsNewsCardInner)
