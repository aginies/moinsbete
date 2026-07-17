'use client'

import { useState, useCallback, useMemo } from 'react'
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
  initialVisibility?: CardVisibility
}

interface CardVisibility {
  saviezVous: boolean
  wikipedia: boolean
  radioFrance: boolean
  wikimedia: boolean
  cnrs: boolean
}

async function updateCardVisibility(field: string, value: boolean) {
  await fetch('/api/user-card-visibility', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  }).catch(() => {})
}

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId, initialVisibility }: SujetsClientProps) {
  const isAllSelected = useMemo(
    () => allTopics.length > 0 && allTopics.every(t => initialFollowedIds.includes(t.id)),
    [allTopics, initialFollowedIds],
  )
  const [followedIds, setFollowedIds] = useState<string[]>(isAllSelected ? [] : initialFollowedIds)

  const [visibility, setVisibility] = useState<CardVisibility>(initialVisibility ?? {
    saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, cnrs: true,
  })

  const toggleVisibility = useCallback((field: string, key: keyof CardVisibility) => {
    setVisibility(prev => {
      const next = !prev[key]
      if (userId) {
        updateCardVisibility(field, next).catch(() => {})
      }
      return { ...prev, [key]: next }
    })
  }, [userId])

  const toggleSaviezVous = useCallback(() => toggleVisibility('saviezVousCardVisible', 'saviezVous'), [toggleVisibility])
  const toggleWikipedia = useCallback(() => toggleVisibility('wikipediaImageCardVisible', 'wikipedia'), [toggleVisibility])
  const toggleRadioFrance = useCallback(() => toggleVisibility('radioFranceCardVisible', 'radioFrance'), [toggleVisibility])
  const toggleWikimedia = useCallback(() => toggleVisibility('imageWikimediaCardVisible', 'wikimedia'), [toggleVisibility])
  const toggleCnrs = useCallback(() => toggleVisibility('cnrsNewsEnabled', 'cnrs'), [toggleVisibility])

  const handleToggle = (topicId: string, _isFollowing: boolean) => {
    if (isAllSelected) {
      setFollowedIds([topicId])
    } else if (followedIds.includes(topicId)) {
      setFollowedIds(prev => prev.filter(id => id !== topicId))
    } else {
      setFollowedIds(prev => [...prev, topicId])
    }
  }

  const followedTopics = useMemo(
    () => allTopics.filter(t => isAllSelected || followedIds.includes(t.id)),
    [allTopics, isAllSelected, followedIds],
  )
  const unfollowedTopics = useMemo(
    () => allTopics.filter(t => !isAllSelected && !followedIds.includes(t.id)),
    [allTopics, isAllSelected, followedIds],
  )

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      {visibility.saviezVous && saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} userId={userId} isVisible={visibility.saviezVous} />
        </div>
      )}

      {visibility.wikipedia && (
        <div className="mb-6">
          <WikipediaImageCard onToggle={toggleWikipedia} largeImage userId={userId} isVisible={visibility.wikipedia} />
        </div>
      )}

      {visibility.cnrs && (
        <div className="mb-6">
          <CnrsNewsCard onToggle={toggleCnrs} userId={userId} isVisible={visibility.cnrs} />
        </div>
      )}

      {visibility.radioFrance && (
        <div className="mb-6">
          <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} isVisible={visibility.radioFrance} />
        </div>
      )}

      {visibility.wikimedia && (
        <div className="mb-6">
          <ImageWikimediaCard onToggle={toggleWikimedia} userId={userId} largeImage isVisible={visibility.wikimedia} />
        </div>
      )}

      <div className="mb-6">
        <Link
          href={((userId && followedIds.length > 0) || isAllSelected) ? '/idees/au-hasard?followed=1' : '/sujets'}
          className="block rounded-xl border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 p-5 dark:border-rose-600 dark:from-rose-950/30 dark:to-pink-950/30 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600">
              <span className="text-lg">🎲</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">
                {((userId && followedIds.length > 0) || isAllSelected) ? 'Carte aléatoire' : 'Choisissez vos sujets'}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                {((userId && followedIds.length > 0) || isAllSelected) ? 'Découvrir au Hasard' : 'Sélectionnez des sujets dans Mon Plan'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 mb-4">
        {!visibility.saviezVous && saviezVousFact && (
          <div className="h-full">
            <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} userId={userId} isVisible={visibility.saviezVous} />
          </div>
        )}

        {!visibility.wikipedia && (
          <div className="h-full">
            <WikipediaImageCard onToggle={toggleWikipedia} largeImage userId={userId} isVisible={visibility.wikipedia} />
          </div>
        )}

        {!visibility.cnrs && (
          <div className="h-full">
            <CnrsNewsCard onToggle={toggleCnrs} userId={userId} isVisible={visibility.cnrs} />
          </div>
        )}

        {!visibility.radioFrance && (
          <div className="h-full">
            <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} isVisible={visibility.radioFrance} />
          </div>
        )}

        {!visibility.wikimedia && (
          <div className="h-full">
            <ImageWikimediaCard onToggle={toggleWikimedia} userId={userId} largeImage isVisible={visibility.wikimedia} />
          </div>
        )}
      </div>

      {followedTopics.length > 0 && (
        <div className="mb-8">
          <TopicGrid topics={followedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} allSelected={isAllSelected} />
        </div>
      )}

      <TopicGrid topics={unfollowedTopics} followedIds={followedIds} onToggle={handleToggle} isAuthenticated={!!userId} allSelected={isAllSelected} />
    </div>
  )
}
