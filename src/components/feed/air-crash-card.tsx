'use client'

import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Bookmark, Plane } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl as isValidUrlUtil, sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleAirCrashFavoriteAction, isAirCrashFavoriteAction } from '@/actions/bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'

export interface AirCrashArticle {
  id: string
  title: string
  description: string
  url: string
  imageUrl: string | null
}

interface AirCrashCardProps {
  showToggle?: boolean
  showBookmark?: boolean
  showShare?: boolean
  isVisible?: boolean
  onToggle?: () => void
}

async function fetchRandomAirCrashArticle(): Promise<AirCrashArticle | null> {
  try {
    const res = await fetch('/api/air-crash', { cache: 'no-store' })
    const data = await res.json()
    if (data.article) {
      return data.article
    }
  } catch {}
  return null
}

const AIR_CRASH_CURRENT_KEY = 'air_crash_current'
const AIR_CRASH_DAILY_MS = 24 * 60 * 60 * 1000

interface SavedAirCrash {
  id: string
  ts: number
  article: AirCrashArticle
}

function readSavedAirCrash(): SavedAirCrash | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(AIR_CRASH_CURRENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.id === 'string' && typeof parsed.ts === 'number' && parsed.article) {
      return parsed as SavedAirCrash
    }
    return null
  } catch {
    return null
  }
}

function saveCurrentAirCrash(article: AirCrashArticle) {
  try {
    const saved: SavedAirCrash = { id: article.id, ts: Date.now(), article }
    localStorage.setItem(AIR_CRASH_CURRENT_KEY, JSON.stringify(saved))
  } catch {
    // ignore
  }
}

export const AirCrashCard = React.memo(function AirCrashCardInner({
  showToggle = true,
  showBookmark = true,
  showShare = true,
  isVisible,
  onToggle,
}: AirCrashCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const [article, setArticle] = useState<AirCrashArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  const load = useCallback(async (forceRandom: boolean) => {
    if (!forceRandom) {
      const saved = readSavedAirCrash()
      if (saved && Date.now() - saved.ts < AIR_CRASH_DAILY_MS) {
        setArticle(saved.article)
        setImageError(false)
        return
      }
    }
    setLoading(true)
    const fetched = await fetchRandomAirCrashArticle()
    if (fetched) {
      setArticle(fetched)
      setImageError(false)
      saveCurrentAirCrash(fetched)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const { isPending, handleBookmark: handleToggleFavorite, isFavorite, setIsFavorite } = useSimpleBookmarkToggle({
    resourceId: article?.id,
    guard: () => !article,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await toggleAirCrashFavoriteAction(article!.id, action, {
        title: article!.title,
        description: article!.description,
        url: article!.url,
        imageUrl: article!.imageUrl,
      })
    },
  })

  useEffect(() => {
    if (!article?.id || !isLoggedIn) return
    let cancelled = false
    isAirCrashFavoriteAction(article.id).then(r => {
      if (!cancelled) setIsFavorite(r.isBookmarked)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [article?.id, isLoggedIn, setIsFavorite])

  const hasImage = article && isValidUrlUtil(article.imageUrl) && !imageError

  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl: article?.url || '',
    title: article?.title || 'Air Crash Investigation',
    text: article?.description || article?.title || '',
  })

  const c = getTheme('blue')

  const cardContent = (
    <CardShell color="blue">
      <CardHeader
        color="blue"
        icon={<Plane className={'h-4 w-4 ' + c.iconForeground} />}
        title={t('air_crash_tab')}
        showToggle={showToggle}
        onToggle={onToggle}
        showRefresh={true}
        onRefresh={() => load(true)}
        loading={loading}
        shareOptions={showShare ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
        extraActions={showBookmark && article ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <ShareToLobbyButton resourceId={article.id} resourceType="AIR_CRASH" meta={{ title: article.title, description: article.description, url: article.url, imageUrl: article.imageUrl }} />
            {isLoggedIn && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
                disabled={isPending || !article}
                className={'rounded-full p-1.5 ' + c.hoverBg + ' ' + c.hoverBgDark + ' transition-all disabled:opacity-50'}
                title={isFavorite ? t('remove_favorite') : t('add_favorite')}
                aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
              >
                <Bookmark
                  className={'h-4 w-4 sm:h-5 sm:w-5 ' + (isFavorite ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark)}
                />
              </button>
            )}
          </div>
        ) : undefined}
      />

      {hasImage && (
        <div
          className={'mb-3 cursor-pointer overflow-hidden rounded-lg border ' + c.imageBorder + ' ' + c.imageBorderDark}
          onClick={(e) => {
            e.stopPropagation()
            setShowFullImage(true)
          }}
        >
          <img
            src={article?.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={article?.title || ''}
            loading="lazy"
            className={`w-full h-64 object-cover transition-opacity hover:opacity-90 pointer-events-none bg-neutral-100 dark:bg-neutral-800`}
            onError={() => setImageError(true)}
          />
          <ImageHint color="blue" />
        </div>
      )}

      {article && (
        <>
          <h2 className={'text-lg font-bold mb-2 ' + c.title + ' ' + c.titleDark}>
            {article.title}
          </h2>
          {article.description && (
            <p className={'text-sm leading-relaxed mb-3 ' + c.body + ' ' + c.bodyDark}>
              {article.description}
            </p>
          )}
          <div className="mt-3">
            <Link
              href={sanitizeUrl(article.url, '#')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={'inline-flex items-center gap-1 text-xs ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
            >
              <ExternalLink className="h-3 w-3" />
              {t('read_article')}
            </Link>
          </div>
        </>
      )}

      {!loading && !article && (
        <div className="text-center py-4">
          <p className={'text-sm ' + c.body + ' ' + c.bodyDark}>
            {t('air_crash_empty')}
          </p>
        </div>
      )}
    </CardShell>
  )

  return (
    <>
      <CardVisibilityGuard
        isVisible={isVisible}
        onToggle={onToggle}
        showToggle={showToggle}
        buttonColor="blue"
        label="Afficher Air Crash Investigation"
      >
        {cardContent}
      </CardVisibilityGuard>

      {showFullImage && (
        <ImageLightbox
          src={article?.imageUrl || ''}
          alt={article?.title || ''}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  )
})
