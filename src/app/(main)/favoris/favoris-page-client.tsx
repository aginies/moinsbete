'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Bookmark, X, Search, Lightbulb, Image as ImageIcon, Radio, Info, Newspaper, BookOpen, Earth, Video, Share2 } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { RadioFranceFavorites } from './radio-france-favorites'
import { CnrsBookmarks } from '@/components/feed/cnrs-bookmarks'
import { type CompactIdea } from '@/types/idea'
import { normalizeAccents } from '@/lib/utils'
import { ImageDuJourBookmarks } from '@/components/feed/image-du-jour-bookmarks'
import { SaviezVousBookmarks } from '@/components/feed/saviez-vous-bookmarks'
import { ImageWikimediaFavorites } from './image-wikimedia-favorites'
import { ImageWikiLovesFavorites } from './image-wikiloves-favorites'
import { PixabayFavorites } from './pixabay-favorites'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { shareToLobby, unshareFromLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'

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
}

type Tab = 'idees' | 'radio-france' | 'cnrs-news' | 'image-du-jour' | 'saviez-vous' | 'image-wikimedia' | 'image-wikiloves' | 'image-pixabay'

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

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total, radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount }: FavorisPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('idees')
  const [searchQuery, setSearchQuery] = useState('')
  const { savedIdeaIds, handleBookmark, isPending } = useBookmarkToggle(ideas)
  const [sharedIdeaIds, setSharedIdeaIds] = useState<Set<string>>(new Set())
  const [isSharing, setIsSharing] = useState<string | null>(null)

  // Derived count for ideas to update immediately when bookmarks are toggled
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

  // State-based counts for other tabs to support instant/optimistic updates on removal
  const [radioCount, setRadioCount] = useState(radioFavoritesCount)
  const [cnrsCount, setCnrsCount] = useState(cnrsFavoritesCount)
  const [imageDuJourCount, setImageDuJourCount] = useState(imageDuJourFavoritesCount)
  const [saviezVousCount, setSaviezVousCount] = useState(saviezVousFavoritesCount)
  const [wikimediaCount, setWikimediaCount] = useState(wikimediaFavoritesCount)
  const [wikilovesCount, setWikilovesCount] = useState(wikilovesFavoritesCount)
  const [pixabayCount, setPixabayCount] = useState(pixabayFavoritesCount)

  useEffect(() => {
    setRadioCount(radioFavoritesCount)
    setCnrsCount(cnrsFavoritesCount)
    setImageDuJourCount(imageDuJourFavoritesCount)
    setSaviezVousCount(saviezVousFavoritesCount)
    setWikimediaCount(wikimediaFavoritesCount)
    setWikilovesCount(wikilovesFavoritesCount)
    setPixabayCount(pixabayFavoritesCount)
  }, [radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount])

  const handleRadioRemove = useCallback(() => {
    setRadioCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleCnrsRemove = useCallback(() => {
    setCnrsCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleImageDuJourRemove = useCallback(() => {
    setImageDuJourCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleSaviezVousRemove = useCallback(() => {
    setSaviezVousCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleWikimediaRemove = useCallback(() => {
    setWikimediaCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleWikiLovesRemove = useCallback(() => {
    setWikilovesCount(prev => Math.max(0, prev - 1))
  }, [])

  const handlePixabayRemove = useCallback(() => {
    setPixabayCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleShareToLobby = async (ideaId: string) => {
    setIsSharing(ideaId)
    try {
      const isShared = sharedIdeaIds.has(ideaId)
      if (isShared) {
        await unshareFromLobby(ideaId)
        setSharedIdeaIds(prev => {
          const next = new Set(prev)
          next.delete(ideaId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareToLobby(ideaId)
        if (result.success) {
          setSharedIdeaIds(prev => new Set([...prev, ideaId]))
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(null)
    }
  }

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
      { id: 'idees', label: 'Idées', Icon: Lightbulb, count: derivedIdeasCount },
      { id: 'image-du-jour', label: 'Images', Icon: ImageIcon, count: imageDuJourCount },
      { id: 'image-wikimedia', label: 'Wikimedia', Icon: BookOpen, count: wikimediaCount },
       { id: 'image-wikiloves', label: 'Wiki Loves', Icon: Earth, count: wikilovesCount },
       { id: 'image-pixabay', label: 'Pixabay', Icon: Video, count: pixabayCount },
      { id: 'saviez-vous', label: 'Saviez-vous ?', Icon: Info, count: saviezVousCount },
      { id: 'radio-france', label: 'Radio France', Icon: Radio, count: radioCount },
      { id: 'cnrs-news', label: 'CNRS', Icon: Newspaper, count: cnrsCount },
    ], [derivedIdeasCount, imageDuJourCount, wikimediaCount, wikilovesCount, pixabayCount, saviezVousCount, radioCount, cnrsCount])

  const sortedTabs = useMemo(() =>
    [...tabConfig].sort((a, b) => b.count - a.count),
    [tabConfig]
  )

  const hasInitialSet = useRef(false)

  useEffect(() => {
    if (!hasInitialSet.current && activeTab === 'idees' && derivedIdeasCount === 0) {
      const firstNonEmptyTab = sortedTabs.find(tab => tab.count > 0)
      if (firstNonEmptyTab) {
        hasInitialSet.current = true
        setActiveTab(firstNonEmptyTab.id)
      } else {
        hasInitialSet.current = true
      }
    }
  }, [sortedTabs, activeTab, derivedIdeasCount])

  return (
    <div>
      <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 border-b border-border overflow-x-auto" role="tablist" aria-label="Favoris">
        {sortedTabs.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label} ({count})
          </button>
        ))}
      </div>

      {activeTab === 'idees' && (
        <div role="tabpanel" id="panel-idees" className="mt-4">
          <div className="relative mb-6">
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

          {searchQuery && filteredIdeas.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun favori pour "{searchQuery}"</p>
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
                <button
                  type="button"
                  className="rounded-full bg-card/90 p-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleShareToLobby(idea.id)
                  }}
                  disabled={isSharing === idea.id}
                  title="Partager au lobby"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                 type="button"
                 className="rounded-full bg-card/90 p-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted hover:text-foreground"
                 onClick={(e) => {
                   e.preventDefault()
                   e.stopPropagation()
                   handleBookmark(idea.id)
                 }}
               >
                 <X className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
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
        </div>
      )}

      {activeTab === 'radio-france' && <div role="tabpanel" id="panel-radio-france"><RadioFranceFavorites userId={userId} onRemoveComplete={handleRadioRemove} /></div>}

      {activeTab === 'cnrs-news' && <div role="tabpanel" id="panel-cnrs-news"><CnrsBookmarks userId={userId} onRemoveComplete={handleCnrsRemove} /></div>}

      {activeTab === 'image-du-jour' && <div role="tabpanel" id="panel-image-du-jour"><ImageDuJourBookmarks userId={userId} onRemoveComplete={handleImageDuJourRemove} /></div>}

      {activeTab === 'saviez-vous' && <div role="tabpanel" id="panel-saviez-vous"><SaviezVousBookmarks userId={userId} onRemoveComplete={handleSaviezVousRemove} /></div>}

      {activeTab === 'image-wikimedia' && <div role="tabpanel" id="panel-image-wikimedia"><ImageWikimediaFavorites userId={userId} onRemoveComplete={handleWikimediaRemove} /></div>}

      {activeTab === 'image-wikiloves' && <div role="tabpanel" id="panel-image-wikiloves"><ImageWikiLovesFavorites userId={userId} onRemoveComplete={handleWikiLovesRemove} /></div>}

      {activeTab === 'image-pixabay' && <div role="tabpanel" id="panel-image-pixabay"><PixabayFavorites userId={userId} onRemoveComplete={handlePixabayRemove} /></div>}
    </div>
  )
}
