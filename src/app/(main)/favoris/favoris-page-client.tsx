'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Bookmark, X, Search, Lightbulb, Image as ImageIcon, Radio, Info, Newspaper } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { RadioFranceFavorites } from './radio-france-favorites'
import { CnrsBookmarks } from '@/components/feed/cnrs-bookmarks'
import { type CompactIdea } from '@/types/idea'
import { normalizeAccents } from '@/lib/utils'
import { getRadioFavoritesCount } from '@/lib/radio-bookmark'
import { getImageDuJourFavoritesCount } from '@/lib/image-du-jour-bookmark'
import { getSaviezVousFavoritesCount } from '@/lib/saviez-vous-bookmark'
import { ImageDuJourBookmarks } from '@/components/feed/image-du-jour-bookmarks'
import { SaviezVousBookmarks } from '@/components/feed/saviez-vous-bookmarks'
import { BnFGallicaFavorites } from './bnf-gallica-favorites'
import { BookOpen } from 'lucide-react'

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
   bnfGallicaFavoritesCount: number
 }

type Tab = 'idees' | 'radio-france' | 'cnrs-news' | 'image-du-jour' | 'saviez-vous' | 'bnf-gallica'

interface TabConfig {
  id: Tab
  label: string
  Icon: React.ElementType
  count: number
}

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total, radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, bnfGallicaFavoritesCount }: FavorisPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('idees')
  const [searchQuery, setSearchQuery] = useState('')
  const { savedIdeaIds, handleBookmark, isPending } = useBookmarkToggle(ideas)

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
  const [bnfGallicaCount, setBnFGallicaCount] = useState(bnfGallicaFavoritesCount)

  useEffect(() => {
    setRadioCount(radioFavoritesCount)
  }, [radioFavoritesCount])

  useEffect(() => {
    setCnrsCount(cnrsFavoritesCount)
  }, [cnrsFavoritesCount])

  useEffect(() => {
    setImageDuJourCount(imageDuJourFavoritesCount)
  }, [imageDuJourFavoritesCount])

  useEffect(() => {
     setSaviezVousCount(saviezVousFavoritesCount)
   }, [saviezVousFavoritesCount])

   useEffect(() => {
     setBnFGallicaCount(bnfGallicaFavoritesCount)
   }, [bnfGallicaFavoritesCount])

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

   const handleBnFGallicaRemove = useCallback(() => {
     setBnFGallicaCount(prev => Math.max(0, prev - 1))
   }, [])

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = normalizeAccents(searchQuery).toLowerCase()
    return ideas.filter(idea => normalizeAccents(idea.title).toLowerCase().includes(q))
  }, [ideas, searchQuery])


  const pageUrl = (page: number) => {
    if (page === 1) return '/favoris'
    return `/favoris?page=${page}`
  }

  const tabConfig: TabConfig[] = useMemo(() => [
     { id: 'idees', label: 'Idées', Icon: Lightbulb, count: derivedIdeasCount },
     { id: 'image-du-jour', label: 'Images', Icon: ImageIcon, count: imageDuJourCount },
     { id: 'bnf-gallica', label: 'Gallica', Icon: BookOpen, count: bnfGallicaCount },
     { id: 'saviez-vous', label: 'Saviez-vous ?', Icon: Info, count: saviezVousCount },
     { id: 'radio-france', label: 'Radio France', Icon: Radio, count: radioCount },
     { id: 'cnrs-news', label: 'CNRS', Icon: Newspaper, count: cnrsCount },
   ], [derivedIdeasCount, imageDuJourCount, bnfGallicaCount, saviezVousCount, radioCount, cnrsCount])

  const sortedTabs = useMemo(() =>
    [...tabConfig].sort((a, b) => b.count - a.count),
    [tabConfig]
  )

  return (
    <div>
      <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 border-b border-border overflow-x-auto">
        {sortedTabs.map(({ id, label, Icon, count }) => (
          <button
            key={id}
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
        <>
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
                  <button
                    type="button"
                    className="absolute right-2 top-2 z-10 rounded-full bg-card/90 p-1.5 opacity-60 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleBookmark(idea.id)
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={savedIdeaIds.has(idea.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-colors ${savedIdeaIds.has(idea.id) ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </button>
                </div>
              ))}

              {totalPages > 1 && (
                 <Pagination
                   currentPage={currentPage}
                   totalPages={totalPages}
                   onPageChange={() => {}}
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
        </>
      )}

      {activeTab === 'radio-france' && <RadioFranceFavorites userId={userId} onRemoveComplete={handleRadioRemove} />}

      {activeTab === 'cnrs-news' && <CnrsBookmarks userId={userId} onRemoveComplete={handleCnrsRemove} />}

      {activeTab === 'image-du-jour' && <ImageDuJourBookmarks userId={userId} onRemoveComplete={handleImageDuJourRemove} />}

      {activeTab === 'saviez-vous' && <SaviezVousBookmarks userId={userId} onRemoveComplete={handleSaviezVousRemove} />}

      {activeTab === 'bnf-gallica' && <BnFGallicaFavorites userId={userId} onRemoveComplete={handleBnFGallicaRemove} />}
    </div>
  )
}
