'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, X, Search, Lightbulb, Image as ImageIcon, Radio, Info, Newspaper, BookOpen, Earth, Video, Quote, Trash2, Trophy, Globe, Download, Sparkles } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { useSharedResources } from '@/hooks/use-shared-resources'
import { useShareToLobby } from '@/hooks/use-share-to-lobby'
import { useSourceCount } from '@/hooks/use-source-count'
import { RadioFranceFavorites } from './radio-france-favorites'
import { CnrsBookmarks } from '@/components/feed/cnrs-bookmarks'
import { type CompactIdea } from '@/types/idea'
import { normalizeAccents } from '@/lib/utils'
import { ImageDuJourBookmarks } from '@/components/feed/image-du-jour-bookmarks'
import { SaviezVousBookmarks } from '@/components/feed/saviez-vous-bookmarks'
import { ImageWikimediaFavorites } from './image-wikimedia-favorites'
import { ImageWikiLovesFavorites } from './image-wikiloves-favorites'
import { PixabayFavorites } from './pixabay-favorites'
import { PortailLexicalBookmarks } from './portail-lexical-bookmarks'
import { PortailWikipediaBookmarks } from './portail-wikipedia-bookmarks'
import { ProverbeBookmarks } from './proverbe-bookmarks'
import { NewsFavorites } from './news-favorites'
import { F1Favorites } from './f1-favorites'
import { CitationBookmarks } from './citation-bookmarks'
import { InsoliteBookmarks } from '@/components/feed/insolite-bookmarks'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { SearchResults } from '@/components/lobby/search-results'
import { useTranslations } from 'next-intl'

interface FavorisPageClientProps {
  ideas: CompactIdea[]
  userId?: string
  currentPage: number
  totalPages: number
  total: number
  radioFavoritesCount: number
  cnrsFavoritesCount: number
  imageDuJourFavoritesCount: number
  saviezVousFavoritesCount: number
  wikimediaFavoritesCount: number
  wikilovesFavoritesCount: number
  pixabayFavoritesCount: number
  portailLexicalCount: number
  portailWikipediaCount: number
  proverbeFavoritesCount: number
  newsFavoritesCount: number
  f1FavoritesCount: number
  citationFavoritesCount: number
  insoliteFavoritesCount: number
}

type Tab = 'idees' | 'radio-france' | 'cnrs-news' | 'image-du-jour' | 'saviez-vous' | 'image-wikimedia' | 'image-wikiloves' | 'image-pixabay' | 'portail-lexical' | 'portail-wikipedia' | 'proverbe' | 'news' | 'f1' | 'citation' | 'insolite' | 'results'

interface TabConfig {
  id: Tab
  label: string
  Icon: React.ElementType
  count: number
}

