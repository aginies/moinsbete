'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Bookmark, X, Search, Lightbulb, Image as ImageIcon, Radio, Info, Newspaper, BookOpen, Earth, Video, Share2, Quote } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { RadioFranceFavorites } from './radio-france-favorites'
import { CnrsBookmarks } from '@/components/feed/cnrs-bookmarks'
import { type CompactIdea } from '@/types/idea'
import { type ImageDuJourFavoriteDoc } from '@/lib/image-du-jour-bookmark'
import { type WikiLovesImageFavoriteDoc } from '@/lib/image-wikiloves-bookmark'
import { type WikimediaImageFavoriteDoc } from '@/lib/image-wikimedia-bookmark'
import { type ProverbeFavoriteDoc } from '@/lib/proverbe-bookmark'
import { normalizeAccents } from '@/lib/utils'
import { ImageDuJourBookmarks } from '@/components/feed/image-du-jour-bookmarks'
import { SaviezVousBookmarks } from '@/components/feed/saviez-vous-bookmarks'
import { ImageWikimediaFavorites } from './image-wikimedia-favorites'
import { ImageWikiLovesFavorites } from './image-wikiloves-favorites'
import { PixabayFavorites } from './pixabay-favorites'
import { PortailLexicalBookmarks } from './portail-lexical-bookmarks'
import { ProverbeBookmarks } from './proverbe-bookmarks'
import { ShareButton } from '@/components/feed/share-button'
import { useItemShare } from '@/components/feed/use-item-share'
import { shareToLobby, unshareFromLobby, shareResourceToLobby, unshareResourceFromLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'
import { SearchResults } from '@/components/lobby/search-results'

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
  proverbeFavoritesCount: number
}

