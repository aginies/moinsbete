'use client'

import { useState, useCallback, useEffect } from 'react'
import { Topic } from '@/generated/client'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { WikipediaImageCard } from '@/components/feed/wikipedia-image-card'
import { CnrsNewsCard } from '@/components/feed/cnrs-news-card'
import { RadioFranceCard } from '@/components/feed/radio-france-card'
import { ImageWikimediaCard } from '@/components/feed/image-wikimedia-card'
import Link from 'next/link'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
}

interface CardVisibility {
  saviezVous: boolean
  wikipedia: boolean
  radioFrance: boolean
  wikimedia: boolean
  cnrs: boolean
}

async function loadCardVisibility(userId: string): Promise<CardVisibility> {
  try {
    const res = await fetch('/api/user-card-visibility')
    if (!res.ok) return { saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, cnrs: true }
    const data = await res.json()
    return {
      saviezVous: data.saviezVousCardVisible ?? true,
      wikipedia: data.wikipediaImageCardVisible ?? true,
      radioFrance: data.radioFranceCardVisible ?? true,
      wikimedia: data.imageWikimediaCardVisible ?? true,
      cnrs: data.cnrsNewsEnabled ?? true,
    }
  } catch {
    return { saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, cnrs: true }
  }
}

async function updateCardVisibility(field: string, value: boolean) {
  await fetch('/api/user-card-visibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  }).catch(() => {})
}

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId }: SujetsClientProps) {
  const [followedIds, setFollowedIds] = useState<string[]>(initialFollowedIds)

  const [isMounted, setIsMounted] = useState(false)

  const getLocalStorageVisibility = (): CardVisibility => {
    const storedSaviez = localStorage.getItem('saviez_vous_card_visible')
    const storedWiki = localStorage.getItem('wikipedia_image_card_visible')
    const storedRadio = localStorage.getItem('radio_france_card_visible')
    const storedWikimedia = localStorage.getItem('image_wikimedia_card_visible')
    const storedCnrs = localStorage.getItem('cnrs_news_enabled')

    return {
      saviezVous: storedSaviez !== null ? storedSaviez === 'true' : true,
      wikipedia: storedWiki !== null ? storedWiki === 'true' : true,
      radioFrance: storedRadio !== null ? storedRadio === 'true' : true,
      wikimedia: storedWikimedia !== null ? storedWikimedia === 'true' : true,
      cnrs: storedCnrs !== null ? storedCnrs === 'true' : true,
    }
  }

  const [visibility, setVisibility] = useState<CardVisibility>(() => {
    // Default to server values (all true) to match SSR
    // After mount, sync with localStorage if user has custom values
    return { saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, cnrs: true }
  })

  useEffect(() => {
    setIsMounted(true)
    if (isMounted) {
      setVisibility(getLocalStorageVisibility())
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadCardVisibility(userId).then(setVisibility).catch(() => {})
    }
  }, [userId])

  const toggleSaviezVous = useCallback(async () => {
    setVisibility(prev => {
      const next = !prev.saviezVous
      if (userId) {
        updateCardVisibility('saviezVousCardVisible', next).catch(() => {})
      } else {
        localStorage.setItem('saviez_vous_card_visible', String(next))
      }
      return { ...prev, saviezVous: next }
    })
  }, [userId])

  const toggleWikipedia = useCallback(async () => {
    setVisibility(prev => {
      const next = !prev.wikipedia
      if (userId) {
        updateCardVisibility('wikipediaImageCardVisible', next).catch(() => {})
      } else {
        localStorage.setItem('wikipedia_image_card_visible', String(next))
      }
      return { ...prev, wikipedia: next }
    })
  }, [userId])

  const toggleRadioFrance = useCallback(async () => {
    setVisibility(prev => {
      const next = !prev.radioFrance
      if (userId) {
        updateCardVisibility('radioFranceCardVisible', next).catch(() => {})
      } else {
        localStorage.setItem('radio_france_card_visible', String(next))
      }
      return { ...prev, radioFrance: next }
    })
  }, [userId])

  const toggleWikimedia = useCallback(async () => {
    setVisibility(prev => {
      const next = !prev.wikimedia
      if (userId) {
        updateCardVisibility('imageWikimediaCardVisible', next).catch(() => {})
      } else {
        localStorage.setItem('image_wikimedia_card_visible', String(next))
      }
      return { ...prev, wikimedia: next }
    })
  }, [userId])

  const toggleCnrs = useCallback(async () => {
    setVisibility(prev => {
      const next = !prev.cnrs
      if (userId) {
        updateCardVisibility('cnrsNewsEnabled', next).catch(() => {})
      } else {
        localStorage.setItem('cnrs_news_enabled', String(next))
      }
      return { ...prev, cnrs: next }
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
      {visibility.saviezVous && saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} userId={userId} />
        </div>
      )}

      {visibility.wikipedia && (
        <div className="mb-6">
          <WikipediaImageCard onToggle={toggleWikipedia} largeImage userId={userId} />
        </div>
      )}

      {visibility.cnrs && (
        <div className="mb-6">
          <CnrsNewsCard onToggle={toggleCnrs} userId={userId} />
        </div>
      )}

      {visibility.radioFrance && (
        <div className="mb-6">
          <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} />
        </div>
      )}

      {visibility.wikimedia && (
        <div className="mb-6">
          <ImageWikimediaCard onToggle={toggleWikimedia} userId={userId} largeImage />
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 mb-4">
        {!visibility.saviezVous && saviezVousFact && (
          <div className="h-full">
            <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} userId={userId} />
          </div>
        )}

        {!visibility.wikipedia && (
          <div className="h-full">
            <WikipediaImageCard onToggle={toggleWikipedia} largeImage userId={userId} />
          </div>
        )}

        {!visibility.cnrs && (
          <div className="h-full">
            <CnrsNewsCard onToggle={toggleCnrs} userId={userId} />
          </div>
        )}

        {!visibility.radioFrance && (
          <div className="h-full">
            <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} />
          </div>
        )}

        {!visibility.wikimedia && (
          <div className="h-full">
            <ImageWikimediaCard onToggle={toggleWikimedia} userId={userId} largeImage />
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
