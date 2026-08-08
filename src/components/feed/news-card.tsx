'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Newspaper, ExternalLink, RefreshCw, EyeOff, Bookmark, Globe, Briefcase, Cpu, Film, Trophy, Beaker, Heart, Bitcoin, Brain, Car, Shield, Circle, Search, X, Filter } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { toggleNewsFavoriteAction, isNewsFavoriteAction, isNewsFavoriteBatchAction } from '@/actions/news-bookmark-actions'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { useTranslations } from 'next-intl'

export interface NewsArticle {
  title: string
  description: string
  url: string
  imageUrl?: string
  source: string
  category: string
  publishedAt: string
  formattedPublishedAt: string
}

interface NewsCardProps {
  onToggle?: () => void
  showToggle?: boolean
  isVisible?: boolean
  linkHref?: string
  infiniteScroll?: boolean
  onLoadMore?: (cursor: string, currentArticles: NewsArticle[], currentCategories: string[]) => Promise<{ articles: NewsArticle[]; hasMore: boolean }>
  maxHeight?: string
}

const NEWS_FILTER_STORAGE_KEY = 'news_filter_visible'

const CATEGORIES = [
  { key: 'world', labelKey: 'world', icon: Globe },
  { key: 'business', labelKey: 'business', icon: Briefcase },
  { key: 'technology', labelKey: 'tech', icon: Cpu },
  { key: 'entertainment', labelKey: 'entertainment', icon: Film },
  { key: 'sports', labelKey: 'sports', icon: Trophy },
  { key: 'science', labelKey: 'science', icon: Beaker },
  { key: 'health', labelKey: 'health', icon: Heart },
  { key: 'digital currencies', labelKey: 'crypto', icon: Bitcoin },
  { key: 'golf', labelKey: 'golf', icon: Trophy },
  { key: 'vehicles', labelKey: 'vehicles', icon: Car },
  { key: 'internet security', labelKey: 'internet_security', icon: Shield },
  { key: 'movies', labelKey: 'movies', icon: Film },
  { key: 'gadgets', labelKey: 'gadgets', icon: Cpu },
  { key: 'soccer', labelKey: 'soccer', icon: Circle },
] as const

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; darkBorder: string; darkBg: string; darkText: string }> = {
  allNews: { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-800', darkBorder: 'dark:border-blue-700', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-300' },
  world: { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-800', darkBorder: 'dark:border-blue-700', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-300' },
  business: { border: 'border-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-800', darkBorder: 'dark:border-emerald-700', darkBg: 'dark:bg-emerald-900/40', darkText: 'dark:text-emerald-300' },
  technology: { border: 'border-violet-400', bg: 'bg-violet-100', text: 'text-violet-800', darkBorder: 'dark:border-violet-700', darkBg: 'dark:bg-violet-900/40', darkText: 'dark:text-violet-300' },
  entertainment: { border: 'border-pink-400', bg: 'bg-pink-100', text: 'text-pink-800', darkBorder: 'dark:border-pink-700', darkBg: 'dark:bg-pink-900/40', darkText: 'dark:text-pink-300' },
  sports: { border: 'border-orange-400', bg: 'bg-orange-100', text: 'text-orange-800', darkBorder: 'dark:border-orange-700', darkBg: 'dark:bg-orange-900/40', darkText: 'dark:text-orange-300' },
  science: { border: 'border-cyan-400', bg: 'bg-cyan-100', text: 'text-cyan-800', darkBorder: 'dark:border-cyan-700', darkBg: 'dark:bg-cyan-900/40', darkText: 'dark:text-cyan-300' },
  health: { border: 'border-red-400', bg: 'bg-red-100', text: 'text-red-800', darkBorder: 'dark:border-red-700', darkBg: 'dark:bg-red-900/40', darkText: 'dark:text-red-300' },
  'digital currencies': { border: 'border-amber-400', bg: 'bg-amber-100', text: 'text-amber-800', darkBorder: 'dark:border-amber-700', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-300' },
  golf: { border: 'border-lime-400', bg: 'bg-lime-100', text: 'text-lime-800', darkBorder: 'dark:border-lime-700', darkBg: 'dark:bg-lime-900/40', darkText: 'dark:text-lime-300' },
  vehicles: { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-800', darkBorder: 'dark:border-gray-600', darkBg: 'dark:bg-gray-800/40', darkText: 'dark:text-gray-300' },
  'internet security': { border: 'border-teal-400', bg: 'bg-teal-100', text: 'text-teal-800', darkBorder: 'dark:border-teal-700', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-300' },
  movies: { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-800', darkBorder: 'dark:border-purple-700', darkBg: 'dark:bg-purple-900/40', darkText: 'dark:text-purple-300' },
  gadgets: { border: 'border-indigo-400', bg: 'bg-indigo-100', text: 'text-indigo-800', darkBorder: 'dark:border-indigo-700', darkBg: 'dark:bg-indigo-900/40', darkText: 'dark:text-indigo-300' },
  soccer: { border: 'border-green-400', bg: 'bg-green-100', text: 'text-green-800', darkBorder: 'dark:border-green-700', darkBg: 'dark:bg-green-900/40', darkText: 'dark:text-green-300' },
  cinema: { border: 'border-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-800', darkBorder: 'dark:border-yellow-700', darkBg: 'dark:bg-yellow-900/40', darkText: 'dark:text-yellow-300' },
  auto: { border: 'border-slate-400', bg: 'bg-slate-100', text: 'text-slate-800', darkBorder: 'dark:border-slate-700', darkBg: 'dark:bg-slate-900/40', darkText: 'dark:text-slate-300' },
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  'freed.free.world': 'world',
  'freed.free.business': 'business',
  'freed.free.technology': 'technology',
  'freed.free.entertainment': 'entertainment',
  'freed.free.sports': 'sports',
  'freed.free.science': 'science',
  'freed.free.health': 'health',
  'freed.free.digital_currencies': 'digital currencies',
  'freed.free.golf': 'golf',
  'freed.free.vehicles': 'vehicles',
  'freed.free.internet_security': 'internet security',
  'freed.free.movies': 'movies',
  'freed.free.gadgets': 'gadgets',
  'freed.free.soccer': 'soccer',
}

function getCategoryLabel(category: string, t: ReturnType<typeof useTranslations>): string {
  const key = CATEGORY_KEY_MAP[category] || category
  const catDef = CATEGORIES.find(c => c.key === key)
  if (catDef) return t(catDef.labelKey)
  return category
}


async function fetchArticles(categories: string | null, excludeUrl?: string, query?: string | null): Promise<NewsArticle[] | null> {
  try {
    const params = new URLSearchParams()
    if (categories) params.set('categories', categories)
    if (excludeUrl) params.set('exclude', excludeUrl)
    if (query) params.set('q', query)
    const res = await fetch(`/api/news?${params}`, {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    const data = await res.json()
    const articles = Array.isArray(data) ? data : (data.articles || [])
    if (articles.length === 0) return null
    return articles
  } catch {
    return null
  }
}

function NewsCardInner({ onToggle, showToggle = true, isVisible, linkHref, infiniteScroll = false, onLoadMore, maxHeight }: NewsCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('blue')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const checkedUrlsRef = useRef<Set<string>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [hasMore, setHasMore] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategories, setShowCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NEWS_FILTER_STORAGE_KEY)
      return stored !== null ? stored === 'true' : true
    }
    return true
  })
  const favoritesCheckedRef = useRef(false)

  const scrollHeight = infiniteScroll ? (maxHeight || '800px') : (maxHeight || '700px')

  const loadCountRef = useRef(0)

  const virtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 250,
    overscan: 5,
  })

  const loadArticles = useCallback(async (query?: string | null) => {
    setLoading(true)
    setError(false)
    const newArticles = await fetchArticles(selectedCategories.length > 0 ? selectedCategories.join(',') : null, undefined, query)
    if (newArticles && newArticles.length > 0) {
      setArticles(newArticles)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [selectedCategories])

  useEffect(() => {
    if (isVisible === false) return

    loadCountRef.current++
    const currentLoadCount = loadCountRef.current

    const timer = setTimeout(() => {
      if (currentLoadCount !== loadCountRef.current) return
      loadArticles(searchQuery || null)
    }, 300)

    return () => clearTimeout(timer)
  }, [isVisible, selectedCategories, searchQuery])

  useEffect(() => {
    if (favoritesCheckedRef.current) return
    if (articles.length > 0) {
      const checkFavorites = async () => {
        const urls = articles.map(a => a.url)
        const result = await isNewsFavoriteBatchAction(JSON.stringify(urls))
        if (result.bookmarkedIds.length > 0) {
          setFavorites(prev => new Set([...prev, ...result.bookmarkedIds]))
        }
      }
      checkFavorites()
    }
    favoritesCheckedRef.current = true
  }, [articles.length])

  useEffect(() => {
    favoritesCheckedRef.current = false
  }, [selectedCategories])

  useEffect(() => {
    if (!infiniteScroll || !onLoadMore || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          const lastArticle = articles[articles.length - 1]
          if (lastArticle) {
            onLoadMore(lastArticle.url, articles, selectedCategories).then(result => {
              setArticles(prev => [...prev, ...result.articles])
              setHasMore(result.hasMore)
              setHasLoaded(true)
            }).catch(() => {
              setHasLoaded(true)
            })
          }
        }
      },
      { threshold: 0.5 }
    )

    const sentinel = sentinelRef.current
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [infiniteScroll, onLoadMore, hasMore, loading, articles.length, selectedCategories])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      }
      return [...prev, category]
    })
  }, [])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const newArticles = await fetchArticles(selectedCategories.length > 0 ? selectedCategories.join(',') : null, undefined, searchQuery || undefined)
    if (newArticles && newArticles.length > 0) {
      setArticles(newArticles)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [loading, selectedCategories, searchQuery])

  const handleBookmark = useCallback(async (article: NewsArticle, isFav: boolean) => {
    const action = isFav ? 'remove' : 'add'
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) {
        next.delete(article.url)
      } else {
        next.add(article.url)
      }
      return next
    })
    await toggleNewsFavoriteAction(article.url, action, {
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.imageUrl,
      source: article.source,
      category: article.category,
      publishedAt: article.publishedAt,
    }).catch(() => {
      setFavorites(prev => {
        const next = new Set(prev)
        if (isFav) {
          next.add(article.url)
        } else {
          next.delete(article.url)
        }
        return next
      })
    })
  }, [])

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: articles[0]?.url ?? '',
    title: articles[0]?.title ?? '',
    text: articles[0] ? `${articles[0].title}\n\n${articles[0].description || ''}` : '',
  })

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="blue"
      label="Afficher NEWS"
    >
      <CardShell color="blue" className="overflow-visible">
          <div className={'sticky top-0 z-10 mb-3 flex items-center justify-between ' + c.shellBgGradient + ' ' + c.shellBgGradientDark}>
            <div className="flex items-center gap-2">
              <div className={'flex h-8 w-8 items-center justify-center rounded-full ' + c.iconBg + ' ' + c.iconBgDark}>
                <Newspaper className={'h-4 w-4 sm:h-5 sm:w-5 text-white ' + c.iconForeground} />
              </div>
              {linkHref ? (
                <Link href={linkHref} className={'text-sm font-bold uppercase tracking-wide hover:underline ' + c.title + ' ' + c.titleDark}>
                  NEWS
                </Link>
              ) : (
                <h3 className={'text-sm font-bold uppercase tracking-wide ' + c.title + ' ' + c.titleDark}>
                  NEWS
                </h3>
              )}
            </div>
            <div className="flex items-center gap-4">
              {showToggle && onToggle && (
             <button
                 onClick={(e) => {
                   e.stopPropagation()
                   onToggle()
                 }}
                 className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                 title={t('hide_card')}
                 aria-label={t('hide_card')}
               >
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const next = !showCategories
                  setShowCategories(next)
                  localStorage.setItem(NEWS_FILTER_STORAGE_KEY, String(next))
                }}
                className={'h-4 w-4 sm:h-5 sm:w-5 cursor-pointer transition-transform hover:scale-110 ' + c.action + ' ' + c.actionDark + ' ' + (showCategories ? 'rotate-180' : '')}
                title={t('filter_news')}
                aria-label={t('filter_news')}
              >
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <RefreshCw className={'h-4 w-4 sm:h-5 sm:w-5 cursor-pointer transition-transform hover:scale-110 ' + c.action + ' ' + c.actionDark + ' ' + (loading ? 'animate-spin' : '')} onClick={(e) => { e.stopPropagation(); handleRefresh() }} />
            </div>
          </div>

          {showCategories && (
            <div className="mb-3 flex flex-wrap gap-1">
              {CATEGORIES.map(({ key, labelKey, icon: Icon }) => {
                const isSelected = selectedCategories.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                  className={'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ' + (isSelected ? ('border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-600 dark:text-white') : (c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' hover:bg-blue-100 ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' dark:hover:bg-blue-900/40'))}
                  >
                    <Icon className="h-3 w-3" />
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          )}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher dans les actualités..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full pl-10 pr-10 h-10 rounded-lg border text-sm placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ' + c.pillBorder + ' bg-white/80 ' + c.bodyBold + ' dark:' + c.pillBorderDark + ' dark:bg-blue-950/30 dark:text-blue-100 dark:placeholder:text-blue-500'}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark}
                aria-label={t('clear_search')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && !loading && (
           <div className={'mb-3 flex items-center gap-2 rounded-lg border p-3 ' + c.errorBorder + ' ' + c.errorBg + ' ' + c.errorBorderDark + ' ' + c.errorBgDark}>
               <p className={'text-xs ' + c.errorText + ' ' + c.errorTextDark}>
                Impossible de charger les articles. Cliquez pour réessayer.
              </p>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="pr-2"
            style={{ height: scrollHeight, overflow: 'auto' }}
          >
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const article = articles[virtualItem.index]
                const categoryStyle = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.allNews
                const isFav = favorites.has(article.url)

                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: `${virtualItem.start}px`,
                      left: 0,
                      width: '100%',
                    }}
                  >
                    <div
                      ref={virtualizer.measureElement}
                      data-index={virtualItem.index}
                      className={'mb-4 rounded-lg border p-4 hover:bg-white/80 transition-colors ' + c.itemBorder + ' ' + c.itemBg + ' ' + c.itemBorderDark + ' ' + c.itemBgDark + ' dark:hover:bg-blue-950/40'}
                    >
                      {article.imageUrl && (
                        <div className={'mb-3 overflow-hidden rounded-lg border ' + c.imageBorder + ' ' + c.imageBorderDark}>
                          <img
                            src={sanitizeUrl(article.imageUrl, '')}
                            alt={article.title}
                            loading="lazy"
                            className="w-full h-64 object-cover transition-opacity hover:opacity-90"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      <div className="mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${categoryStyle.border} ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBorder} ${categoryStyle.darkBg} ${categoryStyle.darkText}`}>
                          {getCategoryLabel(article.category, t)}
                        </span>
                        <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ml-2 ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark}>
                          {article.source}
                        </span>
                      </div>

                      <div className="mb-2 text-xs text-muted-foreground">
                        {article.formattedPublishedAt}
                      </div>

                      <h4 className={'text-sm font-semibold mb-2 ' + c.bodyBold + ' ' + c.bodyBoldDark}>
                        {article.title}
                      </h4>

                      {article.description && (
                        <p className={'text-xs leading-relaxed mb-3 line-clamp-2 ' + c.body + ' ' + c.bodyDark}>
                          {article.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {article.url.startsWith('http') ? (
                          <Link
                            href={sanitizeUrl(article.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={'inline-flex items-center gap-1 text-xs hover:underline ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('read_article')}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className={'text-xs ' + c.muted + ' ' + c.mutedDark}>
                            {t('no_direct_link')}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <ShareToLobbyButton resourceId={article.url} resourceType="NEWS" meta={{ title: article.title, description: article.description, imageUrl: article.imageUrl, source: article.source, category: article.category }} />
                          {isLoggedIn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBookmark(article, isFav)
                              }}
                              className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                              title={isFav ? t('remove_favorite') : t('add_favorite')}
                              aria-label={isFav ? t('remove_favorite') : t('add_favorite')}
                            >
                              <Bookmark className={'h-4 w-4 ' + (isFav ? ('fill-current ' + c.actionFilled + ' ' + c.actionFilledDark) : (c.action + ' ' + c.actionDark))} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {infiniteScroll && hasMore && (
                <div
                  ref={sentinelRef}
                  style={{ position: 'absolute', left: 0, top: Math.max(0, virtualizer.getTotalSize() - 100), width: '100%' }}
                  className="h-1"
                />
              )}
            </div>
          </div>

          {infiniteScroll && loading && (
            <div className="flex justify-center py-4">
                <RefreshCw className={'h-4 w-4 animate-spin ' + c.action + ' ' + c.actionDark} />
            </div>
          )}

          {infiniteScroll && !hasMore && hasLoaded && (
            <p className={'text-center text-xs py-4 ' + c.muted + ' ' + c.mutedDark}>
              {t('no_more_articles')}
            </p>
          )}

          {infiniteScroll && !hasMore && !hasLoaded && articles.length === 0 && !error && (
            <p className={'text-center text-xs py-4 ' + c.muted + ' ' + c.mutedDark}>
              {t('no_more_articles')}
            </p>
          )}

          {!infiniteScroll && loading && articles.length > 0 && (
            <div className="mt-3 flex justify-center">
                <RefreshCw className={'h-4 w-4 animate-spin ' + c.action + ' ' + c.actionDark} />
            </div>
          )}

          <div className={'mt-3 text-center text-xs ' + c.muted + ' dark:text-blue-400/60'}>
            Powered by <Link href="https://freenewsapi.io" target="_blank" rel="noopener noreferrer" className="hover:underline">freenewsapi.io</Link>
     </div>
       </CardShell>
     </CardVisibilityGuard>
  )
}
export const NewsCard = React.memo(NewsCardInner)
