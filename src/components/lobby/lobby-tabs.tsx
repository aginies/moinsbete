'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionList } from './suggestion-list'
import { SharedBookmarks } from './shared-bookmarks'
import { Pagination } from '@/components/ui/pagination'
import { useMemo, useState, useCallback } from 'react'

interface LobbyTabsProps {
  suggestions: any[]
  sharedBookmarks: any[]
  currentUserId: string | null
  isAdmin?: boolean
  totalPages: number
  currentPage: number
}

const TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'IDEA', label: 'Idées' },
  { value: 'IMAGE_DU_JOUR', label: 'Image du jour' },
  { value: 'SAVIEZ_VOUS', label: 'Saviez-vous ?' },
  { value: 'IMAGE_WIKIMEDIA', label: 'Wikimedia' },
  { value: 'IMAGE_WIKILOVES', label: 'Wiki Loves' },
]

export function LobbyTabs({ suggestions, sharedBookmarks, currentUserId, isAdmin, totalPages, currentPage }: LobbyTabsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'favoris'
  const activeType = searchParams.get('type') || ''
  const [userSearchInput, setUserSearchInput] = useState('')

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

  const handleUserSearchChange = useCallback((value: string) => {
    setUserSearchInput(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('user', value)
    } else {
      params.delete('user')
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
    if (userSearchInput.trim()) {
      const q = userSearchInput.toLowerCase().trim()
      filtered = filtered.filter(b => {
        const name = (b.user.displayName || '').toLowerCase()
        const email = (b.user.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }
    return filtered.filter(b => b.idea || b.saviezFact || b.wikiImage || b.wikiMediaImage || b.wikiLovesImage)
  }, [sharedBookmarks, activeType, userSearchInput])

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
          typeFilters={TYPE_FILTERS}
          activeType={activeType}
          userSearch={userSearchInput}
          onTypeChange={handleTypeChange}
          onUserSearchChange={handleUserSearchChange}
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
