'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionList } from './suggestion-list'
import { SharedBookmarks } from './shared-bookmarks'
import { Pagination } from '@/components/ui/pagination'
import { useMemo, useState, useCallback, useEffect } from 'react'
import type { UserSuggestion, SharedLobbyBookmark } from '@/generated/client'

interface LobbyTabsProps {
  suggestions: UserSuggestion[]
  sharedBookmarks: SharedLobbyBookmark[]
  sharedWithMeBookmarks: SharedLobbyBookmark[]
  sharedByMeBookmarks: SharedLobbyBookmark[]
  currentUserId: string | null
  isAdmin?: boolean
  totalPages: number
  totalPagesSharedWithMe: number
  totalPagesSharedByMe: number
  currentPage: number
  userFavoriteIds: {
    IDEA: Set<string>
    SAVIEZ_VOUS: Set<string>
    IMAGE_DU_JOUR: Set<string>
    IMAGE_WIKIMEDIA: Set<string>
    IMAGE_WIKILOVES: Set<string>
    PROVERBE: Set<string>
  }
}

const TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'IDEA', label: 'Idées' },
  { value: 'IMAGE_DU_JOUR', label: 'Image du jour' },
  { value: 'SAVIEZ_VOUS', label: 'Saviez-vous ?' },
  { value: 'IMAGE_WIKIMEDIA', label: 'Wikimedia' },
  { value: 'IMAGE_WIKILOVES', label: 'Wiki Loves' },
  { value: 'PROVERBE', label: 'Proverbes' },
]

