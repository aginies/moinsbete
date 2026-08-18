'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, X, Search, Lightbulb, Image as ImageIcon, Radio, Info, Newspaper, BookOpen, Earth, Video, Quote, Trash2, Trophy, Globe, Download, Sparkles, Telescope, Plane } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { ShareToLobbyButton } from '@/components/lobby/share-to-lobby-button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { useSharedResources } from '@/hooks/use-shared-resources'
import { useShareToLobby } from '@/hooks/use-share-to-lobby'
import { useAllSourceCounts } from '@/hooks/use-all-source-counts'
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
import { ApodBookmarks } from '@/components/feed/apod-bookmarks'
import { AirCrashBookmarks } from '@/components/feed/air-crash-bookmarks'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { SearchResults } from '@/components/lobby/search-results'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

interface FavorisPageClientProps {
  ideas: CompactIdea[]
  userId?: string
  currentPage: number
  totalPages: number
  total: number
  counts: Record<string, number>
}

type Tab = 'idees' | 'radio-france' | 'cnrs-news' | 'image-du-jour' | 'saviez-vous' | 'image-wikimedia' | 'image-wikiloves' | 'image-pixabay' | 'portail-lexical' | 'portail-wikipedia' | 'proverbe' | 'news' | 'f1' | 'citation' | 'insolite' | 'apod' | 'air-crash' | 'results'

interface SourceTabConfig {
  id: Tab
  countKey: string
  label: string
  Icon: LucideIcon
  component: React.ReactNode
  sourceDesc: string
}

