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
import { ImageLightbox } from './image-lightbox'
import { ImageHint } from './image-hint'

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
  lastUpdated?: string
  nextUpdate?: string
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
      lastUpdated: data.lastUpdated,
      nextUpdate: data.nextUpdate,
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
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined)
  const [nextUpdate, setNextUpdate] = useState<string | undefined>(undefined)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    const result = await fetchF1Data()
    if (result) {
      setData(result.data)
      setFavorites(new Set(result.bookmarkedIds))
      setLastUpdated(result.lastUpdated)
      setNextUpdate(result.nextUpdate)
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
            <div className="flex flex-col">
              <Link href="/formula1" className="hover:underline cursor-pointer">
                <h3 className="text-sm font-bold uppercase tracking-wide text-red-800 dark:text-red-300">
                  {t('f1_tab')}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5">
                {lastUpdated && (
                  <span className="text-[10px] text-red-500 dark:text-red-400">
                    {new Date(lastUpdated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {nextUpdate && (
                  <span className="text-[10px] text-red-400 dark:text-red-500">
                    · {t('next_update', { date: new Date(nextUpdate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
                  </span>
                )}
              </div>
            </div>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
            <TabsList className="w-full h-auto bg-transparent p-0 gap-0 border-b border-red-200 dark:border-red-800 rounded-none">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={`flex-1 h-auto px-3 py-2 text-xs font-medium data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-800 dark:data-[state=active]:text-red-300 data-[state=active]:border-b-2 data-[state=active]:border-red-600 dark:data-[state=active]:border-red-500 rounded-none border-b-2 border-transparent data-[state=inactive]:border-transparent`}
                >
                <tab.icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{tab.key === 'image' || tab.key === 'actualites' ? '' : t(tab.label)}</span>
                <span className="sm:hidden">{tab.key === 'image' || tab.key === 'actualites' ? '' : t(tab.label).split(' ')[0]}</span>
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
                        <div
                          className="cursor-pointer"
                          onClick={() => data.image && setExpandedImage(data.image.imageUrl.replace(/\/\d+px-/, '/1280px-'))}
                        >
                          <img
                            src={data.image.imageUrl.replace(/\/\d+px-/, '/1280px-')}
                            alt={data.image.caption}
                            loading="lazy"
                            className="w-full h-[28rem] object-cover hover:opacity-90 transition-opacity"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      )}
                      <ImageHint color="rose" />
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
                    {expandedImage && (
                      <ImageLightbox
                        src={expandedImage}
                        alt={data.image.caption || ''}
                        onClose={() => setExpandedImage(null)}
                      />
                    )}
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
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.classement.map((standing, idx) => (
                      <div key={idx} className="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="bg-red-100 dark:bg-red-900/30 px-3 py-2">
                          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                            {standing.type === 'pilotes' ? t('f1_pilotes') : t('f1_constructeurs')}
                          </h4>
                        </div>
                        <div className="divide-y divide-red-100 dark:divide-red-900/30">
                          {(() => {
                            const firstRow = standing.rows[0]
                            const firstPoints = Number(firstRow?.points ?? 0)
                            return standing.rows.slice(0, 10).map((row) => (
                              <div key={row.pos} className={`flex items-center gap-2 px-3 py-2 text-sm ${row.pos <= 3 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${row.pos === 1 ? 'bg-green-600' : row.pos === 2 ? 'bg-blue-600' : row.pos === 3 ? 'bg-gray-500' : 'bg-red-600'}`}>
                                  {row.pos}
                                </span>
                                <span className="flex-1 text-red-900 dark:text-red-200 font-medium truncate">{row.name}</span>
                                <span className="text-red-600 dark:text-red-400 font-mono text-xs w-24 text-right">{row.pos === 1 ? `${row.points} pts` : `${row.points} pts (-${firstPoints - Number(row.points)})`}</span>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 overflow-x-auto">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">{t('f1_bareme')}</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-red-200 dark:border-red-800">
                          <th className="px-2 py-1 text-left font-medium text-red-700 dark:text-red-300">Position</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">1er</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">2e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">3e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">4e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">5e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">6e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">7e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">8e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">9e</th>
                          <th className="px-2 py-1 text-center font-medium text-red-700 dark:text-red-300">10e</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-red-100 dark:border-red-900/30">
                          <td className="px-2 py-1.5 font-medium text-red-800 dark:text-red-200">GP</td>
                          <td className="px-2 py-1.5 text-center text-green-600 dark:text-green-400 font-bold">25</td>
                          <td className="px-2 py-1.5 text-center text-blue-600 dark:text-blue-400 font-bold">18</td>
                          <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400 font-bold">15</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">12</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">10</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">8</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">6</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">4</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">2</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">1</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-medium text-red-800 dark:text-red-200">Sprint</td>
                          <td className="px-2 py-1.5 text-center text-green-600 dark:text-green-400 font-bold">8</td>
                          <td className="px-2 py-1.5 text-center text-blue-600 dark:text-blue-400 font-bold">7</td>
                          <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400 font-bold">6</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">5</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">4</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">3</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">2</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">1</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">-</td>
                          <td className="px-2 py-1.5 text-center text-red-600 dark:text-red-400">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  </>
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
