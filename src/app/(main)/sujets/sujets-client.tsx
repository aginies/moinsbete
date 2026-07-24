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
import { NewsCard } from '@/components/feed/news-card'
import { VisibilityButton } from '@/components/feed/visibility-button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CARD_DEFAULT_ORDER } from '@/lib/constants'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
  initialVisibility?: CardVisibility
  globalVisibility?: Record<string, boolean>
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
  news: boolean
}

interface CardConfig {
  key: string
  isVisible: boolean
  isGloballyVisible: boolean
  toggle: () => void
}

const CARD_RENDERERS: Record<string, (config: CardConfig, saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null, userId: string | undefined, hasUserId: boolean) => React.ReactElement | null> = {
  saviezVous: (config, fact) => {
    if (!fact) return null
    return (
      <SaviezVousCard id={fact.id} text={fact.text} sourceUrl={fact.sourceUrl} imageFilename={fact.imageFilename} onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} linkAs={`/le-saviez-vous?factId=${fact.id}`} />
    )
  },
  wikipedia: (config) => (
    <WikipediaImageCard onToggle={config.toggle} mediumImage userId={undefined} isVisible={config.isVisible} />
  ),
  cnrs: (config) => (
    <CnrsNewsCard onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} />
  ),
  radioFrance: (config) => (
    <RadioFranceCard onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} />
  ),
  news: (config, _, __, hasUserId) => {
    if (!hasUserId) return null
    return (
      <NewsCard onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} linkHref="/news" maxHeight="700px" />
    )
  },
  wikimedia: (config) => (
    <ImageWikimediaCard onToggle={config.toggle} userId={undefined} largeImage isVisible={config.isVisible} />
  ),
  wikiloves: (config) => (
    <ImageWikiLovesCard onToggle={config.toggle} userId={undefined} largeImage isVisible={config.isVisible} />
  ),
  pixabay: (config) => (
    <ImagePixabayCard onToggle={config.toggle} userId={undefined} largeImage isVisible={config.isVisible} />
  ),
  portailLexical: (config) => (
    <PortailLexicalCard onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} />
  ),
  proverbe: (config) => (
    <ProverbeCard onToggle={config.toggle} userId={undefined} isVisible={config.isVisible} />
  ),
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
      if (Array.isArray(data.order)) {
        return data.order
      }
    }
  } catch {}
  return CARD_DEFAULT_ORDER
}

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId, initialVisibility, globalVisibility, csrfToken: initialCsrfToken }: SujetsClientProps) {
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
    saviezVous: true, wikipedia: true, radioFrance: true, wikimedia: true, wikiloves: true, cnrs: true, pixabay: true, portailLexical: true, proverbe: true, news: true,
  })

  const hasUserId = !!userId
  const [cardOrder, setCardOrder] = useState<string[]>(() => hasUserId ? [] : ['saviezVous', 'wikipedia', 'cnrs', 'radioFrance', 'news', 'wikimedia', 'wikiloves', 'pixabay', 'portailLexical', 'proverbe'])
  const [orderLoaded, setOrderLoaded] = useState(!hasUserId)

  useEffect(() => {
    if (hasUserId) {
      fetchCardOrder(userId).then(order => {
        setCardOrder(order)
        setOrderLoaded(true)
      })
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
  const toggleNews = useCallback(() => toggleVisibility('newsCardVisible', 'news'), [toggleVisibility])

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
      isVisible: visibility.saviezVous && (globalVisibility?.saviezVous ?? true),
      isGloballyVisible: globalVisibility?.saviezVous ?? true,
      toggle: toggleSaviezVous,
    },
    {
      key: 'wikipedia',
      isVisible: visibility.wikipedia && (globalVisibility?.wikipedia ?? true),
      isGloballyVisible: globalVisibility?.wikipedia ?? true,
      toggle: toggleWikipedia,
    },
    {
      key: 'cnrs',
      isVisible: visibility.cnrs && (globalVisibility?.cnrs ?? true),
      isGloballyVisible: globalVisibility?.cnrs ?? true,
      toggle: toggleCnrs,
    },
    {
      key: 'radioFrance',
      isVisible: visibility.radioFrance && (globalVisibility?.radioFrance ?? true),
      isGloballyVisible: globalVisibility?.radioFrance ?? true,
      toggle: toggleRadioFrance,
    },
    {
      key: 'news',
      isVisible: visibility.news && (globalVisibility?.news ?? true) && hasUserId,
      isGloballyVisible: globalVisibility?.news ?? true,
      toggle: toggleNews,
    },
    {
      key: 'wikimedia',
      isVisible: visibility.wikimedia && (globalVisibility?.wikimedia ?? true),
      isGloballyVisible: globalVisibility?.wikimedia ?? true,
      toggle: toggleWikimedia,
    },
    {
      key: 'wikiloves',
      isVisible: visibility.wikiloves && (globalVisibility?.wikiloves ?? true),
      isGloballyVisible: globalVisibility?.wikiloves ?? true,
      toggle: toggleWikiLoves,
    },
    {
      key: 'pixabay',
      isVisible: visibility.pixabay && (globalVisibility?.pixabay ?? true),
      isGloballyVisible: globalVisibility?.pixabay ?? true,
      toggle: togglePixabay,
    },
    {
      key: 'portailLexical',
      isVisible: visibility.portailLexical && (globalVisibility?.portailLexical ?? true),
      isGloballyVisible: globalVisibility?.portailLexical ?? true,
      toggle: togglePortailLexical,
    },
    {
      key: 'proverbe',
      isVisible: visibility.proverbe && (globalVisibility?.proverbe ?? true),
      isGloballyVisible: globalVisibility?.proverbe ?? true,
      toggle: toggleProverbe,
    },
  ], [visibility, toggleSaviezVous, toggleWikipedia, toggleRadioFrance, toggleNews, toggleWikimedia, toggleWikiLoves, toggleCnrs, togglePixabay, togglePortailLexical, toggleProverbe, globalVisibility, hasUserId])

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
  const hiddenCards = orderedConfigs.filter(c => !c.isVisible && c.isGloballyVisible && (c.key !== 'news' || hasUserId))

  if (!orderLoaded) {
    return null
  }

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      {visibleCards.map(card => {
        const renderer = CARD_RENDERERS[card.key]
        if (!renderer) return null
        return (
          <div key={card.key} className="mb-6">
            {renderer(card, saviezVousFact, userId, hasUserId)}
          </div>
        )
      })}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 mb-4">
        {hiddenCards.map(card => (
          <div key={card.key} className="h-full">
            {card.toggle && <VisibilityButton color="teal" label={`Afficher ${card.key}`} onClick={card.toggle} />}
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
