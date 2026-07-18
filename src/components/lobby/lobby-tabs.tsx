'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionList } from './suggestion-list'
import { SharedBookmarks } from './shared-bookmarks'
import { Pagination } from '@/components/ui/pagination'

interface LobbyTabsProps {
  suggestions: any[]
  sharedBookmarks: any[]
  currentUserId: string | null
  isAdmin?: boolean
  totalPages: number
  currentPage: number
}

export function LobbyTabs({ suggestions, sharedBookmarks, currentUserId, isAdmin, totalPages, currentPage }: LobbyTabsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'favoris'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

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
        <SharedBookmarks sharedBookmarks={sharedBookmarks} currentUserId={currentUserId} isAdmin={isAdmin} />
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