type Tab = 'idees' | 'radio-france' | 'cnrs-news' | 'image-du-jour' | 'saviez-vous' | 'image-wikimedia' | 'image-wikiloves' | 'image-pixabay' | 'portail-lexical' | 'proverbe' | 'results'

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

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total, radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, proverbeFavoritesCount }: FavorisPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('idees')
  const [previousTab, setPreviousTab] = useState<Tab | null>(null)
  const hasInitialSet = useRef(false)
  const initialTabSetRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const previousTabRef = useRef<Tab | null>(null)
  const { savedIdeaIds, handleBookmark } = useBookmarkToggle(ideas)
  const [sharedIdeaIds, setSharedIdeaIds] = useState<Set<string>>(new Set())
  const [sharedSaviezIds, setSharedSaviezIds] = useState<Set<string>>(new Set())
  const [sharedImageIds, setSharedImageIds] = useState<Set<string>>(new Set())
  const [sharedWikiLovesIds, setSharedWikiLovesIds] = useState<Set<string>>(new Set())
  const [sharedWikimediaIds, setSharedWikimediaIds] = useState<Set<string>>(new Set())
  const [sharedProverbeIds, setSharedProverbeIds] = useState<Set<string>>(new Set())
  const [isSharing, setIsSharing] = useState<string | null>(null)

  useEffect(() => {
    const loadSharedState = async () => {
      const ideaIds = ideas.map(i => i.id).join(',')
      if (!ideaIds) return
      try {
        const res = await fetch(`/api/lobby/shared-ideas?ideaIds=${ideaIds}`)
        const data = await res.json()
        if (data.ideaIds) {
          setSharedIdeaIds(new Set(data.ideaIds))
        }
      } catch (err) {
        console.error('Failed to load shared state:', err)
      }
    }
    loadSharedState()
  }, [ideas])

  useEffect(() => {
    const loadSaviezSharedState = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/lobby/shared-resources?type=SAVIEZ_VOUS')
        const data = await res.json()
        if (data.resourceIds) {
          setSharedSaviezIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error('Failed to load SaviezVous shared state:', err)
      }
    }
    loadSaviezSharedState()
  }, [userId])

  useEffect(() => {
    const loadImageSharedState = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/lobby/shared-resources?type=IMAGE_DU_JOUR')
        const data = await res.json()
        if (data.resourceIds) {
          setSharedImageIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error('Failed to load image shared state:', err)
      }
    }
    loadImageSharedState()
  }, [userId])

  useEffect(() => {
    const loadWikiLovesSharedState = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/lobby/shared-resources?type=IMAGE_WIKILOVES')
        const data = await res.json()
        if (data.resourceIds) {
          setSharedWikiLovesIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error('Failed to load WikiLoves shared state:', err)
      }
    }
    loadWikiLovesSharedState()
  }, [userId])

  useEffect(() => {
    const loadWikimediaSharedState = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/lobby/shared-resources?type=IMAGE_WIKIMEDIA')
        const data = await res.json()
        if (data.resourceIds) {
          setSharedWikimediaIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error('Failed to load Wikimedia shared state:', err)
      }
    }
    loadWikimediaSharedState()
  }, [userId])

  useEffect(() => {
    const loadProverbeSharedState = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/lobby/shared-resources?type=PROVERBE')
        const data = await res.json()
        if (data.resourceIds) {
          setSharedProverbeIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error('Failed to load proverbe shared state:', err)
      }
    }
    loadProverbeSharedState()
  }, [userId])

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
  const [portailLexCount, setPortailLexCount] = useState(portailLexicalCount)
  const [proverbeCount, setProverbeCount] = useState(proverbeFavoritesCount)
  const prevCountsRef = useRef({ radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, proverbeFavoritesCount })

  useEffect(() => {
    const prev = prevCountsRef.current
    if (prev.radioFavoritesCount !== radioFavoritesCount) setRadioCount(radioFavoritesCount)
    if (prev.cnrsFavoritesCount !== cnrsFavoritesCount) setCnrsCount(cnrsFavoritesCount)
    if (prev.imageDuJourFavoritesCount !== imageDuJourFavoritesCount) setImageDuJourCount(imageDuJourFavoritesCount)
    if (prev.saviezVousFavoritesCount !== saviezVousFavoritesCount) setSaviezVousCount(saviezVousFavoritesCount)
    if (prev.wikimediaFavoritesCount !== wikimediaFavoritesCount) setWikimediaCount(wikimediaFavoritesCount)
    if (prev.wikilovesFavoritesCount !== wikilovesFavoritesCount) setWikilovesCount(wikilovesFavoritesCount)
    if (prev.pixabayFavoritesCount !== pixabayFavoritesCount) setPixabayCount(pixabayFavoritesCount)
    if (prev.portailLexicalCount !== portailLexicalCount) setPortailLexCount(portailLexicalCount)
    if (prev.proverbeFavoritesCount !== proverbeFavoritesCount) setProverbeCount(proverbeFavoritesCount)
    prevCountsRef.current = { radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, proverbeFavoritesCount }
  }, [radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, proverbeFavoritesCount])

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

  const handlePortailLexRemove = useCallback(() => {
    setPortailLexCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleProverbeRemove = useCallback(() => {
    setProverbeCount(prev => Math.max(0, prev - 1))
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

  const handleSaviezVousShareToLobby = async (resourceId: string) => {
    setIsSharing(resourceId)
    try {
      const isShared = sharedSaviezIds.has(resourceId)
      if (isShared) {
        await unshareResourceFromLobby('SAVIEZ_VOUS', resourceId)
        setSharedSaviezIds(prev => {
          const next = new Set(prev)
          next.delete(resourceId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareResourceToLobby('SAVIEZ_VOUS', resourceId)
        if (result.success) {
          setSharedSaviezIds(prev => new Set([...prev, resourceId]))
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(null)
    }
  }

  const handleImageShareToLobby = async (item: ImageDuJourFavoriteDoc) => {
    const resourceId = item.fileUrl
    setIsSharing(resourceId)
    try {
      const isShared = sharedImageIds.has(resourceId)
      if (isShared) {
        await unshareResourceFromLobby('IMAGE_DU_JOUR', resourceId)
        setSharedImageIds(prev => {
          const next = new Set(prev)
          next.delete(resourceId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareResourceToLobby('IMAGE_DU_JOUR', resourceId, item as any)
        if (result.success) {
          setSharedImageIds(prev => new Set([...prev, resourceId]))
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(null)
    }
  }

  const handleWikiLovesShareToLobby = async (item: WikiLovesImageFavoriteDoc) => {
    const resourceId = item.docid
    setIsSharing(resourceId)
    try {
      const isShared = sharedWikiLovesIds.has(resourceId)
      if (isShared) {
        await unshareResourceFromLobby('IMAGE_WIKILOVES', resourceId)
        setSharedWikiLovesIds(prev => {
          const next = new Set(prev)
          next.delete(resourceId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareResourceToLobby('IMAGE_WIKILOVES', resourceId, item as any)
        if (result.success) {
          setSharedWikiLovesIds(prev => new Set([...prev, resourceId]))
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(null)
    }
  }

  const handleWikimediaShareToLobby = async (item: WikimediaImageFavoriteDoc) => {
    const resourceId = item.docid
    setIsSharing(resourceId)
    try {
      const isShared = sharedWikimediaIds.has(resourceId)
      if (isShared) {
        await unshareResourceFromLobby('IMAGE_WIKIMEDIA', resourceId)
        setSharedWikimediaIds(prev => {
          const next = new Set(prev)
          next.delete(resourceId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareResourceToLobby('IMAGE_WIKIMEDIA', resourceId, item as any)
        if (result.success) {
          setSharedWikimediaIds(prev => new Set([...prev, resourceId]))
          toast.success('Partagé au lobby')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSharing(null)
    }
  }

  const handleProverbeShareToLobby = async (item: ProverbeFavoriteDoc) => {
    const resourceId = item.id
    setIsSharing(resourceId)
    try {
      const isShared = sharedProverbeIds.has(resourceId)
      if (isShared) {
        await unshareResourceFromLobby('PROVERBE', resourceId)
        setSharedProverbeIds(prev => {
          const next = new Set(prev)
          next.delete(resourceId)
          return next
        })
        toast.success('Retiré du lobby')
      } else {
        const result = await shareResourceToLobby('PROVERBE', resourceId, {
          text: item.text,
          signification: item.signification,
          source: item.source,
          wiktionnaireUrl: item.wiktionnaireUrl,
          etymologie: item.etymologie,
          definitions: item.definitions,
        })
        if (result.success) {
          setSharedProverbeIds(prev => new Set([...prev, resourceId]))
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
        { id: 'portail-lexical', label: 'Lexique', Icon: BookOpen, count: portailLexCount },
        { id: 'proverbe', label: 'Proverbes', Icon: Quote, count: proverbeCount },
       { id: 'saviez-vous', label: 'Saviez-vous ?', Icon: Info, count: saviezVousCount },
      { id: 'radio-france', label: 'Radio France', Icon: Radio, count: radioCount },
      { id: 'cnrs-news', label: 'CNRS', Icon: Newspaper, count: cnrsCount },
    ], [derivedIdeasCount, imageDuJourCount, wikimediaCount, wikilovesCount, pixabayCount, portailLexCount, proverbeCount, saviezVousCount, radioCount, cnrsCount])

  const sortedTabs = useMemo(() =>
    [...tabConfig].sort((a, b) => b.count - a.count),
    [tabConfig]
  )

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
    
    if (radioCount > 0) {
      results.push({
        id: 'radio-placeholder',
        title: `${radioCount} documentaires Radio France`,
        description: 'Cliquez pour voir les résultats',
        source: 'Radio France',
        sourceTab: 'radio-france',
        navigateTo: () => setActiveTab('radio-france'),
      })
    }
    
    if (cnrsCount > 0) {
      results.push({
        id: 'cnrs-placeholder',
        title: `${cnrsCount} actualités CNRS`,
        description: 'Cliquez pour voir les résultats',
        source: 'CNRS',
        sourceTab: 'cnrs-news',
        navigateTo: () => setActiveTab('cnrs-news'),
      })
    }
    
    if (imageDuJourCount > 0) {
      results.push({
        id: 'image-placeholder',
        title: `${imageDuJourCount} images du jour`,
        description: 'Cliquez pour voir les résultats',
        source: 'Images',
        sourceTab: 'image-du-jour',
        navigateTo: () => setActiveTab('image-du-jour'),
      })
    }
    
    if (saviezVousCount > 0) {
      results.push({
        id: 'saviez-placeholder',
        title: `${saviezVousCount} faits "Saviez-vous ?"`,
        description: 'Cliquez pour voir les résultats',
        source: 'Saviez-vous ?',
        sourceTab: 'saviez-vous',
        navigateTo: () => setActiveTab('saviez-vous'),
      })
    }
    
    if (wikimediaCount > 0) {
      results.push({
        id: 'wikimedia-placeholder',
        title: `${wikimediaCount} images Wikimedia`,
        description: 'Cliquez pour voir les résultats',
        source: 'Wikimedia',
        sourceTab: 'image-wikimedia',
        navigateTo: () => setActiveTab('image-wikimedia'),
      })
    }
    
    if (wikilovesCount > 0) {
      results.push({
        id: 'wikiloves-placeholder',
        title: `${wikilovesCount} images Wiki Loves`,
        description: 'Cliquez pour voir les résultats',
        source: 'Wiki Loves',
        sourceTab: 'image-wikiloves',
        navigateTo: () => setActiveTab('image-wikiloves'),
      })
    }
    
    if (pixabayCount > 0) {
      results.push({
        id: 'pixabay-placeholder',
        title: `${pixabayCount} vidéos Pixabay`,
        description: 'Cliquez pour voir les résultats',
        source: 'Pixabay',
        sourceTab: 'image-pixabay',
        navigateTo: () => setActiveTab('image-pixabay'),
      })
    }
    
    if (portailLexCount > 0) {
      results.push({
        id: 'lexical-placeholder',
        title: `${portailLexCount} mots du Lexique`,
        description: 'Cliquez pour voir les résultats',
        source: 'Lexique',
        sourceTab: 'portail-lexical',
        navigateTo: () => setActiveTab('portail-lexical'),
      })
    }
    
    if (proverbeCount > 0) {
      results.push({
        id: 'proverbe-placeholder',
        title: `${proverbeCount} proverbes`,
        description: 'Cliquez pour voir les résultats',
        source: 'Proverbes',
        sourceTab: 'proverbe',
        navigateTo: () => setActiveTab('proverbe'),
      })
    }
    
    return results
  }, [searchQuery, filteredIdeas, radioCount, cnrsCount, imageDuJourCount, saviezVousCount, wikimediaCount, wikilovesCount, pixabayCount, portailLexCount, proverbeCount])

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab(firstNonEmptyTab.id)
      } else {
        hasInitialSet.current = true
        initialTabSetRef.current = true
      }
    }
  }, [sortedTabs, activeTab, derivedIdeasCount])

  return (
    <>
      <div className="relative mb-4">
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="space-y-6">
        <div className="w-full">
          <TabsList className="flex flex-wrap gap-x-1 gap-y-3 md:gap-y-2 lg:gap-y-2 xl:gap-y-1 h-auto pt-0 pb-20 bg-muted rounded-lg min-h-0">
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
                <button
                  type="button"
                  className="rounded-full bg-card/90 px-2 py-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleShareToLobby(idea.id)
                  }}
                  disabled={isSharing === idea.id}
                  title="Partager au lobby"
                >
                  <Share2 className={`h-4 w-4 ${sharedIdeaIds.has(idea.id) ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-xs">Lobby</span>
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

      </TabsContent>

      <TabsContent value="results">
        <SearchResults searchQuery={searchQuery} results={searchResults} />
      </TabsContent>

      <TabsContent value="radio-france"><RadioFranceFavorites userId={userId} onRemoveComplete={handleRadioRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="cnrs-news"><CnrsBookmarks userId={userId} onRemoveComplete={handleCnrsRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-du-jour"><ImageDuJourBookmarks userId={userId} onRemoveComplete={handleImageDuJourRemove} sharedIds={sharedImageIds} onShareToggle={handleImageShareToLobby} isSharing={isSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="saviez-vous"><SaviezVousBookmarks userId={userId} onRemoveComplete={handleSaviezVousRemove} sharedIds={sharedSaviezIds} onShareToggle={handleSaviezVousShareToLobby} isSharing={isSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-wikimedia"><ImageWikimediaFavorites userId={userId} onRemoveComplete={handleWikimediaRemove} sharedIds={sharedWikimediaIds} onShareToggle={handleWikimediaShareToLobby} isSharing={isSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-wikiloves"><ImageWikiLovesFavorites userId={userId} onRemoveComplete={handleWikiLovesRemove} sharedIds={sharedWikiLovesIds} onShareToggle={handleWikiLovesShareToLobby} isSharing={isSharing} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="image-pixabay"><PixabayFavorites userId={userId} onRemoveComplete={handlePixabayRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="portail-lexical"><PortailLexicalBookmarks userId={userId} onRemoveComplete={handlePortailLexRemove} searchQuery={searchQuery} /></TabsContent>

      <TabsContent value="proverbe"><ProverbeBookmarks userId={userId} onRemoveComplete={handleProverbeRemove} sharedIds={sharedProverbeIds} onShareToggle={handleProverbeShareToLobby} isSharing={isSharing} searchQuery={searchQuery} /></TabsContent>
    </Tabs>
    </>
  )
}