const triggerClass =
  'flex-shrink-0 w-[calc(50%-4px)] sm:w-[calc(50%-4px)] md:w-[calc(33.33%-4px)] lg:w-[calc(16.66%-4px)] xl:w-[calc(20%-4px)] h-auto flex items-start justify-center gap-1.5 px-2 py-1 text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer bg-muted data-active:bg-background'

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

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total, counts }: FavorisPageClientProps) {
  const router = useRouter()
  const t = useTranslations('feed')
  const [activeTab, setActiveTab] = useState<Tab>(counts.portailLexical > 0 ? 'portail-lexical' : 'idees')
  const hasInitialSet = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const previousTabRef = useRef<Tab | null>(null)
  const { savedIdeaIds, handleBookmark } = useBookmarkToggle(ideas)

  // Shared resources
  const [sharedSaviezIds, setSharedSaviezIds] = useSharedResources('SAVIEZ_VOUS', userId)
  const [sharedImageIds, setSharedImageIds] = useSharedResources('IMAGE_DU_JOUR', userId)
  const [sharedWikiLovesIds, setSharedWikiLovesIds] = useSharedResources('IMAGE_WIKILOVES', userId)
  const [sharedWikimediaIds, setSharedWikimediaIds] = useSharedResources('IMAGE_WIKIMEDIA', userId)
  const [sharedProverbeIds, setSharedProverbeIds] = useSharedResources('PROVERBE', userId)
  const [sharedApodIds, setSharedApodIds] = useSharedResources('APOD', userId)

  // Derived count for ideas
  const originalIdsOnPage = useMemo(() => new Set(ideas.map(i => i.id)), [ideas])
  const currentBookmarkedOnPageCount = useMemo(() => {
    let count = 0
    for (const id of originalIdsOnPage) {
      if (savedIdeaIds.has(id)) count++
    }
    return count
  }, [originalIdsOnPage, savedIdeaIds])
  const diff = currentBookmarkedOnPageCount - originalIdsOnPage.size
  const derivedIdeasCount = total + diff

  // All source counts (replaces 15 useSourceCount)
  const { counts: c, handleRemove } = useAllSourceCounts(counts)

  // Share-to-lobby handlers
  const { toggle: handleSaviezShare, isSharing: saviezIsSharing } =
    useShareToLobby('SAVIEZ_VOUS', sharedSaviezIds, setSharedSaviezIds, (v: string) => v)
  const { toggle: handleImageShare, isSharing: imageIsSharing } =
    useShareToLobby<{ fileUrl: string }>('IMAGE_DU_JOUR', sharedImageIds, setSharedImageIds, (item) => item.fileUrl, (item) => item)
  const { toggle: handleWikiLovesShare, isSharing: wikiLovesIsSharing } =
    useShareToLobby<{ docid: string }>('IMAGE_WIKILOVES', sharedWikiLovesIds, setSharedWikiLovesIds, (item) => item.docid, (item) => item)
  const { toggle: handleWikimediaShare, isSharing: wikimediaIsSharing } =
    useShareToLobby<{ docid: string }>('IMAGE_WIKIMEDIA', sharedWikimediaIds, setSharedWikimediaIds, (item) => item.docid, (item) => item)
  const { toggle: handleProverbeShare, isSharing: proverbeIsSharing } =
    useShareToLobby<{ id: string; text: string; signification: string; source: string; wiktionnaireUrl?: string; etymologie?: string; definitions?: string[] }>('PROVERBE', sharedProverbeIds, setSharedProverbeIds, (item) => item.id,
      (item) => ({ text: item.text, signification: item.signification, source: item.source, wiktionnaireUrl: item.wiktionnaireUrl, etymologie: item.etymologie, definitions: item.definitions }))
  const { toggle: handleApodShare, isSharing: apodIsSharing } =
    useShareToLobby<{ id: string; titre: string; auteur: string; imageUrl: string; link: string; droits: string; description: string }>('APOD', sharedApodIds, setSharedApodIds, (item) => item.id,
      (item) => ({ titre: item.titre, auteur: item.auteur, imageUrl: item.imageUrl, link: item.link, droits: item.droits, description: item.description }))

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = normalizeAccents(searchQuery).toLowerCase()
    return ideas.filter(idea => normalizeAccents(idea.title).toLowerCase().includes(q))
  }, [ideas, searchQuery])

  const pageUrl = useMemo(() => (page: number) => (page === 1 ? '/favoris' : `/favoris?page=${page}`), [])

  // Tab config - data driven
  const tabConfig = useMemo((): SourceTabConfig[] => {
    const base: SourceTabConfig[] = [
      { id: 'image-du-jour', countKey: 'imageDuJour', label: 'Images', Icon: ImageIcon, sourceDesc: 'images du jour', component: <ImageDuJourBookmarks userId={userId} onRemoveComplete={() => handleRemove('imageDuJour')} sharedIds={sharedImageIds} onShareToggle={handleImageShare} isSharing={imageIsSharing} searchQuery={searchQuery} /> },
      { id: 'image-wikimedia', countKey: 'wikimedia', label: 'Wikimedia', Icon: BookOpen, sourceDesc: 'images Wikimedia', component: <ImageWikimediaFavorites userId={userId} onRemoveComplete={() => handleRemove('wikimedia')} sharedIds={sharedWikimediaIds} onShareToggle={handleWikimediaShare} isSharing={wikimediaIsSharing} searchQuery={searchQuery} /> },
      { id: 'image-wikiloves', countKey: 'wikiloves', label: 'Wiki Loves', Icon: Earth, sourceDesc: 'images Wiki Loves', component: <ImageWikiLovesFavorites userId={userId} onRemoveComplete={() => handleRemove('wikiloves')} sharedIds={sharedWikiLovesIds} onShareToggle={handleWikiLovesShare} isSharing={wikiLovesIsSharing} searchQuery={searchQuery} /> },
      { id: 'image-pixabay', countKey: 'pixabay', label: 'Pixabay', Icon: Video, sourceDesc: 'vidéos Pixabay', component: <PixabayFavorites userId={userId} onRemoveComplete={() => handleRemove('pixabay')} searchQuery={searchQuery} /> },
      { id: 'portail-lexical', countKey: 'portailLexical', label: 'Lexique', Icon: BookOpen, sourceDesc: 'mots du Lexique', component: <PortailLexicalBookmarks userId={userId} onRemoveComplete={() => handleRemove('portailLexical')} searchQuery={searchQuery} /> },
      { id: 'portail-wikipedia', countKey: 'portailWikipedia', label: 'Portail Wikipédia', Icon: Globe, sourceDesc: 'articles Portail Wikipédia', component: <PortailWikipediaBookmarks userId={userId} onRemoveComplete={() => handleRemove('portailWikipedia')} searchQuery={searchQuery} /> },
      { id: 'proverbe', countKey: 'proverbe', label: 'Proverbes', Icon: Quote, sourceDesc: 'proverbes', component: <ProverbeBookmarks userId={userId} onRemoveComplete={() => handleRemove('proverbe')} sharedIds={sharedProverbeIds} onShareToggle={handleProverbeShare} isSharing={proverbeIsSharing} searchQuery={searchQuery} /> },
      { id: 'saviez-vous', countKey: 'saviezVous', label: 'Saviez-vous ?', Icon: Info, sourceDesc: 'faits "Saviez-vous ?"', component: <SaviezVousBookmarks userId={userId} onRemoveComplete={() => handleRemove('saviezVous')} sharedIds={sharedSaviezIds} onShareToggle={handleSaviezShare} isSharing={saviezIsSharing} searchQuery={searchQuery} /> },
      { id: 'radio-france', countKey: 'radioFrance', label: 'Radio France', Icon: Radio, sourceDesc: 'documentaires Radio France', component: <RadioFranceFavorites userId={userId} onRemoveComplete={() => handleRemove('radioFrance')} searchQuery={searchQuery} /> },
      { id: 'cnrs-news', countKey: 'cnrs', label: 'CNRS', Icon: Newspaper, sourceDesc: 'actualités CNRS', component: <CnrsBookmarks userId={userId} onRemoveComplete={() => handleRemove('cnrs')} searchQuery={searchQuery} /> },
      { id: 'news', countKey: 'news', label: 'NEWS', Icon: Newspaper, sourceDesc: 'actualités NEWS', component: <NewsFavorites userId={userId} onRemoveComplete={() => handleRemove('news')} searchQuery={searchQuery} /> },
      { id: 'f1', countKey: 'f1', label: 'F1', Icon: Trophy, sourceDesc: 'favoris F1', component: <F1Favorites userId={userId} onRemoveComplete={() => handleRemove('f1')} searchQuery={searchQuery} /> },
      { id: 'citation', countKey: 'citation', label: 'Citations', Icon: Quote, sourceDesc: 'citations favorites', component: <CitationBookmarks userId={userId} onRemoveComplete={() => handleRemove('citation')} searchQuery={searchQuery} /> },
      { id: 'insolite', countKey: 'insolite', label: 'Insolite', Icon: Sparkles, sourceDesc: 'articles insolites', component: <InsoliteBookmarks userId={userId} onRemoveComplete={() => handleRemove('insolite')} searchQuery={searchQuery} /> },
      { id: 'apod', countKey: 'apod', label: 'APOD', Icon: Telescope, sourceDesc: 'images APOD', component: <ApodBookmarks userId={userId} onRemoveComplete={() => handleRemove('apod')} sharedIds={sharedApodIds} onShareToggle={handleApodShare} isSharing={apodIsSharing} searchQuery={searchQuery} /> },
      { id: 'air-crash', countKey: 'airCrash', label: 'Air Crash Investigation', Icon: Plane, sourceDesc: 'accidents aériens', component: <AirCrashBookmarks userId={userId} onRemoveComplete={() => handleRemove('airCrash')} searchQuery={searchQuery} /> },
    ]
    if (derivedIdeasCount > 0) {
      base.unshift({ id: 'idees', countKey: 'idees', label: 'Idées', Icon: Lightbulb, sourceDesc: 'idées favorites', component: <div /> })
    }
    return base
  }, [userId, derivedIdeasCount, c, handleRemove, sharedSaviezIds, sharedImageIds, sharedWikiLovesIds, sharedWikimediaIds, sharedProverbeIds, sharedApodIds, searchQuery, imageIsSharing, saviezIsSharing, wikiLovesIsSharing, wikimediaIsSharing, proverbeIsSharing, apodIsSharing])

  const sortedTabs = useMemo(() => {
    const lexical = tabConfig.find(t => t.id === 'portail-lexical')
    const others = tabConfig.filter(t => t.id !== 'portail-lexical').sort((a, b) => (c[b.countKey] || 0) - (c[a.countKey] || 0))
    return lexical ? [lexical, ...others] : others
  }, [tabConfig, c])

  const searchResults = useMemo(() => {
    if (!searchQuery?.trim()) return []
    const results: Array<{ id: string; title: string; description: string; source: string; sourceTab: string; navigateTo: () => void }> = []
    filteredIdeas.forEach(idea => {
      results.push({ id: `idea-${idea.id}`, title: idea.title, description: idea.source?.title || '', source: 'Idées', sourceTab: 'idees', navigateTo: () => setActiveTab('idees') })
    })
    const tabLabels = Object.fromEntries(sortedTabs.map(t => [t.id, t.label]))
    for (const tab of sortedTabs) {
      const count = c[tab.countKey] || 0
      if (count > 0) {
        results.push({ id: `${tab.id}-placeholder`, title: `${count} ${tab.sourceDesc}`, description: 'Cliquez pour voir les résultats', source: tabLabels[tab.id], sourceTab: tab.id, navigateTo: () => setActiveTab(tab.id) })
      }
    }
    return results
  }, [searchQuery, filteredIdeas, c, sortedTabs])

  useEffect(() => {
    if (searchQuery?.trim()) {
      if (activeTab !== 'results') { previousTabRef.current = activeTab; setActiveTab('results') }
    } else if (previousTabRef.current) { setActiveTab(previousTabRef.current); previousTabRef.current = null }
  }, [searchQuery, activeTab])

  useEffect(() => {
    if (!hasInitialSet.current && activeTab === 'idees' && derivedIdeasCount === 0) {
      const first = sortedTabs.find(tab => (c[tab.countKey] || 0) > 0)
      if (first) { hasInitialSet.current = true; setActiveTab(first.id) }
      else { hasInitialSet.current = true }
    }
  }, [sortedTabs, activeTab, derivedIdeasCount, c])

  // Build TabsContent map for loop rendering
  const tabsContentMap = useMemo(() => new Map<Tab, React.ReactNode>(tabConfig.map(t => [t.id, t.component])), [tabConfig])

  return (
    <>
      <div className="relative mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Rechercher dans les favoris..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
          {searchQuery && (
            <button type="button" className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {userId && (
          <a href="/api/favorites/export" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary/90 hover:bg-muted rounded-lg transition-colors" title={t('export_html_title')}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('export_html')}</span>
          </a>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="space-y-6">
        <div className="w-full">
          <TabsList className="flex flex-wrap gap-x-1 gap-y-1 sm:gap-y-2 md:gap-y-2 lg:gap-y-2 xl:gap-y-1 h-auto pt-0 pb-20 bg-muted rounded-lg min-h-0">
            {searchQuery && (
              <TabsTrigger value="results" className={triggerClass} style={{ height: 'auto' }}>
                <Search className="h-4 w-4" /> Résultats ({searchResults.length})
              </TabsTrigger>
            )}
            {sortedTabs.map(tab => {
              const count = tab.id === 'idees' ? derivedIdeasCount : (c[tab.countKey] || 0)
              return (
                <TabsTrigger key={tab.id} value={tab.id} className={triggerClass} style={{ height: 'auto' }}>
                  <tab.Icon className="h-4 w-4" />
                  {tab.label} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="idees" className="mt-4">
          {searchQuery && filteredIdeas.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun favori pour &quot;{searchQuery}&quot;</p>}
          {derivedIdeasCount === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vos favoris sont vides</h3>
              <p className="text-sm text-muted-foreground">Cliquez sur le bookmark d&apos;une idée pour la sauvegarder ici.</p>
              <Link href="/" className="mt-4 inline-block text-primary hover:underline">Découvrir des idées →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="group relative">
                  <CompactIdeaCard idea={idea} />
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                    <IdeaShareButton idea={idea} />
                    <ShareToLobbyButton resourceId={idea.id} resourceType="IDEA" />
                    <button type="button" className="rounded-full bg-card/90 p-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBookmark(idea.id) }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
                    </button>
                  </div>
                </div>
              ))}
              {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} pageUrl={pageUrl} />}
              {derivedIdeasCount > 0 && <p className="py-4 text-center text-xs text-muted-foreground">Page {currentPage} sur {totalPages} · {derivedIdeasCount} favori{derivedIdeasCount !== 1 ? 's' : ''}</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results"><SearchResults searchQuery={searchQuery} results={searchResults} /></TabsContent>

        {sortedTabs.filter(t => t.id !== 'idees').map(tab => (
          <TabsContent key={tab.id} value={tab.id}>{tabsContentMap.get(tab.id)}</TabsContent>
        ))}
      </Tabs>
    </>
  )
}
