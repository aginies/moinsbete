'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Trophy, Newspaper, Image as ImageIcon, Bookmark, EyeOff, Star, Globe } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'
import { useItemShare } from './use-item-share'
import { CardVisibilityGuard } from './card-visibility-guard'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { toggleF1FavoriteAction } from '@/actions/f1-bookmark-actions'
import { useSimpleBookmarkToggle } from '@/hooks/use-simple-bookmark-toggle'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface F1CardProps {
  onToggle?: () => void
  showToggle?: boolean
  isVisible?: boolean
  userId?: string
}

interface F1Actualite {
  title: string
  date: string
  content: string
  url: string
  imageUrl?: string
}

interface F1Image {
  imageUrl: string
  caption: string
  articleLink: string
}

interface F1StandingRow {
  pos: number
  name: string
  points: string
}

interface F1Standing {
  type: 'pilotes' | 'constructeurs'
  rows: F1StandingRow[]
}

interface F1SaviezFact {
  id: string
  text: string
}

interface F1Data {
  actualites: F1Actualite[]
  image: F1Image | null
  classement: F1Standing[]
  saviez: F1SaviezFact[]
  fia: F1Actualite[]
}

const TABS = [
  { key: 'image', label: 'f1_tab_image', icon: ImageIcon },
  { key: 'actualites', label: 'f1_tab_actualites', icon: Newspaper },
  { key: 'fia', label: 'f1_tab_fia', icon: Globe },
  { key: 'classement', label: 'f1_tab_classement', icon: Trophy },
  { key: 'saviez', label: 'f1_tab_saviez', icon: Star },
] as const

interface FetchF1Result {
  data: F1Data
  bookmarkedIds: string[]
}

