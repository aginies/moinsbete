'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Bookmark, X, Search } from 'lucide-react'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { useBookmarkToggle } from '@/hooks/use-bookmark-toggle'
import { RadioFranceFavorites } from './radio-france-favorites'

const FAVORITES_KEY = 'rf_favorites'

function getRadioFavoritesCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored).length : 0
  } catch {
    return 0
  }
}

interface Idea {
  id: string
  title: string
  slug: string
  topics: Array<{
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }>
  source: {
    title: string
    type: string
    url: string | null
  }
}

interface FavorisPageClientProps {
  ideas: Idea[]
  userId?: string
  currentPage: number
  totalPages: number
  total: number
}

type Tab = 'idees' | 'radio-france'

export function FavorisPageClient({ ideas, userId, currentPage, totalPages, total }: FavorisPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('idees')
  const [searchQuery, setSearchQuery] = useState('')
  const [radioFavoritesCount, setRadioFavoritesCount] = useState(getRadioFavoritesCount)
  const { savedIdeaIds, handleBookmark, isPending } = useBookmarkToggle(ideas)

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas
    const q = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return ideas.filter(idea => idea.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(q))
  }, [ideas, searchQuery])


  const pageUrl = (page: number) => {
    if (page === 1) return '/favoris'
    return `/favoris?page=${page}`
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('idees')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'idees'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Idées favoris ({total})
        </button>
        <button
          onClick={() => setActiveTab('radio-france')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'radio-france'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Documentaires Radio France ({radioFavoritesCount})
        </button>
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

          {total === 0 ? (
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
                    className="absolute right-2 top-2 z-10 rounded-full bg-card/90 p-1.5 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
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

              {total > 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Page {currentPage} sur {totalPages} · {total} favori{total !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'radio-france' && <RadioFranceFavorites />}
    </div>
  )
}
