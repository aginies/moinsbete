'use client'

import { useState, useCallback, useEffect } from 'react'
import { Topic } from '@/generated/client'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { WikipediaImageCard } from '@/components/feed/wikipedia-image-card'
import { CnrsNewsCard } from '@/components/feed/cnrs-news-card'
import { RadioFranceCard } from '@/components/feed/radio-france-card'
import { BnFGallicaCard } from '@/components/feed/bnf-gallica-card'
import { getRandomFact } from '@/lib/saviez-vous'
import { getRandomDoc } from '@/data/radio-france'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  initialCnrsEnabled: boolean
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
}

export function SujetsClient({ allTopics, initialFollowedIds, initialCnrsEnabled, saviezVousFact, userId }: SujetsClientProps) {
  const [followedIds, setFollowedIds] = useState<string[]>(initialFollowedIds)
  const [cnrsEnabled, setCnrsEnabled] = useState(() => {
    if (userId) return initialCnrsEnabled
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cnrs_news_enabled')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const [saviezVousVisible, setSaviezVousVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('saviez_vous_card_visible')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const [wikipediaVisible, setWikipediaVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wikipedia_image_card_visible')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const [radioFranceVisible, setRadioFranceVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('radio_france_card_visible')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const [bnfGallicaVisible, setBnfGallicaVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bnf_gallica_card_visible')
      if (stored !== null) return stored === 'true'
    }
    return true
  })

  const toggleSaviezVous = useCallback(() => {
    setSaviezVousVisible(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('saviez_vous_card_visible', String(next))
      }
      return next
    })
  }, [])

  const toggleWikipedia = useCallback(() => {
    setWikipediaVisible(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('wikipedia_image_card_visible', String(next))
      }
      return next
    })
  }, [])

  const toggleRadioFrance = useCallback(() => {
    setRadioFranceVisible(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('radio_france_card_visible', String(next))
      }
      return next
    })
  }, [])

  const toggleBnfGallica = useCallback(() => {
    setBnfGallicaVisible(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('bnf_gallica_card_visible', String(next))
      }
      return next
    })
  }, [])

  const toggleCnrs = useCallback(async () => {
    setCnrsEnabled(prev => {
      const next = !prev
      if (userId) {
        fetch('/api/user/cnrs-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnrsNewsEnabled: next }),
        }).catch(() => {})
      } else {
        localStorage.setItem('cnrs_news_enabled', String(next))
      }
      return next
    })
  }, [userId])

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
      {saviezVousVisible && saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} />
        </div>
      )}

      {wikipediaVisible && (
        <div className="mb-6">
          <WikipediaImageCard onToggle={toggleWikipedia} />
        </div>
      )}

      {cnrsEnabled && (
        <div className="mb-6">
          <CnrsNewsCard onToggle={toggleCnrs} userId={userId} />
        </div>
      )}

      {radioFranceVisible && (
        <div className="mb-6">
          <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} />
        </div>
      )}

      {bnfGallicaVisible && (
        <div className="mb-6">
          <BnFGallicaCard onToggle={toggleBnfGallica} userId={userId} />
        </div>
      )}

      <div className="mb-6">
        <Link
          href={userId && followedIds.length > 0 ? '/idees/au-hasard?followed=1' : '/sujets'}
          className="block rounded-xl border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 p-5 dark:border-rose-600 dark:from-rose-950/30 dark:to-pink-950/30 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600">
              <span className="text-lg">🎲</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">
                {userId && followedIds.length > 0 ? 'Carte aléatoire' : 'Choisissez vos sujets'}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                {userId && followedIds.length > 0 ? 'Découvrir au Hasard' : 'Sélectionnez des sujets dans Mon Plan'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {!saviezVousVisible && saviezVousFact && (
          <div>
            <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} />
          </div>
        )}

        {!wikipediaVisible && (
          <div>
            <WikipediaImageCard onToggle={toggleWikipedia} />
          </div>
        )}

        {!cnrsEnabled && (
          <div>
            <CnrsNewsCard onToggle={toggleCnrs} userId={userId} />
          </div>
        )}

        {!radioFranceVisible && (
          <div>
            <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} />
          </div>
        )}

        {!bnfGallicaVisible && (
          <div>
            <BnFGallicaCard onToggle={toggleBnfGallica} userId={userId} />
          </div>
        )}
      </div>

      {followedTopics.length > 0 && (
        <div className="mb-8">
          <TopicGrid topics={followedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} />
        </div>
      )}

      <TopicGrid topics={unfollowedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} />
    </div>
  )
}
