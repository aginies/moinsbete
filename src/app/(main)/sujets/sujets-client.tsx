'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Topic } from '@/generated/client'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { WikipediaImageCard } from '@/components/feed/wikipedia-image-card'
import { CnrsNewsCard } from '@/components/feed/cnrs-news-card'
import { RadioFranceCard } from '@/components/feed/radio-france-card'
import { ImageWikimediaCard } from '@/components/feed/image-wikimedia-card'
import { ImageWikiLovesCard } from '@/components/feed/image-wikiloves-card'
import { ImagePixabayCard } from '@/components/feed/image-pixabay-card'
import { PortailLexicalCard } from '@/components/feed/portail-lexical-card'
import { ProverbeCard } from '@/components/feed/proverbe-card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
  initialVisibility?: CardVisibility
  csrfToken: string
}

interface CardVisibility {
  saviezVous: boolean
  wikipedia: boolean
  radioFrance: boolean
  wikimedia: boolean
  wikiloves: boolean
  cnrs: boolean
  pixabay: boolean
  portailLexical: boolean
  proverbe: boolean
}

interface CardConfig {
  key: string
  isVisible: boolean
  toggle: () => void
  renderCard: () => React.ReactElement | null
}

async function updateCardVisibility(field: string, value: boolean, csrfToken: string) {
  await fetch('/api/user-card-visibility', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ field, value }),
  }).catch(() => {})
}

