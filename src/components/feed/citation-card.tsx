'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Quote, Bookmark, Sparkles, BookOpen, User, EyeOff, Filter } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl, shuffle } from '@/lib/utils'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import { CardVisibilityGuard } from './card-visibility-guard'
import { CardShell } from './card-shell'
import { getTheme } from '@/lib/card-theme'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { toggleCitationFavoriteAction } from '@/actions/bookmark-actions'
import { useIsLoggedIn } from '@/hooks/use-is-logged-in'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface CitationCardProps {
  onToggle?: () => void
  showToggle?: boolean
  isVisible?: boolean
  userId?: string
  searchQuery?: string
}

interface CitationItem {
  id: string
  text: string
  author: string
  source?: string
  category: string
  categoryType: 'theme' | 'auteur' | 'daily'
  wikiUrl: string
  imageUrl?: string
}

interface CitationData {
  citations: CitationItem[]
  categories: Record<string, string[]>
  bookmarkedIds: string[]
}

const TABS = [
  { key: 'auteurs', label: 'citation_tab_auteurs', icon: User },
  { key: 'dujour', label: 'citation_tab_dujour', icon: Sparkles },
  { key: 'themes', label: 'citation_tab_themes', icon: BookOpen },
] as const

async function fetchCitationData(type?: string, categories?: string[]): Promise<CitationData | null> {
  try {
    const params = new URLSearchParams({ t: String(Date.now()) })
    if (type) params.set('type', type)
    if (categories && categories.length > 0) params.set('categories', categories.join(','))
    const res = await fetch(`/api/citation?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.citations) return null
    return data
  } catch {
    return null
  }
}

async function fetchDailyCitation(): Promise<CitationData | null> {
  try {
    const res = await fetch('/api/citation?daily=1&t=' + Date.now(), {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.citations) return null
    return data
  } catch {
    return null
  }
}

function CitationItemRow({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: CitationItem
  isFavorite: boolean
  onToggleFavorite: (id: string, current: boolean) => void
}) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('amber')

  return (
    <div className={'p-3 rounded-lg border hover:bg-white dark:hover:bg-black/30 transition-colors ' + c.itemBg + ' ' + c.itemBgDark + ' ' + c.itemBorder + ' ' + c.itemBorderDark + ' ' + c.itemHover + ' ' + c.itemHoverDark}>
      <div className="flex items-start gap-3">
        <Quote className={'h-4 w-4 flex-shrink-0 mt-1 ' + c.action + ' ' + c.actionDark} />
        <div className="flex-1 min-w-0">
          <p className={'text-sm leading-relaxed italic ' + c.bodyBold + ' ' + c.bodyBoldDark}>
            &quot;{item.text}&quot;
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={'text-xs font-semibold ' + c.body + ' ' + c.bodyDark}>
              {item.author}
            </span>
            {item.source && (
              <span className={'text-xs ' + c.muted + ' ' + c.mutedDark}>
                - {item.source}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark}>
              {item.category}
            </span>
            <Link
              href={sanitizeUrl(item.wikiUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={'text-[10px] hover:underline ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark}
            >
              {t('read_citation')}
            </Link>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          <ShareToLobbyButton resourceId={item.id} resourceType="CITATION" meta={{ text: item.text, author: item.author, ...(item.source && { source: item.source }), url: item.wikiUrl, category: item.category }} />
          {isLoggedIn && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, isFavorite) }}
            className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
            title={isFavorite ? t('remove_favorite') : t('add_favorite')}
          >
            <Bookmark className={'h-4 w-4 ' + (isFavorite ? 'fill-current' : '')} />
          </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const CitationCard = React.memo(function CitationCardInner({
  onToggle,
  showToggle = true,
  isVisible,
  userId,
  searchQuery,
}: CitationCardProps) {
  const t = useTranslations('feed')
  const isLoggedIn = useIsLoggedIn()
  const c = getTheme('amber')
  const [activeTab, setActiveTab] = useState('auteurs')

  // Daily state
  const [dailyData, setDailyData] = useState<CitationData | null>(null)

  // Themes state
  const [themesData, setThemesData] = useState<CitationData | null>(null)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])

  // Auteurs state
  const [auteursData, setAuteursData] = useState<CitationData | null>(null)
  const [selectedAuteurs, setSelectedAuteurs] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showThemeFilters, setShowThemeFilters] = useState(false)
  const [showAuteurFilters, setShowAuteurFilters] = useState(false)
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set())
  const favoritesSyncedRef = useRef(false)

  useEffect(() => {
    if (favoritesSyncedRef.current) return
    const allIds = [
      ...(dailyData?.bookmarkedIds || []),
      ...(themesData?.bookmarkedIds || []),
      ...(auteursData?.bookmarkedIds || []),
    ]
    if (allIds.length > 0) {
      setLocalFavorites(prev => {
        const next = new Set(prev)
        allIds.forEach(id => next.add(id))
        return next
      })
    }
    favoritesSyncedRef.current = true
  }, [dailyData?.bookmarkedIds, themesData?.bookmarkedIds, auteursData?.bookmarkedIds])

  useEffect(() => {
    favoritesSyncedRef.current = false
  }, [dailyData, themesData, auteursData, selectedThemes, selectedAuteurs])

  const loadDaily = useCallback(async () => {
    const result = await fetchDailyCitation()
    if (result) {
      setDailyData(result)
      setError(false)
    } else {
      setError(true)
    }
  }, [])

  const loadThemes = useCallback(async () => {
    setLoading(true)
    const result = await fetchCitationData('theme', selectedThemes.length > 0 ? selectedThemes : undefined)
    if (result) {
      setThemesData(result)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [selectedThemes])

  const loadAuteurs = useCallback(async () => {
    setLoading(true)
    const result = await fetchCitationData('auteur', selectedAuteurs.length > 0 ? selectedAuteurs : undefined)
    if (result) {
      setAuteursData(result)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [selectedAuteurs])

  const loadData = useCallback(async () => {
    if (activeTab === 'dujour') await loadDaily()
    else if (activeTab === 'themes') await loadThemes()
    else await loadAuteurs()
  }, [activeTab, loadDaily, loadThemes, loadAuteurs])

  useAutoRefresh('citation', loadData)

  useEffect(() => {
    if (isVisible === false) return
    if (!dailyData && !themesData && !auteursData && !loading && !error) {
      const timer = setTimeout(() => loadAuteurs(), 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, dailyData, themesData, auteursData, loading, error, loadAuteurs])

// Reload on tab switch
  useEffect(() => {
    if (activeTab === 'auteurs' && !auteursData) loadAuteurs()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'themes' && !themesData) loadThemes()
  }, [activeTab])

  const handleBookmark = useCallback(async (id: string, isFav: boolean) => {
    const action = isFav ? 'remove' : 'add'
    const item = [...(dailyData?.citations || []), ...(themesData?.citations || []), ...(auteursData?.citations || [])].find(c => c.id === id)
    setLocalFavorites(prev => {
      const next = new Set(prev)
      if (isFav) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    if (item) {
      await toggleCitationFavoriteAction(id, action, {
        text: item.text,
        author: item.author,
        source: item.source,
        url: item.wikiUrl,
        category: item.category,
        imageUrl: item.imageUrl,
      }).catch(() => {
        setLocalFavorites(prev => {
          const next = new Set(prev)
          if (isFav) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
      })
    }
  }, [dailyData, themesData, auteursData])

  const toggleTheme = useCallback((cat: string) => {
    setSelectedThemes(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  const toggleAuteur = useCallback((cat: string) => {
    setSelectedAuteurs(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  const handleRefresh = useCallback(async () => {
    if (loading) return
    await loadData()
  }, [loading, loadData])

  const allFavorites = localFavorites

  const themeCategories = themesData?.categories?.theme || []
  const auteurCategories = auteursData?.categories?.auteur || []

  const filteredThemes = selectedThemes.length > 0
    ? (themesData?.citations || []).filter(c => selectedThemes.includes(c.category))
    : themesData?.citations || []

  const filteredAuteurs = selectedAuteurs.length > 0
    ? (auteursData?.citations || []).filter(c => selectedAuteurs.includes(c.category))
    : auteursData?.citations || []

  // Pick 1-2 random citations — stable across re-renders, only re-pick when data changes
  const pickFew = (items: CitationItem[]) => {
    if (items.length === 0) return []
    const count = items.length <= 2 ? items.length : (Math.random() < 0.5 ? 1 : 2)
    return shuffle(items).slice(0, count)
  }

  const themesKey = filteredThemes.map(c => c.id).join(',')
  const auteursKey = filteredAuteurs.map(c => c.id).join(',')
  const themesPickedRef = useRef<{ key: string; items: CitationItem[] }>({ key: '', items: [] })
  const auteursPickedRef = useRef<{ key: string; items: CitationItem[] }>({ key: '', items: [] })
  const displayThemes = themesKey !== themesPickedRef.current.key
    ? (themesPickedRef.current = { key: themesKey, items: pickFew(filteredThemes) }).items
    : themesPickedRef.current.items
  const displayAuteurs = auteursKey !== auteursPickedRef.current.key
    ? (auteursPickedRef.current = { key: auteursKey, items: pickFew(filteredAuteurs) }).items
    : auteursPickedRef.current.items

  // Search mode: filter all citations by text, show all matches
  const isSearching = searchQuery && searchQuery.length >= 2
  const searchResults = isSearching ? (() => {
    const q = searchQuery.toLowerCase()
    const all = [...(dailyData?.citations || []), ...(themesData?.citations || []), ...(auteursData?.citations || [])]
    return all.filter(c => c.text.toLowerCase().includes(q))
  })() : []

  // Load all data when searching
  useEffect(() => {
    if (!isSearching) return
    if (!dailyData) loadDaily()
    if (!themesData) loadThemes()
    if (!auteursData) loadAuteurs()
  }, [isSearching])

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="amber"
      label="Afficher Citations"
    >
      <div className="mb-4 sm:mb-6">
        <CardShell color="amber" noPadding>
          <div className={'px-5 pt-4 pb-2 flex items-center justify-between border-b ' + c.headerBorder + ' ' + c.headerBorderDark}>
<Link
                href="/citations"
                className="flex items-center gap-2"
              >
                <div className={'flex h-8 w-8 items-center justify-center rounded-full ' + c.iconBg + ' ' + c.iconBgDark}>
                  <Quote className={'h-4 w-4 text-white ' + c.iconForeground} />
                </div>
                <h3 className={'text-sm font-bold uppercase tracking-wide transition-colors ' + c.title + ' ' + c.linkHover + ' ' + c.titleDark + ' ' + c.linkHoverDark}>
                  {t('citation_tab')}
                </h3>
              </Link>
            <div className="flex items-center justify-between sm:justify-end sm:gap-3">
              {showToggle && onToggle && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle() }}
                  className={'transition-colors mr-2 sm:mr-4 ' + c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark}
                  title={t('hide_card')}
                  aria-label={t('hide_card')}
                >
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              <button
                onClick={handleRefresh}
                className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                title={t('refresh_content')}
                aria-label={t('refresh_content')}
              >
                <svg className={'h-4 w-4 sm:h-5 sm:w-5 ' + (loading ? 'animate-spin' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-2 pt-2">
            {isSearching ? (
            <div className="p-4">
              <p className={'text-xs mb-3 ' + c.muted + ' ' + c.mutedDark}>
                {searchResults.length > 0
                  ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} pour "${searchQuery}"`
                  : t('no_search_results')}
              </p>
              {searchResults.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {searchResults.map(item => (
                    <CitationItemRow
                      key={item.id}
                      item={item}
                      isFavorite={allFavorites.has(item.id)}
                      onToggleFavorite={handleBookmark}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Quote className={'h-8 w-8 mx-auto mb-2 ' + c.muted + ' ' + c.mutedDark} />
                  <p className="text-sm text-muted-foreground">Aucune citation trouvée</p>
                </div>
              )}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
              <TabsList className={'w-full h-auto bg-transparent p-0 gap-0 border-b rounded-none ' + c.headerBorder + ' ' + c.headerBorderDark}>
                {TABS.map(tab => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className={'flex-1 h-auto px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:' + c.tabActiveBg + ' dark:data-[state=active]:' + c.tabActiveBgDark.slice(6) + ' data-[state=active]:' + c.tabActiveText + ' dark:data-[state=active]:' + c.tabActiveTextDark.slice(6) + ' data-[state=active]:' + c.tabActiveBorder + ' dark:data-[state=active]:' + c.tabActiveBorderDark.slice(6)}
                  >
                    <tab.icon className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{t(tab.label)}</span>
                    <span className="sm:hidden">{t(tab.label).split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="p-4 min-h-[300px]">
                {/* Daily tab */}
                <TabsContent value="dujour" className="mt-0">
                  {error && !dailyData && !loading ? (
                    <div className="text-center py-8">
                      <p className={'text-sm ' + c.errorText + ' ' + c.errorTextDark}>
                        Impossible de charger la citation du jour.
                      </p>
                    </div>
                  ) : loading && !dailyData ? (
                    <div className="animate-pulse space-y-3">
                      <div className={'h-6 w-3/4 rounded ' + c.skeletonBg + ' ' + c.skeletonBgDark} />
                      <div className={'h-4 w-1/2 rounded ' + c.skeletonBg + ' ' + c.skeletonBgDark} />
                    </div>
                  ) : !dailyData?.citations?.[0] ? (
                    <div className="text-center py-8">
                      <Sparkles className={'h-8 w-8 mx-auto mb-2 ' + c.muted + ' ' + c.mutedDark} />
                      <p className="text-sm text-muted-foreground">Aucune citation du jour disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dailyData.citations.map(item => (
                        <div key={item.id} className={'p-5 rounded-lg border ' + c.itemBg + ' ' + c.itemBgDark + ' ' + c.itemBorder + ' ' + c.itemBorderDark}>
                          {item.imageUrl && (
                            <div className="flex justify-center mb-3">
                              <img
                                src={item.imageUrl}
                                alt={item.author}
                                className={'h-16 w-16 rounded-full object-cover border-2 ' + c.imageBorder + ' ' + c.imageBorderDark}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                          )}
                          <p className={'text-lg text-center leading-relaxed italic ' + c.bodyBold + ' ' + c.bodyBoldDark}>
                            &quot;{item.text}&quot;
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <span className={'text-sm font-semibold ' + c.body + ' ' + c.bodyDark}>
                              {item.author}
                            </span>
                            {item.source && (
                              <span className={'text-xs ' + c.muted + ' ' + c.mutedDark}>
                                • {item.source}
                              </span>
                            )}
                          </div>
       <div className="flex items-center justify-center gap-2 mt-3">
                               <Link
                                 href={sanitizeUrl(item.wikiUrl)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 onClick={(e) => e.stopPropagation()}
                                 className={'text-xs hover:underline ' + c.link + ' ' + c.linkHover + ' ' + c.linkDark + ' ' + c.linkHoverDark}
                               >
                                 {t('read_citation')}
                               </Link>
        <ShareToLobbyButton resourceId={item.id} resourceType="CITATION" meta={{ text: item.text, author: item.author, ...(item.source && { source: item.source }), url: item.wikiUrl, category: item.category }} />
                               {isLoggedIn && (
                               <button
                                 onClick={(e) => { e.stopPropagation(); handleBookmark(item.id, allFavorites.has(item.id)) }}
                                 className={c.action + ' ' + c.actionHover + ' ' + c.actionDark + ' ' + c.actionHoverDark + ' transition-colors'}
                                 title={allFavorites.has(item.id) ? t('remove_favorite') : t('add_favorite')}
                               >
                                 <Bookmark className={`h-4 w-4 ${allFavorites.has(item.id) ? 'fill-current' : ''}`} />
                               </button>
                               )}
                             </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Themes tab */}
                <TabsContent value="themes" className="mt-0">
                  {themeCategories.length > 0 && (
                    <div className="mb-3">
                      <button
                         onClick={() => setShowThemeFilters(!showThemeFilters)}
                         className={'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.hoverBg + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' ' + c.hoverBgDark}
                        >
                         <Filter className="h-3 w-3" />
                         {t('filter_categories')}
                         {selectedThemes.length > 0 && (
                           <span className={'ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-white text-[9px] ' + c.actionFilled + ' ' + c.actionFilledDark}>
                            {selectedThemes.length}
                          </span>
                        )}
                      </button>
                      {showThemeFilters && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {themeCategories.slice(0, 15).map(cat => (
                            <button
                              key={cat}
                              onClick={() => toggleTheme(cat)}
  className={'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ' + (selectedThemes.includes(cat) ? (c.pillSelectedBg + ' ' + c.pillSelectedBorder + ' ' + c.pillSelectedText + ' ' + c.pillSelectedBgDark + ' ' + c.pillSelectedBorderDark + ' ' + c.pillSelectedTextDark) : (c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.hoverBg + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' ' + c.hoverBgDark))}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {error && !themesData && !loading ? (
                    <div className="text-center py-8">
                      <p className={'text-sm ' + c.errorText + ' ' + c.errorTextDark}>
                        Impossible de charger les citations.
                      </p>
                    </div>
                  ) : loading && !themesData ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={'animate-pulse h-20 rounded-lg ' + c.skeletonBg + ' ' + c.skeletonBgDark} />
                      ))}
                    </div>
                  ) : !displayThemes.length ? (
                    <div className="text-center py-8">
                      <BookOpen className={'h-8 w-8 mx-auto mb-2 ' + c.muted + ' ' + c.mutedDark} />
                      <p className="text-sm text-muted-foreground">Aucune citation disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayThemes.map(item => (
                        <CitationItemRow
                          key={item.id}
                          item={item}
                          isFavorite={allFavorites.has(item.id)}
                          onToggleFavorite={handleBookmark}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Auteurs tab */}
                <TabsContent value="auteurs" className="mt-0">
                  {auteurCategories.length > 0 && (
                    <div className="mb-3">
                     <button
                         onClick={() => setShowAuteurFilters(!showAuteurFilters)}
                         className={'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ' + c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.hoverBg + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' ' + c.hoverBgDark}
                        >
                         <Filter className="h-3 w-3" />
                         {t('filter_categories')}
                         {selectedAuteurs.length > 0 && (
                           <span className={'ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-white text-[9px] ' + c.actionFilled + ' ' + c.actionFilledDark}>
                            {selectedAuteurs.length}
                          </span>
                        )}
                      </button>
                      {showAuteurFilters && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {auteurCategories.slice(0, 20).map(cat => (
                            <button
                              key={cat}
                              onClick={() => toggleAuteur(cat)}
 className={'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ' + (selectedAuteurs.includes(cat) ? (c.pillSelectedBg + ' ' + c.pillSelectedBorder + ' ' + c.pillSelectedText + ' ' + c.pillSelectedBgDark + ' ' + c.pillSelectedBorderDark + ' ' + c.pillSelectedTextDark) : (c.pillBorder + ' ' + c.pillBg + ' ' + c.pillText + ' ' + c.hoverBg + ' ' + c.pillBorderDark + ' ' + c.pillBgDark + ' ' + c.pillTextDark + ' ' + c.hoverBgDark))}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {error && !auteursData && !loading ? (
                    <div className="text-center py-8">
                      <p className={'text-sm ' + c.errorText + ' ' + c.errorTextDark}>
                        Impossible de charger les citations.
                      </p>
                    </div>
                  ) : loading && !auteursData ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={'animate-pulse h-20 rounded-lg ' + c.skeletonBg + ' ' + c.skeletonBgDark} />
                      ))}
                    </div>
                  ) : !displayAuteurs.length ? (
                    <div className="text-center py-8">
                      <User className={'h-8 w-8 mx-auto mb-2 ' + c.muted + ' ' + c.mutedDark} />
                      <p className="text-sm text-muted-foreground">Aucune citation disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayAuteurs.map(item => (
                        <CitationItemRow
                          key={item.id}
                          item={item}
                          isFavorite={allFavorites.has(item.id)}
                          onToggleFavorite={handleBookmark}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
         )}
          </div>
        </CardShell>
      </div>
    </CardVisibilityGuard>
  )
})