function IdeaShareButton({ idea }: { idea: CompactIdea }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/idees/${idea.slug}`
  const { handleShare, copied } = useItemShare({
    shareUrl,
    title: idea.title,
    text: idea.title,
    itemId: idea.id,
  })

  return <ShareButton onClick={handleShare} copied={copied} shareUrl={shareUrl} />
}

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total, radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, portailWikipediaCount, proverbeFavoritesCount, newsFavoritesCount, f1FavoritesCount, citationFavoritesCount, insoliteFavoritesCount }: FavorisPageClientProps) {
  const router = useRouter()
  const t = useTranslations('feed')
  const [activeTab, setActiveTab] = useState<Tab>(portailLexicalCount > 0 ? 'portail-lexical' : 'idees')
  const hasInitialSet = useRef(false)
  const initialTabSetRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const previousTabRef = useRef<Tab | null>(null)
  const { savedIdeaIds, handleBookmark } = useBookmarkToggle(ideas)

  // Shared resources (P3)
  const [sharedSaviezIds, setSharedSaviezIds] = useSharedResources('SAVIEZ_VOUS', userId)
  const [sharedImageIds, setSharedImageIds] = useSharedResources('IMAGE_DU_JOUR', userId)
  const [sharedWikiLovesIds, setSharedWikiLovesIds] = useSharedResources('IMAGE_WIKILOVES', userId)
  const [sharedWikimediaIds, setSharedWikimediaIds] = useSharedResources('IMAGE_WIKIMEDIA', userId)
  const [sharedProverbeIds, setSharedProverbeIds] = useSharedResources('PROVERBE', userId)

  // Derived count for ideas
  const originalIdsOnPage = useMemo(() => new Set(ideas.map(i => i.id)), [ideas])
  
  const currentBookmarkedOnPageCount = useMemo(() => {
    let count = 0
    for (const id of originalIdsOnPage) {
      if (savedIdeaIds.has(id)) {
        count++
      }
    }
    return count
  }, [originalIdsOnPage, savedIdeaIds])

  const diff = currentBookmarkedOnPageCount - originalIdsOnPage.size
  const derivedIdeasCount = total + diff

  // Source counts (P5)
  const [radioCount, handleRadioRemove] = useSourceCount(radioFavoritesCount)
  const [cnrsCount, handleCnrsRemove] = useSourceCount(cnrsFavoritesCount)
  const [imageDuJourCount, handleImageDuJourRemove] = useSourceCount(imageDuJourFavoritesCount)
  const [saviezVousCount, handleSaviezVousRemove] = useSourceCount(saviezVousFavoritesCount)
  const [wikimediaCount, handleWikimediaRemove] = useSourceCount(wikimediaFavoritesCount)
  const [wikilovesCount, handleWikiLovesRemove] = useSourceCount(wikilovesFavoritesCount)
  const [pixabayCount, handlePixabayRemove] = useSourceCount(pixabayFavoritesCount)
  const [portailLexCount, handlePortailLexRemove] = useSourceCount(portailLexicalCount)
  const [portailWikiCount, handlePortailWikiRemove] = useSourceCount(portailWikipediaCount)
  const [proverbeCount, handleProverbeRemove] = useSourceCount(proverbeFavoritesCount)
  const [newsCount, handleNewsRemove] = useSourceCount(newsFavoritesCount)
  const [f1Count, handleF1Remove] = useSourceCount(f1FavoritesCount)
  const [citationCount, handleCitationRemove] = useSourceCount(citationFavoritesCount)
  const [insoliteCount, handleInsoliteRemove] = useSourceCount(insoliteFavoritesCount)

  // Share-to-lobby handlers (P4)
  const { toggle: handleSaviezVousShareToLobby, isSharing: saviezIsSharing } =
    useShareToLobby('SAVIEZ_VOUS', sharedSaviezIds, setSharedSaviezIds, (v: string) => v)

  const { toggle: handleImageShareToLobby, isSharing: imageIsSharing } =
    useShareToLobby('IMAGE_DU_JOUR', sharedImageIds, setSharedImageIds,
      (item: any) => item.fileUrl, (item: any) => item)

  const { toggle: handleWikiLovesShareToLobby, isSharing: wikiLovesIsSharing } =
    useShareToLobby('IMAGE_WIKILOVES', sharedWikiLovesIds, setSharedWikiLovesIds,
      (item: any) => item.docid, (item: any) => item)

  const { toggle: handleWikimediaShareToLobby, isSharing: wikimediaIsSharing } =
    useShareToLobby('IMAGE_WIKIMEDIA', sharedWikimediaIds, setSharedWikimediaIds,
      (item: any) => item.docid, (item: any) => item)

  const { toggle: handleProverbeShareToLobby, isSharing: proverbeIsSharing } =
    useShareToLobby('PROVERBE', sharedProverbeIds, setSharedProverbeIds,
      (item: any) => item.id,
      (item: any) => ({
        text: item.text,
        signification: item.signification,
        source: item.source,
        wiktionnaireUrl: item.wiktionnaireUrl,
        etymologie: item.etymologie,
        definitions: item.definitions,
      }))

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = normalizeAccents(searchQuery).toLowerCase()
    return ideas.filter(idea => normalizeAccents(idea.title).toLowerCase().includes(q))
  }, [ideas, searchQuery])


  const pageUrl = useMemo(() => (page: number) => {
    if (page === 1) return '/favoris'
    return `/favoris?page=${page}`
  }, [])

  const tabConfig: TabConfig[] = useMemo(() => [
    ...(derivedIdeasCount > 0 ? [{ id: 'idees' as Tab, label: 'Idées', Icon: Lightbulb, count: derivedIdeasCount }] : []),
    { id: 'image-du-jour', label: 'Images', Icon: ImageIcon, count: imageDuJourCount },
    { id: 'image-wikimedia', label: 'Wikimedia', Icon: BookOpen, count: wikimediaCount },
    { id: 'image-wikiloves', label: 'Wiki Loves', Icon: Earth, count: wikilovesCount },
    { id: 'image-pixabay', label: 'Pixabay', Icon: Video, count: pixabayCount },
    { id: 'portail-lexical', label: 'Lexique', Icon: BookOpen, count: portailLexCount },
    { id: 'portail-wikipedia', label: 'Portail Wikipédia', Icon: Globe, count: portailWikiCount },
    { id: 'proverbe', label: 'Proverbes', Icon: Quote, count: proverbeCount },
    { id: 'saviez-vous', label: 'Saviez-vous ?', Icon: Info, count: saviezVousCount },
    { id: 'radio-france', label: 'Radio France', Icon: Radio, count: radioCount },
    { id: 'cnrs-news', label: 'CNRS', Icon: Newspaper, count: cnrsCount },
    { id: 'news', label: 'NEWS', Icon: Newspaper, count: newsCount },
    { id: 'f1', label: 'F1', Icon: Trophy, count: f1Count },
    { id: 'citation', label: 'Citations', Icon: Quote, count: citationCount },
    { id: 'insolite', label: 'Insolite', Icon: Sparkles, count: insoliteCount },
  ], [derivedIdeasCount, imageDuJourCount, wikimediaCount, wikilovesCount, pixabayCount, portailLexCount, portailWikiCount, proverbeCount, saviezVousCount, radioCount, cnrsCount, newsCount, f1Count, citationCount, insoliteCount])

  const sortedTabs = useMemo(() => {
    const lexical = tabConfig.find(t => t.id === 'portail-lexical')
    const others = tabConfig.filter(t => t.id !== 'portail-lexical').sort((a, b) => b.count - a.count)
    return lexical ? [lexical, ...others] : others
  }, [tabConfig])

  const searchResults = useMemo(() => {
    if (!searchQuery?.trim()) return []
    const results: Array<{ id: string; title: string; description: string; source: string; sourceTab: string; navigateTo: () => void }> = []
    
    filteredIdeas.forEach(idea => {
      results.push({
        id: `idea-${idea.id}`,
        title: idea.title,
        description: idea.source?.title || '',
        source: 'Idées',
        sourceTab: 'idees',
        navigateTo: () => setActiveTab('idees'),
      })
    })

    const sourceDescs: Record<string, string> = {
      'radio-france': 'documentaires Radio France',
      'cnrs-news': 'actualités CNRS',
      'news': 'actualités NEWS',
      'f1': 'favoris F1',
      'citation': 'citations favorites',
      'image-du-jour': 'images du jour',
      'saviez-vous': 'faits "Saviez-vous ?"',
      'image-wikimedia': 'images Wikimedia',
      'image-wikiloves': 'images Wiki Loves',
      'image-pixabay': 'vidéos Pixabay',
      'portail-lexical': 'mots du Lexique',
      'proverbe': 'proverbes',
      'portail-wikipedia': 'articles Portail Wikipédia',
      'insolite': 'articles insolites',
    }
    const counts: Record<string, number> = {
      'radio-france': radioCount, 'cnrs-news': cnrsCount, 'news': newsCount,
      'f1': f1Count, 'citation': citationCount, 'image-du-jour': imageDuJourCount,
      'saviez-vous': saviezVousCount, 'image-wikimedia': wikimediaCount,
      'image-wikiloves': wikilovesCount, 'image-pixabay': pixabayCount,
      'portail-lexical': portailLexCount, 'proverbe': proverbeCount,
      'portail-wikipedia': portailWikiCount, 'insolite': insoliteCount,
    }
    const tabLabels = Object.fromEntries(sortedTabs.map(t => [t.id, t.label]))
    for (const [tabId, count] of Object.entries(counts)) {
      if (count > 0) {
        results.push({
          id: `${tabId}-placeholder`,
          title: `${count} ${sourceDescs[tabId]}`,
          description: 'Cliquez pour voir les résultats',
          source: tabLabels[tabId],
          sourceTab: tabId,
          navigateTo: () => setActiveTab(tabId as Tab),
        })
      }
    }

    return results
  }, [searchQuery, filteredIdeas, radioCount, cnrsCount, newsCount, f1Count, citationCount, imageDuJourCount, saviezVousCount, wikimediaCount, wikilovesCount, pixabayCount, portailLexCount, portailWikiCount, proverbeCount, insoliteCount, sortedTabs])

  useEffect(() => {
    if (searchQuery?.trim()) {
      if (activeTab !== 'results') {
        previousTabRef.current = activeTab
        setActiveTab('results')
      }
    } else if (previousTabRef.current) {
      setActiveTab(previousTabRef.current)
      previousTabRef.current = null
    }
  }, [searchQuery, activeTab])

  useEffect(() => {
    if (!hasInitialSet.current && !initialTabSetRef.current && activeTab === 'idees' && derivedIdeasCount === 0) {
      const firstNonEmptyTab = sortedTabs.find(tab => tab.count > 0)
      if (firstNonEmptyTab) {
        hasInitialSet.current = true
        initialTabSetRef.current = true
        setActiveTab(firstNonEmptyTab.id)
      } else {
        hasInitialSet.current = true
        initialTabSetRef.current = true
      }
    }
  }, [sortedTabs, activeTab, derivedIdeasCount])

  return (
    <>
      <div className="relative mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans les favoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {userId && (
          <a
            href="/api/favorites/export"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary/90 hover:bg-muted rounded-lg transition-colors"
            title={t('export_html_title')}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('export_html')}</span>
          </a>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="space-y-6">
        <div className="w-full">
          <TabsList className="flex flex-wrap gap-x-1 gap-y-1 sm:gap-y-2 md:gap-y-2 lg:gap-y-2 xl:gap-y-1 h-auto pt-0 pb-20 bg-muted rounded-lg min-h-0">
            {searchQuery && (
              <TabsTrigger value="results" className="flex-shrink-0 w-[calc(50%-4px)] sm:w-[calc(50%-4px)] md:w-[calc(33.33%-4px)] lg:w-[calc(16.66%-4px)] xl:w-[calc(20%-4px)] h-auto flex items-start justify-center gap-1.5 px-2 py-1 text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer bg-muted data-active:bg-background" style={{ height: 'auto' }}>
                <Search className="h-4 w-4" /> Résultats ({searchResults.length})
              </TabsTrigger>
            )}
            {sortedTabs.map(({ id, label, Icon, count }) => (
              <TabsTrigger key={id} value={id} className="flex-shrink-0 w-[calc(50%-4px)] sm:w-[calc(50%-4px)] md:w-[calc(33.33%-4px)] lg:w-[calc(16.66%-4px)] xl:w-[calc(20%-4px)] h-auto flex items-start justify-center gap-1.5 px-2 py-1 text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer bg-muted data-active:bg-background" style={{ height: 'auto' }}>
                <Icon className="h-4 w-4" />
                {label} ({count})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="idees" className="mt-4">
          {searchQuery && filteredIdeas.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun favori pour &quot;{searchQuery}&quot;</p>
          )}

          {derivedIdeasCount === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vos favoris sont vides</h3>
              <p className="text-sm text-muted-foreground">
                Cliquez sur le bookmark d&apos;une idée pour la sauvegarder ici.
              </p>
              <Link href="/" className="mt-4 inline-block text-primary hover:underline">
                Découvrir des idées →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="group relative">
                  <CompactIdeaCard idea={{ ...idea, viewedAt: new Date().toISOString() }} />
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                    <IdeaShareButton idea={idea} />
                    <ShareToLobbyButton resourceId={idea.id} resourceType="IDEA" />
                    <button
                     type="button"
                     className="rounded-full bg-card/90 p-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted hover:text-foreground"
                     onClick={(e) => {
                       e.preventDefault()
                       e.stopPropagation()
                       handleBookmark(idea.id)
                     }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
                    </button>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                 <Pagination
                   currentPage={currentPage}
                   totalPages={totalPages}
                   pageUrl={pageUrl}
                 />
                )}

              {derivedIdeasCount > 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Page {currentPage} sur {totalPages} · {derivedIdeasCount} favori{derivedIdeasCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

      </TabsContent>

      <TabsContent value="results">
        <SearchResults searchQuery={searchQuery} results={searchResults} />
      </TabsContent>

      <TabsContent value="radio-france"><RadioFranceFavorites userId={userId} onRemoveComplete={handleRadioRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="cnrs-news"><CnrsBookmarks userId={userId} onRemoveComplete={handleCnrsRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="news"><NewsFavorites userId={userId} onRemoveComplete={handleNewsRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="f1"><F1Favorites userId={userId} onRemoveComplete={handleF1Remove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-du-jour"><ImageDuJourBookmarks userId={userId} onRemoveComplete={handleImageDuJourRemove} sharedIds={sharedImageIds} onShareToggle={handleImageShareToLobby} isSharing={imageIsSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="saviez-vous"><SaviezVousBookmarks userId={userId} onRemoveComplete={handleSaviezVousRemove} sharedIds={sharedSaviezIds} onShareToggle={handleSaviezVousShareToLobby} isSharing={saviezIsSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-wikimedia"><ImageWikimediaFavorites userId={userId} onRemoveComplete={handleWikimediaRemove} sharedIds={sharedWikimediaIds} onShareToggle={handleWikimediaShareToLobby} isSharing={wikimediaIsSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-wikiloves"><ImageWikiLovesFavorites userId={userId} onRemoveComplete={handleWikiLovesRemove} sharedIds={sharedWikiLovesIds} onShareToggle={handleWikiLovesShareToLobby} isSharing={wikiLovesIsSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-pixabay"><PixabayFavorites userId={userId} onRemoveComplete={handlePixabayRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="portail-lexical"><PortailLexicalBookmarks userId={userId} onRemoveComplete={handlePortailLexRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="portail-wikipedia"><PortailWikipediaBookmarks userId={userId} onRemoveComplete={handlePortailWikiRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="proverbe"><ProverbeBookmarks userId={userId} onRemoveComplete={handleProverbeRemove} sharedIds={sharedProverbeIds} onShareToggle={handleProverbeShareToLobby} isSharing={proverbeIsSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="citation"><CitationBookmarks userId={userId} onRemoveComplete={handleCitationRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="insolite"><InsoliteBookmarks userId={userId} onRemoveComplete={handleInsoliteRemove} searchQuery={searchQuery} /></TabsContent>
    </Tabs>
    </>
  )
}