async function fetchCardOrder(userId: string): Promise<string[]> {
  try {
    const res = await fetch('/api/user-card-order', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.order)) return data.order
    }
  } catch {}
  return ['pixabay', 'saviezVous', 'wikipedia', 'cnrs', 'radioFrance', 'wikimedia', 'wikiloves', 'portailLexical', 'proverbe']
}

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId, initialVisibility, csrfToken: initialCsrfToken }: SujetsClientProps) {
  const [csrfToken, setCsrfToken] = useState(initialCsrfToken || '')
  const router = useRouter()

  useEffect(() => {
    const loadCsrf = async () => {
      const { getCsrfToken } = await import('next-auth/react')
      const token = await getCsrfToken()
      if (token) setCsrfToken(token)
    }
    if (!csrfToken) {
      loadCsrf()
    }
  }, [csrfToken])

  const initialFollowedIdsSet = useMemo(() => new Set(initialFollowedIds), [initialFollowedIds])
  const isAllSelected = useMemo(
    () => allTopics.length > 0 && allTopics.every(t => initialFollowedIdsSet.has(t.id)),
    [allTopics, initialFollowedIdsSet],
  )
  const [followedIds, setFollowedIds] = useState<string[]>(isAllSelected ? [] : initialFollowedIds)
  const followedIdsSet = useMemo(() => new Set(followedIds), [followedIds])

  const [visibility, setVisibility] = useState<CardVisibility>(initialVisibility ?? {
    saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, wikiloves: true, cnrs: true, pixabay: true, portailLexical: true, proverbe: true,
  })

  const [cardOrder, setCardOrder] = useState<string[]>([])
  const [orderLoaded, setOrderLoaded] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchCardOrder(userId).then(order => {
        setCardOrder(order)
        setOrderLoaded(true)
      })
    } else {
      setCardOrder(['saviezVous', 'wikipedia', 'cnrs', 'radioFrance', 'wikimedia', 'wikiloves', 'pixabay', 'portailLexical', 'proverbe'])
      setOrderLoaded(true)
    }
  }, [userId])

  const toggleVisibility = useCallback((field: string, key: keyof CardVisibility) => {
    setVisibility(prev => {
      const next = !prev[key]
      if (userId) {
        updateCardVisibility(field, next, csrfToken)
          .then(() => {
            router.refresh()
          })
          .catch(() => {})
      }
      return { ...prev, [key]: next }
    })
  }, [userId, csrfToken, router])

  const toggleSaviezVous = useCallback(() => toggleVisibility('saviezVousCardVisible', 'saviezVous'), [toggleVisibility])
  const toggleWikipedia = useCallback(() => toggleVisibility('wikipediaImageCardVisible', 'wikipedia'), [toggleVisibility])
  const toggleRadioFrance = useCallback(() => toggleVisibility('radioFranceCardVisible', 'radioFrance'), [toggleVisibility])
  const toggleWikimedia = useCallback(() => toggleVisibility('imageWikimediaCardVisible', 'wikimedia'), [toggleVisibility])
  const toggleWikiLoves = useCallback(() => toggleVisibility('imageWikiLovesCardVisible', 'wikiloves'), [toggleVisibility])
  const toggleCnrs = useCallback(() => toggleVisibility('cnrsNewsEnabled', 'cnrs'), [toggleVisibility])
  const togglePixabay = useCallback(() => toggleVisibility('imagePixabayCardVisible', 'pixabay'), [toggleVisibility])
  const togglePortailLexical = useCallback(() => toggleVisibility('portailLexicalCardVisible', 'portailLexical'), [toggleVisibility])
  const toggleProverbe = useCallback(() => toggleVisibility('proverbeCardVisible', 'proverbe'), [toggleVisibility])

  const handleToggle = (topicId: string) => {
    if (isAllSelected) {
      setFollowedIds([topicId])
    } else if (followedIdsSet.has(topicId)) {
      setFollowedIds(prev => prev.filter(id => id !== topicId))
    } else {
      setFollowedIds(prev => [...prev, topicId])
    }
  }

  const followedTopics = useMemo(
    () => allTopics.filter(t => isAllSelected || followedIdsSet.has(t.id)),
    [allTopics, isAllSelected, followedIdsSet],
  )
  const unfollowedTopics = useMemo(
    () => allTopics.filter(t => !isAllSelected && !followedIdsSet.has(t.id)),
    [allTopics, isAllSelected, followedIdsSet],
  )

  const cardConfigs: CardConfig[] = useMemo(() => [
    {
      key: 'saviezVous',
      isVisible: visibility.saviezVous,
      toggle: toggleSaviezVous,
      renderCard: () => {
        if (!saviezVousFact) return null
        return (
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} onToggle={toggleSaviezVous} userId={userId} isVisible={visibility.saviezVous} />
        )
      },
    },
    {
      key: 'wikipedia',
      isVisible: visibility.wikipedia,
      toggle: toggleWikipedia,
      renderCard: () => (
        <WikipediaImageCard onToggle={toggleWikipedia} largeImage userId={userId} isVisible={visibility.wikipedia} />
      ),
    },
    {
      key: 'cnrs',
      isVisible: visibility.cnrs,
      toggle: toggleCnrs,
      renderCard: () => (
        <CnrsNewsCard onToggle={toggleCnrs} userId={userId} isVisible={visibility.cnrs} />
      ),
    },
    {
      key: 'radioFrance',
      isVisible: visibility.radioFrance,
      toggle: toggleRadioFrance,
      renderCard: () => (
        <RadioFranceCard onToggle={toggleRadioFrance} userId={userId} isVisible={visibility.radioFrance} />
      ),
    },
    {
      key: 'wikimedia',
      isVisible: visibility.wikimedia,
      toggle: toggleWikimedia,
      renderCard: () => (
        <ImageWikimediaCard onToggle={toggleWikimedia} userId={userId} largeImage isVisible={visibility.wikimedia} />
      ),
    },
    {
      key: 'wikiloves',
      isVisible: visibility.wikiloves,
      toggle: toggleWikiLoves,
      renderCard: () => (
        <ImageWikiLovesCard onToggle={toggleWikiLoves} userId={userId} largeImage isVisible={visibility.wikiloves} />
      ),
    },
    {
      key: 'pixabay',
      isVisible: visibility.pixabay,
      toggle: togglePixabay,
      renderCard: () => (
        <ImagePixabayCard onToggle={togglePixabay} userId={userId} largeImage isVisible={visibility.pixabay} />
      ),
    },
    {
      key: 'portailLexical',
      isVisible: visibility.portailLexical,
      toggle: togglePortailLexical,
      renderCard: () => (
        <PortailLexicalCard onToggle={togglePortailLexical} userId={userId} isVisible={visibility.portailLexical} />
      ),
    },
    {
      key: 'proverbe',
      isVisible: visibility.proverbe,
      toggle: toggleProverbe,
      renderCard: () => (
        <ProverbeCard onToggle={toggleProverbe} userId={userId} isVisible={visibility.proverbe} />
      ),
    },
  ], [visibility, toggleSaviezVous, toggleWikipedia, toggleRadioFrance, toggleWikimedia, toggleWikiLoves, toggleCnrs, togglePixabay, togglePortailLexical, toggleProverbe, userId, saviezVousFact])

  const orderedConfigs = useMemo(() => {
    if (!orderLoaded || cardOrder.length === 0) return cardConfigs
    const orderMap = new Map(cardOrder.map((key, index) => [key, index]))
    return [...cardConfigs].sort((a, b) => {
      const aIdx = orderMap.get(a.key) ?? 999
      const bIdx = orderMap.get(b.key) ?? 999
      return aIdx - bIdx
    })
  }, [cardConfigs, cardOrder, orderLoaded])

  const visibleCards = orderedConfigs.filter(c => c.isVisible)
  const hiddenCards = orderedConfigs.filter(c => !c.isVisible)

  if (!orderLoaded) {
    return null
  }

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      {visibleCards.map(card => (
        <div key={card.key} className="mb-6">
          {card.renderCard()}
        </div>
      ))}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 mb-4">
        {hiddenCards.map(card => (
          <div key={card.key} className="h-full">
            {card.renderCard()}
          </div>
        ))}
      </div>

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

      {followedTopics.length > 0 && (
        <div className="mb-8">
          <TopicGrid topics={followedTopics} followedIdsSet={followedIdsSet} onToggle={handleToggle} isAuthenticated={!!userId} allSelected={isAllSelected} />
        </div>
      )}

      <TopicGrid topics={unfollowedTopics} followedIdsSet={followedIdsSet} onToggle={handleToggle} isAuthenticated={!!userId} allSelected={isAllSelected} />
    </div>
  )
}
