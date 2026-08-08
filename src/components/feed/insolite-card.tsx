'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { ExternalLink, Bookmark, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl as isValidUrlUtil, sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'
import { CardHeader } from './card-header'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useTranslations } from 'next-intl'

export interface InsoliteArticle {
  id: string
  title: string
  description: string
  url: string
  imageUrl: string | null
}

interface InsoliteCardProps {
  showToggle?: boolean
  showBookmark?: boolean
  showShare?: boolean
  isVisible?: boolean
  onToggle?: () => void
}

async function fetchTodayInsoliteArticle(): Promise<{ article: InsoliteArticle | null; allSeen: boolean }> {
  try {
    const res = await fetch('/api/insolite?count=1&daily=true', { cache: 'no-store' })
    const data = await res.json()
    if (data.articles?.length > 0) {
      return { article: data.articles[0], allSeen: data.allSeen || false }
    }
  } catch {}
  return { article: null, allSeen: false }
}

export const InsoliteCard = React.memo(function InsoliteCardInner({
  showToggle = true,
  showBookmark = true,
  showShare = true,
  isVisible,
  onToggle,
 }: InsoliteCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const [article, setArticle] = useState<InsoliteArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [allSeen, setAllSeen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { article: fetched, allSeen: seen } = await fetchTodayInsoliteArticle()
      if (fetched) {
        setArticle(fetched)
      }
      setAllSeen(seen || false)
      setLoading(false)
    }
    load()
  }, [])

  const hasImage = article && isValidUrlUtil(article.imageUrl) && !imageError

  const shareUrl = article?.id ? `${typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'}/insolite/${article.id}` : ''
  const { handleShare, copied, shareUrl: shareUrlResult } = useItemShare({
    shareUrl,
    title: 'Article insolite',
    text: article?.description || article?.title || '',
  })

  const { isPending, handleBookmark: handleToggleFavorite, isFavorite } = useSimpleBookmarkToggle({
    resourceId: article?.id,
    guard: () => !article,
    initialFavorite: false,
    onFavoriteChange: () => {},
    toggleFn: async (action) => {
      await toggleBookmarkAction('INSOLITE', article!.id, action, {
        title: article!.title,
        description: article!.description,
        url: article!.url,
        imageUrl: article!.imageUrl,
      })
    },
  })

  const c = getTheme('purple')

  const cardContent = (
    <CardShell color="purple">
      <CardHeader
        color="purple"
        icon={<Sparkles className={'h-4 w-4 ' + c.iconForeground} />}
        title={t('insolite_tab')}
        showToggle={showToggle}
        onToggle={onToggle}
        showRefresh={false}
        loading={loading}
        shareOptions={showShare ? { onClick: handleShare, copied, shareUrl: shareUrlResult } : undefined}
        extraActions={showBookmark && article ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <ShareToLobbyButton resourceId={article.id} resourceType="INSOLITE" meta={{ title: article.title, description: article.description, url: article.url, imageUrl: article.imageUrl }} />
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
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <ImageHint color="purple" />
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

      {allSeen && article && (
        <div className="mt-4 text-center">
          <p className={'text-xs ' + c.body + ' ' + c.bodyDark}>
            {t('insolite_no_more_unseen')}
          </p>
          <Link
            href="/sujets"
            className={'inline-flex items-center gap-1 text-xs mt-1 ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
          >
            {t('reload_page')}
          </Link>
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
        buttonColor="purple"
        label="Afficher Articles insolites"
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