export function LobbyTabs({ suggestions, sharedBookmarks, sharedWithMeBookmarks, sharedByMeBookmarks, currentUserId, isAdmin, totalPages, totalPagesSharedWithMe, totalPagesSharedByMe, currentPage, userFavoriteIds }: LobbyTabsProps) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'favoris'
  const activeType = searchParams.get('type') || ''
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleTypeChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('type', value)
    } else {
      params.delete('type')
    }
    if (params.get('tab') !== 'favoris') {
      params.set('tab', 'favoris')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    if (params.get('tab') !== 'favoris') {
      params.set('tab', 'favoris')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const filteredBookmarks = useMemo(() => {
    let filtered = sharedBookmarks
    if (activeType) {
      filtered = filtered.filter(b => b.resourceType === activeType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(b => {
        const name = (((b as any).user)?.displayName || '').toLowerCase()
        const email = (((b as any).user)?.email || '').toLowerCase()
        if (name.includes(q) || email.includes(q)) return true
        if ((b as any).idea) {
          const title = ((b as any).idea.title || '').toLowerCase()
          const content = ((b as any).idea.content || '').toLowerCase()
          const takeaway = ((b as any).idea.takeaway || '').toLowerCase()
          const source = ((b as any).idea.source?.title || '').toLowerCase()
          if (title.includes(q) || content.includes(q) || takeaway.includes(q) || source.includes(q)) return true
        }
        if ((b as any).saviezFact) {
          const text = ((b as any).saviezFact.text || '').toLowerCase()
          if (text.includes(q)) return true
        }
        if ((b as any).wikiImage) {
          const desc = ((b as any).wikiImage.description || '').toLowerCase()
          if (desc.includes(q)) return true
        }
        if ((b as any).wikiMediaImage) {
          const title = ((b as any).wikiMediaImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).wikiLovesImage) {
          const title = ((b as any).wikiLovesImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).proverbe) {
          const text = ((b as any).proverbe.text || '').toLowerCase()
          const signification = ((b as any).proverbe.signification || '').toLowerCase()
          const source = ((b as any).proverbe.source || '').toLowerCase()
          if (text.includes(q) || signification.includes(q) || source.includes(q)) return true
        }
        return false
      })
    }
    return filtered.filter(b => (b as any).idea || (b as any).saviezFact || (b as any).wikiImage !== undefined || (b as any).wikiMediaImage !== undefined || (b as any).wikiLovesImage !== undefined || (b as any).proverbe)
  }, [sharedBookmarks, activeType, searchQuery])

  const filteredSharedWithMe = useMemo(() => {
    let filtered = sharedWithMeBookmarks
    if (activeType) {
      filtered = filtered.filter(b => b.resourceType === activeType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(b => {
        const sharer = ((b as any).user)
        const name = sharer?.displayName || ''
        const email = sharer?.email || ''
        if (name.toLowerCase().includes(q) || email.toLowerCase().includes(q)) return true
        if ((b as any).idea) {
          const title = ((b as any).idea.title || '').toLowerCase()
          const content = ((b as any).idea.content || '').toLowerCase()
          const takeaway = ((b as any).idea.takeaway || '').toLowerCase()
          const source = ((b as any).idea.source?.title || '').toLowerCase()
          if (title.includes(q) || content.includes(q) || takeaway.includes(q) || source.includes(q)) return true
        }
        if ((b as any).saviezFact) {
          const text = ((b as any).saviezFact.text || '').toLowerCase()
          if (text.includes(q)) return true
        }
        if ((b as any).wikiImage) {
          const desc = ((b as any).wikiImage.description || '').toLowerCase()
          if (desc.includes(q)) return true
        }
        if ((b as any).wikiMediaImage) {
          const title = ((b as any).wikiMediaImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).wikiLovesImage) {
          const title = ((b as any).wikiLovesImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).proverbe) {
          const text = ((b as any).proverbe.text || '').toLowerCase()
          const signification = ((b as any).proverbe.signification || '').toLowerCase()
          const source = ((b as any).proverbe.source || '').toLowerCase()
          if (text.includes(q) || signification.includes(q) || source.includes(q)) return true
        }
        return false
      })
    }
    return filtered.filter(b => (b as any).idea || (b as any).saviezFact || (b as any).wikiImage !== undefined || (b as any).wikiMediaImage !== undefined || (b as any).wikiLovesImage !== undefined || (b as any).proverbe)
  }, [sharedWithMeBookmarks, activeType, searchQuery])

  const filteredSharedByMe = useMemo(() => {
    let filtered = sharedByMeBookmarks
    if (activeType) {
      filtered = filtered.filter(b => b.resourceType === activeType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(b => {
        const name = (((b as any).user)?.displayName || '').toLowerCase()
        const email = (((b as any).user)?.email || '').toLowerCase()
        if (name.includes(q) || email.includes(q)) return true
        if ((b as any).idea) {
          const title = ((b as any).idea.title || '').toLowerCase()
          const content = ((b as any).idea.content || '').toLowerCase()
          const takeaway = ((b as any).idea.takeaway || '').toLowerCase()
          const source = ((b as any).idea.source?.title || '').toLowerCase()
          if (title.includes(q) || content.includes(q) || takeaway.includes(q) || source.includes(q)) return true
        }
        if ((b as any).saviezFact) {
          const text = ((b as any).saviezFact.text || '').toLowerCase()
          if (text.includes(q)) return true
        }
        if ((b as any).wikiImage) {
          const desc = ((b as any).wikiImage.description || '').toLowerCase()
          if (desc.includes(q)) return true
        }
        if ((b as any).wikiMediaImage) {
          const title = ((b as any).wikiMediaImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).wikiLovesImage) {
          const title = ((b as any).wikiLovesImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if ((b as any).proverbe) {
          const text = ((b as any).proverbe.text || '').toLowerCase()
          const signification = ((b as any).proverbe.signification || '').toLowerCase()
          const source = ((b as any).proverbe.source || '').toLowerCase()
          if (text.includes(q) || signification.includes(q) || source.includes(q)) return true
        }
        return false
      })
    }
    return filtered.filter(b => (b as any).idea || (b as any).saviezFact || (b as any).wikiImage !== undefined || (b as any).wikiMediaImage !== undefined || (b as any).wikiLovesImage !== undefined || (b as any).proverbe)
  }, [sharedByMeBookmarks, activeType, searchQuery])

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 h-auto pt-0 pb-1">
        <TabsTrigger value="favoris" className="whitespace-normal h-auto py-1 px-3 text-center text-[10px] sm:text-xs md:text-sm flex items-start justify-center" style={{ height: 'auto' }}>{t('feed.shared_favorites')}</TabsTrigger>
        <TabsTrigger value="partage" className="whitespace-normal h-auto py-1 px-3 text-center text-[10px] sm:text-xs md:text-sm flex items-start justify-center" style={{ height: 'auto' }}>{t('feed.partage_avec_vous')}</TabsTrigger>
        <TabsTrigger value="mies" className="whitespace-normal h-auto py-1 px-3 text-center text-[10px] sm:text-xs md:text-sm flex items-start justify-center" style={{ height: 'auto' }}>{t('feed.partage_utilisateurs')}</TabsTrigger>
        <TabsTrigger value="discuter" className="whitespace-normal h-auto py-1 px-3 text-center text-[10px] sm:text-xs md:text-sm flex items-start justify-center" style={{ height: 'auto' }}>{t('feed.discuss')}</TabsTrigger>
      </TabsList>

      <TabsContent value="discuter">
        <SuggestionList suggestions={suggestions as any} currentUserId={currentUserId} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="favoris">
        <SharedBookmarks
          sharedBookmarks={filteredBookmarks as any}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          userFavoriteIds={userFavoriteIds}
          typeFilters={TYPE_FILTERS}
          activeType={activeType}
          searchQuery={searchQuery}
          onTypeChange={handleTypeChange}
          onSearchChange={handleSearchChange}
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageUrl={(page) => {
              if (page === 1) return '/lobby'
              return `/lobby?page=${page}`
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="partage">
        <SharedBookmarks
          sharedBookmarks={filteredSharedWithMe as any}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          userFavoriteIds={userFavoriteIds}
          typeFilters={TYPE_FILTERS}
          activeType={activeType}
          searchQuery={searchQuery}
          onTypeChange={handleTypeChange}
          onSearchChange={handleSearchChange}
        />
        {totalPagesSharedWithMe > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesSharedWithMe}
            pageUrl={(page) => {
              if (page === 1) return '/lobby?tab=partage'
              return `/lobby?page=${page}&tab=partage`
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="mies">
        <SharedBookmarks
          sharedBookmarks={filteredSharedByMe as any}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          userFavoriteIds={userFavoriteIds}
          typeFilters={TYPE_FILTERS}
          activeType={activeType}
          searchQuery={searchQuery}
          onTypeChange={handleTypeChange}
          onSearchChange={handleSearchChange}
        />
        {totalPagesSharedByMe > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesSharedByMe}
            pageUrl={(page) => {
              if (page === 1) return '/lobby?tab=mies'
              return `/lobby?page=${page}&tab=mies`
            }}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
