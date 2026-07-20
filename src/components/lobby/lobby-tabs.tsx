'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionList } from './suggestion-list'
import { SharedBookmarks } from './shared-bookmarks'
import { Pagination } from '@/components/ui/pagination'
import { useMemo, useState, useCallback, useEffect } from 'react'

interface LobbyTabsProps {
  suggestions: any[]
  sharedBookmarks: any[]
  currentUserId: string | null
  isAdmin?: boolean
  totalPages: number
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

export function LobbyTabs({ suggestions, sharedBookmarks, currentUserId, isAdmin, totalPages, currentPage, userFavoriteIds }: LobbyTabsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'favoris'
  const activeType = searchParams.get('type') || ''
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchQuery(q)
  }, [searchParams])

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
        const name = (b.user.displayName || '').toLowerCase()
        const email = (b.user.email || '').toLowerCase()
        if (name.includes(q) || email.includes(q)) return true
        if (b.idea) {
          const title = (b.idea.title || '').toLowerCase()
          const content = (b.idea.content || '').toLowerCase()
          const takeaway = (b.idea.takeaway || '').toLowerCase()
          const source = (b.idea.source.title || '').toLowerCase()
          if (title.includes(q) || content.includes(q) || takeaway.includes(q) || source.includes(q)) return true
        }
        if (b.saviezFact) {
          const text = (b.saviezFact.text || '').toLowerCase()
          if (text.includes(q)) return true
        }
        if (b.wikiImage) {
          const desc = (b.wikiImage.description || '').toLowerCase()
          if (desc.includes(q)) return true
        }
        if (b.wikiMediaImage) {
          const title = (b.wikiMediaImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if (b.wikiLovesImage) {
          const title = (b.wikiLovesImage.title || '').toLowerCase()
          if (title.includes(q)) return true
        }
        if (b.proverbe) {
          const text = (b.proverbe.text || '').toLowerCase()
          const signification = (b.proverbe.signification || '').toLowerCase()
          const source = (b.proverbe.source || '').toLowerCase()
          if (text.includes(q) || signification.includes(q) || source.includes(q)) return true
        }
        return false
      })
    }
    return filtered.filter(b => b.idea || b.saviezFact || b.wikiImage || b.wikiMediaImage || b.wikiLovesImage)
  }, [sharedBookmarks, activeType, searchQuery])

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="favoris">Favoris partagés</TabsTrigger>
        <TabsTrigger value="discuter">Discuter</TabsTrigger>
      </TabsList>

      <TabsContent value="discuter">
        <SuggestionList suggestions={suggestions} currentUserId={currentUserId} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="favoris">
        <SharedBookmarks
          sharedBookmarks={filteredBookmarks}
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
    </Tabs>
  )
}