async function fetchF1Data(): Promise<FetchF1Result | null> {
  try {
    const res = await fetch('/api/f1?t=' + Date.now(), {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.sections || data.sections.length === 0) return null

    const actualites: F1Actualite[] = []
    let image: F1Image | null = null
    const classement: F1Standing[] = []
    const saviez: F1SaviezFact[] = []
    const fia: F1Actualite[] = []

    for (const section of data.sections) {
      switch (section.section) {
        case 'actualites': {
          const items = section.data as F1Actualite[]
          if (Array.isArray(items)) actualites.push(...items)
          break
        }
        case 'image': {
          image = section.data as F1Image
          break
        }
        case 'classement': {
          const standings = section.data as F1Standing[]
          if (Array.isArray(standings)) {
            classement.push(...standings)
          }
          break
        }
        case 'saviez': {
          const facts = section.data as { facts: string[] }
          if (facts?.facts) {
            facts.facts.forEach((f, i) => saviez.push({ id: `saviez-${i}`, text: f }))
          }
          break
        }
        case 'fia': {
          const items = section.data as F1Actualite[]
          if (Array.isArray(items)) fia.push(...items)
          break
        }
      }
    }

    return {
      data: { actualites, image, classement, saviez, fia },
      bookmarkedIds: data.bookmarkedIds || [],
    }
  } catch {
    return null
  }
}

export const F1Card = React.memo(function F1CardInner({
  onToggle,
  showToggle = true,
  isVisible,
  userId,
}: F1CardProps) {
  const t = useTranslations('feed')
  const [activeTab, setActiveTab] = useState('image')
  const [data, setData] = useState<F1Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    const result = await fetchF1Data()
    if (result) {
      setData(result.data)
      setFavorites(new Set(result.bookmarkedIds))
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  useAutoRefresh('f1', loadData)

  useEffect(() => {
    if (isVisible === false) return
    if (!data && !loading && !error) {
      const timer = setTimeout(() => loadData(), 0)
      return () => clearTimeout(timer)
    }
  }, [isVisible, data, loading, error])

  const handleBookmarkActualite = useCallback(async (url: string, isFav: boolean) => {
    const action = isFav ? 'remove' : 'add'
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(url)
      else next.add(url)
      return next
    })
    const actualite = data?.actualites.find(a => a.url === url)
    const article = actualite ?? data?.fia.find(a => a.url === url)
    if (article) {
      const section = actualite ? 'actualites' : 'fia'
      await toggleF1FavoriteAction(url, action, {
        title: article.title,
        section: section,
        imageUrl: article.imageUrl,
        url: article.url,
        date: article.date,
        content: article.content,
      }).catch(() => {
        setFavorites(prev => {
          const next = new Set(prev)
          if (isFav) next.add(url)
          else next.delete(url)
          return next
        })
      })
    }
  }, [data])

  const handleBookmarkFact = useCallback(async (factId: string, isFav: boolean) => {
    const action = isFav ? 'remove' : 'add'
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(factId)
      else next.add(factId)
      return next
    })
    const fact = data?.saviez.find(f => f.id === factId)
    if (fact) {
      await toggleF1FavoriteAction(factId, action, {
        title: fact.text.substring(0, 100),
        section: 'saviez',
        url: `https://fr.wikipedia.org/wiki/Portail:Formule_1#${factId}`,
        content: fact.text,
      }).catch(() => {
        setFavorites(prev => {
          const next = new Set(prev)
          if (isFav) next.add(factId)
          else next.delete(factId)
          return next
        })
      })
    }
  }, [data])

  const { handleShare, copied, shareUrl } = useItemShare({
    shareUrl: data?.actualites[0]?.url ?? '',
    title: data?.actualites[0]?.title ?? 'Formule 1',
    text: data?.actualites[0] ? `${data.actualites[0].title}\n\n${data.actualites[0].date}` : '',
  })

  const hasData = data && (data.actualites.length > 0 || data.image || data.classement.length > 0 || data.saviez.length > 0)

  return (
    <CardVisibilityGuard
      isVisible={isVisible}
      onToggle={onToggle}
      showToggle={showToggle}
      buttonColor="rose"
      label="Afficher Formule 1"
    >
      <div className="rounded-xl border-2 border-red-600 bg-gradient-to-br from-red-50 to-rose-50 p-0 dark:border-red-800 dark:from-red-950/30 dark:to-rose-950/30 hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 dark:bg-red-700">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <Link href="/formula1" className="hover:underline cursor-pointer">
              <h3 className="text-sm font-bold uppercase tracking-wide text-red-800 dark:text-red-300">
                {t('f1_tab')}
              </h3>
            </Link>
          </div>
           <div className="flex items-center gap-2">
             {showToggle && onToggle && (
               <button
                 onClick={(e) => { e.stopPropagation(); onToggle() }}
                 className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                 title={t('hide_card')}
                 aria-label={t('hide_card')}
               >
                 <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
               </button>
             )}
           </div>
        </div>

        <div className="px-2 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto bg-transparent p-0 gap-0 border-b border-red-200 dark:border-red-800 rounded-none">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={`flex-1 h-auto px-3 py-2 text-xs font-medium data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-800 dark:data-[state=active]:text-red-300 data-[state=active]:border-b-2 data-[state=active]:border-red-600 dark:data-[state=active]:border-red-500 rounded-none border-b-2 border-transparent data-[state=inactive]:border-transparent`}
                >
                  <tab.icon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{t(tab.label)}</span>
                  <span className="sm:hidden">{t(tab.label).split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-4 min-h-[300px]">
              <TabsContent value="actualites" className="mt-0">
                {error && !loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('no_article_loaded')}
                    </p>
                  </div>
                ) : loading && !hasData ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="h-4 w-16 bg-red-200 dark:bg-red-800 rounded" />
                        <div className="h-4 flex-1 bg-red-200 dark:bg-red-800 rounded" />
                      </div>
                    ))}
                  </div>
                ) : !data?.actualites?.length ? (
                  <div className="text-center py-8">
                    <Newspaper className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm text-muted-foreground">Aucune actualite F1 disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.actualites.map((article, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-red-100 dark:border-red-900/30 hover:bg-white dark:hover:bg-black/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={sanitizeUrl(article.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-red-900 dark:text-red-200 hover:underline line-clamp-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {article.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-red-500 dark:text-red-400">{article.date}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBookmarkActualite(article.url, favorites.has(article.url)) }}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title={favorites.has(article.url) ? t('remove_favorite') : t('add_favorite')}
                            >
                              <Bookmark className={`h-4 w-4 ${favorites.has(article.url) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                        {article.content && (
                          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed line-clamp-3 mt-2">
                            {article.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="image" className="mt-0">
                {error && !loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('no_image_loaded')}
                    </p>
                  </div>
                ) : loading && !data?.image ? (
                  <div className="animate-pulse h-48 bg-red-200 dark:bg-red-800 rounded-lg" />
                ) : !data?.image ? (
                  <div className="text-center py-8">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm text-muted-foreground">Aucune image disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-red-200 dark:border-red-800">
                      {data.image.imageUrl && (
                        <img
                          src={data.image.imageUrl.replace(/\/\d+px-/, '/1280px-')}
                          alt={data.image.caption}
                          loading="lazy"
                          className="w-full h-80 object-cover hover:opacity-90 transition-opacity"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                    {data.image.caption && (
                      <p className="text-sm text-red-800 dark:text-red-200 italic">{data.image.caption}</p>
                    )}
                    <Link
                      href={sanitizeUrl(data.image.articleLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('see_on_wikimedia')}
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="classement" className="mt-0">
                {error && !loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('no_article_loaded')}
                    </p>
                  </div>
                ) : loading && !data?.classement?.length ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-red-200 dark:bg-red-800 rounded" />
                    <div className="h-8 bg-red-200 dark:bg-red-800 rounded" />
                  </div>
                ) : !data?.classement?.length ? (
                  <div className="text-center py-8">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm text-muted-foreground">Aucun classement disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.classement.map((standing, idx) => (
                      <div key={idx} className="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="bg-red-100 dark:bg-red-900/30 px-3 py-2">
                          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                            {standing.type === 'pilotes' ? t('f1_pilotes') : t('f1_constructeurs')}
                          </h4>
                        </div>
                        <div className="divide-y divide-red-100 dark:divide-red-900/30">
                          {standing.rows.slice(0, 5).map((row) => (
                            <div key={row.pos} className="flex items-center gap-2 px-3 py-2 text-sm">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                                {row.pos}
                              </span>
                              <span className="flex-1 text-red-900 dark:text-red-200 font-medium truncate">{row.name}</span>
                              <span className="text-red-600 dark:text-red-400 font-mono text-xs">{row.points} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fia" className="mt-0">
                {error && !loading ? (
                   <div className="text-center py-8">
                     <p className="text-sm text-red-600 dark:text-red-400">
                       {t('no_article_loaded')}
                     </p>
                   </div>
                 ) : loading && !data?.fia?.length ? (
                   <div className="space-y-3 py-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="animate-pulse flex items-center gap-3">
                         <div className="h-4 w-16 bg-red-200 dark:bg-red-800 rounded" />
                         <div className="h-4 flex-1 bg-red-200 dark:bg-red-800 rounded" />
                       </div>
                     ))}
                   </div>
                 ) : !data?.fia?.length ? (
                   <div className="text-center py-8">
                     <Globe className="h-8 w-8 mx-auto mb-2 text-red-400" />
                     <p className="text-sm text-muted-foreground">Aucune actualite FIA disponible</p>
                   </div>
                 ) : (
                    <div className="space-y-3">
                      {data.fia.map((article, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-red-100 dark:border-red-900/30 hover:bg-white dark:hover:bg-black/30 transition-colors overflow-hidden">
                          {article.imageUrl && (
                            <div className="flex-shrink-0 w-40">
                              <Link
                                href={sanitizeUrl(article.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img
                                  src={sanitizeUrl(article.imageUrl, '')}
                                  alt={article.title}
                                  loading="lazy"
                                  className="w-full h-24 object-cover transition-opacity hover:opacity-90 rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              </Link>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={sanitizeUrl(article.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-red-900 dark:text-red-200 hover:underline line-clamp-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {article.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-red-500 dark:text-red-400">{article.date}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleBookmarkActualite(article.url, favorites.has(article.url)) }}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                  title={favorites.has(article.url) ? t('remove_favorite') : t('add_favorite')}
                                >
                                  <Bookmark className={`h-4 w-4 ${favorites.has(article.url) ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </div>
                            {article.content && (
                              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed line-clamp-3 mt-2">
                                {article.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="saviez" className="mt-0">
                {error && !loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('no_article_loaded')}
                    </p>
                  </div>
                ) : loading && !data?.saviez?.length ? (
                  <div className="space-y-3 py-4">
                    {[1, 2].map(i => (
                      <div key={i} className="animate-pulse h-20 bg-red-200 dark:bg-red-800 rounded-lg" />
                    ))}
                  </div>
                ) : !data?.saviez?.length ? (
                  <div className="text-center py-8">
                    <Star className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm text-muted-foreground">Aucune information disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.saviez.slice(0, 5).map((fact) => (
                      <div key={fact.id} className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-red-100 dark:border-red-900/30 hover:bg-white dark:hover:bg-black/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{fact.text}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookmarkFact(fact.id, favorites.has(fact.id)) }}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title={favorites.has(fact.id) ? t('remove_favorite') : t('add_favorite')}
                          >
                            <Bookmark className={`h-4 w-4 ${favorites.has(fact.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
          <div className="px-4 pb-3">
            <Link
              href={activeTab === 'fia' ? 'https://www.fia.com/f1' : 'https://fr.wikipedia.org/wiki/Portail:Formule_1'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
            >
              {activeTab === 'fia' ? 'Visitez FIA.com' : 'Portail Formule 1 sur Wikipédia'}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </CardVisibilityGuard>
  )
})
