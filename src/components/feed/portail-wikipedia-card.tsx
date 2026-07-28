'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Languages, ExternalLink, RefreshCw, Bookmark, Share2 } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { CardVisibilityGuard } from './card-visibility-guard'
import { toggleBookmarkAction } from '@/actions/favorite-actions'
import { isPortailWikipediaFavoriteBatchAction } from '@/actions/portail-wikipedia-bookmark-actions'
import { CardHeader } from './card-header'
import { ShareButton } from './share-button'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
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
        <div className="mb-6">
          <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:border-indigo-700 dark:from-indigo-950/30 dark:to-violet-950/30">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:border-indigo-700 dark:from-indigo-950/30 dark:to-violet-950/30 hover:shadow-md transition-shadow">
            <CardHeader
              icon={<Languages className="h-4 w-4 text-indigo-950" />}
              iconBgColor="bg-indigo-500"
              iconDarkColor="dark:bg-indigo-600"
              title="Portail Wikipédia"
              titleColor="text-indigo-800"
              titleDarkColor="dark:text-indigo-300"
              linkHref="/portail-wikipedia"
              showToggle={showToggle}
              onToggle={onToggle}
              onRefresh={loadArticles}
              showRefresh={true}
              loading={loading}
            />

            {error && !loading && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-100/50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {t('no_article_loaded')}
                </p>
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  className="rounded-lg border border-indigo-200 bg-white/50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20 transition-all hover:bg-white/80 dark:hover:bg-indigo-900/30"
                >
                  <div className="flex items-start gap-3">
                    {article.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md border border-indigo-200 dark:border-indigo-800">
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
                      <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">
                        {article.title}
                      </h4>
                      {article.extract && (
                        <p className="mt-1 text-xs leading-relaxed text-indigo-700 dark:text-indigo-300 line-clamp-3">
                          {article.extract}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <Link
                          href={sanitizeUrl(article.pageUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
                        >
                          {t('read_article')}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <div className="flex items-center gap-2 ml-auto">
                          <ShareToLobbyButton resourceId={article.id} resourceType="PORTAIL_WIKIPEDIA" meta={{ title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBookmark(article, favorites.has(article.pageUrl))
                            }}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
                            title={favorites.has(article.pageUrl) ? t('remove_favorite') : t('add_favorite')}
                            aria-label={favorites.has(article.pageUrl) ? t('remove_favorite') : t('add_favorite')}
                          >
                            <Bookmark className={`h-4 w-4 ${favorites.has(article.pageUrl) ? 'fill-current text-indigo-600 dark:text-indigo-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemShare(article)
                            }}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
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
          </div>
        </div>
      )}
    </CardVisibilityGuard>
  )
}

export const PortailWikipediaCard = React.memo(PortailWikipediaCardInner)
