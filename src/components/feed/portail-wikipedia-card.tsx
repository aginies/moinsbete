'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Languages, ExternalLink, RefreshCw, Bookmark, Share2 } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { isPortailWikipediaFavoriteBatchAction } from '@/actions/portail-wikipedia-bookmark-actions'
import { CardHeader } from './card-header'
import { ShareButton } from './share-button'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { useTranslations } from 'next-intl'

interface PortailWikipediaArticle {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

interface PortailWikipediaCardProps {
  userId?: string
  onToggle?: () => void
  isVisible?: boolean
  showToggle?: boolean
}

async function fetchArticles(count: number): Promise<PortailWikipediaArticle[]> {
  try {
    const res = await fetch(`/api/portail-wikipedia?count=${count}`, {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return []
}

function PortailWikipediaCardInner({ userId, onToggle, isVisible, showToggle = true }: PortailWikipediaCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('indigo')
  const [articles, setArticles] = useState<PortailWikipediaArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const favoritesCheckedRef = useRef(false)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError(false)
    const newArticles = await fetchArticles(10)
    if (newArticles.length > 0) {
      setArticles(newArticles)
      favoritesCheckedRef.current = false
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (articles.length > 0 && !favoritesCheckedRef.current) {
      const checkFavorites = async () => {
        const urls = articles.map(a => a.pageUrl)
        try {
          const result = await isPortailWikipediaFavoriteBatchAction(JSON.stringify(urls))
          if (result.bookmarkedIds.length > 0) {
            setFavorites(prev => new Set([...prev, ...result.bookmarkedIds]))
          }
        } catch {}
        favoritesCheckedRef.current = true
      }
      checkFavorites()
    }
  }, [articles.length])

  const handleBookmark = useCallback(async (article: PortailWikipediaArticle, isFav: boolean) => {
    const action = isFav ? 'remove' : 'add'
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) {
        next.delete(article.pageUrl)
      } else {
        next.add(article.pageUrl)
      }
      return next
    })
    await toggleBookmarkAction('PORTAIL_WIKIPEDIA', article.pageUrl, action, {
      title: article.title,
      extract: article.extract,
      imageUrl: article.imageUrl,
      pageUrl: article.pageUrl,
    }).catch(() => {
      setFavorites(prev => {
        const next = new Set(prev)
        if (isFav) {
          next.add(article.pageUrl)
        } else {
          next.delete(article.pageUrl)
        }
        return next
      })
    })
  }, [])

  const handleItemShare = useCallback(async (article: PortailWikipediaArticle) => {
    const { pageUrl } = article
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(pageUrl)
      } catch {
        // Clipboard write failed
      }
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: article.title, text: `${article.extract?.substring(0, 200)}`, url: pageUrl })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [])

  useEffect(() => {
    if (isVisible === false) return
    if (articles.length === 0 && !loading && !error) {
      const timer = setTimeout(() => {
        loadArticles()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, articles.length, loading, error, loadArticles])

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="indigo"
      label="Afficher Portail Wikipédia"
    >
      {loading && articles.length === 0 ? (
        <div className="mb-4 sm:mb-6">
          <CardShell color="indigo">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className={'h-6 w-6 animate-spin ' + c.action} />
            </div>
          </CardShell>
        </div>
      ) : (
        <div className="mb-4 sm:mb-6">
          <CardShell color="indigo">
            <CardHeader
              color="indigo"
              icon={<Languages className={'h-4 w-4 ' + c.iconForeground} />}
              title="Portail Wikipédia"
              linkHref="/portail-wikipedia"
              showToggle={showToggle}
              onToggle={onToggle}
              onRefresh={loadArticles}
              showRefresh={true}
              loading={loading}
            />

            {error && !loading && (
              <div className={'mb-3 flex items-center gap-2 rounded-lg border ' + c.errorBorder + ' ' + c.errorBg + ' p-3 ' + c.errorBorderDark + ' ' + c.errorBgDark}>
                <p className={'text-xs ' + c.errorText + ' ' + c.errorTextDark}>
                  {t('no_article_loaded')}
                </p>
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  className={'rounded-lg border ' + c.itemBorder + ' ' + c.itemBg + ' p-4 ' + c.itemBorderDark + ' ' + c.itemBgDark + ' transition-all ' + c.itemHover + ' ' + c.itemHoverDark}
                >
                  <div className="flex items-start gap-3">
                    {article.imageUrl && (
                      <div className={'flex-shrink-0 w-20 h-20 overflow-hidden rounded-md border ' + c.imageBorder + ' ' + c.imageBorderDark}>
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={'text-sm font-semibold ' + c.bodyBold + ' ' + c.bodyBoldDark + ' truncate'}>
                        {article.title}
                      </h4>
                      {article.extract && (
                        <p className={'mt-1 text-xs leading-relaxed ' + c.headingSecondary + ' ' + c.headingSecondaryDark + ' line-clamp-3'}>
                          {article.extract}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <Link
                          href={sanitizeUrl(article.pageUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={'inline-flex items-center gap-1 text-xs ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark + ' hover:underline'}
                        >
                          {t('read_article')}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <div className="flex items-center gap-2 ml-auto">
                          <ShareToLobbyButton resourceId={article.id} resourceType="PORTAIL_WIKIPEDIA" meta={{ title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl }} />
                          {isLoggedIn && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBookmark(article, favorites.has(article.pageUrl))
                              }}
                              className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                              title={favorites.has(article.pageUrl) ? t('remove_favorite') : t('add_favorite')}
                              aria-label={favorites.has(article.pageUrl) ? t('remove_favorite') : t('add_favorite')}
                            >
                              <Bookmark className={'h-4 w-4 ' + (favorites.has(article.pageUrl) ? 'fill-current ' + c.actionFilled + ' ' + c.actionFilledDark : c.action + ' ' + c.actionDark)} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemShare(article)
                            }}
                            className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                            title={t('share')}
                            aria-label={t('share')}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      )}
    </CardVisibilityGuard>
  )
}

export const PortailWikipediaCard = React.memo(PortailWikipediaCardInner)
