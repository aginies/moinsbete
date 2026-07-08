'use client'

import { useState, useCallback } from 'react'
import { Topic } from '@/generated/client'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { WikipediaImageCard } from '@/components/feed/wikipedia-image-card'
import { CnrsNewsCard } from '@/components/feed/cnrs-news-card'
import { getRandomFact } from '@/lib/saviez-vous'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
}

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId }: SujetsClientProps) {
  const [followedIds, setFollowedIds] = useState<string[]>(initialFollowedIds)
  const [cnrsEnabled, setCnrsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cnrs_news_enabled')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const toggleCnrs = useCallback(() => {
    setCnrsEnabled(prev => {
      const next = !prev
      localStorage.setItem('cnrs_news_enabled', String(next))
      return next
    })
  }, [])

  const handleToggle = (topicId: string, isFollowing: boolean) => {
    if (isFollowing) {
      setFollowedIds(prev => prev.filter(id => id !== topicId))
    } else {
      setFollowedIds(prev => [...prev, topicId])
    }
  }

  const followedTopics = allTopics.filter(t => followedIds.includes(t.id))
  const unfollowedTopics = allTopics.filter(t => !followedIds.includes(t.id))

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      {saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} />
        </div>
      )}

      <div className="mb-6">
        <WikipediaImageCard />
      </div>

      {cnrsEnabled && (
        <div className="mb-6">
          <CnrsNewsCard onToggle={toggleCnrs} />
        </div>
      )}

      {!cnrsEnabled && (
        <div className="mb-6">
          <button
            onClick={toggleCnrs}
            className="w-full rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20 hover:border-green-400 hover:bg-green-50 dark:hover:border-green-700 dark:hover:bg-green-950/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Newspaper className="h-4 w-4" />
              <span>Afficher Actualité CNRS</span>
            </div>
          </button>
        </div>
      )}

      <div className="mb-6">
        <Link
          href={userId && followedIds.length > 0 ? '/idees/au-hasard?followed=1' : '/mon-plan'}
          className="block rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-600 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
              <span className="text-lg">🎲</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-800 dark:text-blue-200">
                {userId && followedIds.length > 0 ? 'Carte aléatoire' : 'Choisissez vos sujets'}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {userId && followedIds.length > 0 ? 'Découvrir au Hasard' : 'Sélectionnez des sujets dans Mon Plan'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <SearchBar />

      {followedTopics.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Vos sujets suivis ({followedTopics.length})</h2>
          <TopicGrid topics={followedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Découvrir des sujets ({unfollowedTopics.length})</h2>
        <TopicGrid topics={unfollowedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} />
      </div>
    </div>
  )
}
