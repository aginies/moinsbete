'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import React from 'react'
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
import { PortailWikipediaCard } from '@/components/feed/portail-wikipedia-card'
import { ProverbeCard } from '@/components/feed/proverbe-card'
import { NewsCard } from '@/components/feed/news-card'
import { F1Card } from '@/components/feed/f1-card'
import { CitationCard } from '@/components/feed/citation-card'
import { InsoliteCard } from '@/components/feed/insolite-card'
import { VisibilityButton } from '@/components/feed/visibility-button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CARD_DEFAULT_ORDER } from '@/lib/constants'
import { CARD_COLORS } from '@/lib/card-theme'
import { CardNavBar } from '@/components/feed/card-nav-bar'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SujetsClientProps {
  allTopics: Array<{ id: string } & Topic>
  initialFollowedIds: string[]
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId?: string
  initialVisibility?: CardVisibility
  globalVisibility?: Record<string, boolean>
  cardNavBarEnabled?: boolean
}

interface CardVisibility {
  saviezVous: boolean
  wikipedia: boolean
  wikipediaShowEn: boolean
  radioFrance: boolean
  wikimedia: boolean
  wikiloves: boolean
  cnrs: boolean
  pixabay: boolean
  pixabayActiveCategory: string
  portailLexical: boolean
  portailWikipedia: boolean
  proverbe: boolean
  news: boolean
  f1: boolean
  citation: boolean
  insolite: boolean
}

export type { CardVisibility }

interface CardConfig {
  key: string
  isVisible: boolean
  isGloballyVisible: boolean
  toggle: () => void
}

const CARD_DISPLAY_NAMES: Record<string, string> = {
  saviezVous: 'saviez_vous_tab',
  wikipedia: 'wikipedia_tab',
  cnrs: 'cnrs_tab',
  radioFrance: 'radio_tab',
  news: 'news_tab',
  wikimedia: 'wikimedia_tab',
  wikiloves: 'wiki_loves_tab',
  pixabay: 'pixabay_tab',
  portailLexical: 'lexical_tab',
  portailWikipedia: 'portail_wikipedia_tab',
  proverbe: 'proverbe_tab',
  f1: 'f1_tab',
  citation: 'citation_tab',
  insolite: 'insolite_tab',
}

const CARD_RENDERERS: Record<string, (config: CardConfig, saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null, userId: string | undefined, hasUserId: boolean, visibility: CardVisibility | undefined) => React.ReactElement | null> = {
  saviezVous: (config, fact) => {
    if (!fact) return null
    return (
      <SaviezVousCard id={fact.id} text={fact.text} sourceUrl={fact.sourceUrl} imageFilename={fact.imageFilename} onToggle={config.toggle} isVisible={config.isVisible} linkAs={`/le-saviez-vous?factId=${fact.id}`} />
    )
  },
  wikipedia: (config, _, __, ___, vis) => (
    <WikipediaImageCard onToggle={config.toggle} mediumImage isVisible={config.isVisible} wikipediaImageShowEn={(vis as any)?.wikipediaShowEn ?? false} />
  ),
  cnrs: (config) => (
    <CnrsNewsCard onToggle={config.toggle} isVisible={config.isVisible} />
  ),
  radioFrance: (config) => (
    <RadioFranceCard onToggle={config.toggle} isVisible={config.isVisible} />
  ),
  news: (config, _, __, hasUserId) => {
    if (!hasUserId) return null
    return (
      <NewsCard onToggle={config.toggle} isVisible={config.isVisible} linkHref="/news" maxHeight="700px" />
    )
  },
  wikimedia: (config, _, userId) => (
    <ImageWikimediaCard userId={userId} onToggle={config.toggle} largeImage isVisible={config.isVisible} />
  ),
  wikiloves: (config, _, userId) => (
    <ImageWikiLovesCard userId={userId} onToggle={config.toggle} largeImage isVisible={config.isVisible} />
  ),
  pixabay: (config, _, userId) => (
    <ImagePixabayCard userId={userId} onToggle={config.toggle} largeImage isVisible={config.isVisible} />
  ),
  portailLexical: (config) => (
    <PortailLexicalCard onToggle={config.toggle} isVisible={config.isVisible} />
  ),
  portailWikipedia: (config, _, userId) => (
    <PortailWikipediaCard userId={userId} onToggle={config.toggle} isVisible={config.isVisible} />
  ),
  proverbe: (config) => (
    <ProverbeCard onToggle={config.toggle} isVisible={config.isVisible} />
  ),
  f1: (config, _, userId) => (
    <F1Card onToggle={config.toggle} isVisible={config.isVisible} userId={userId} />
  ),
  citation: (config, _, userId) => (
    <CitationCard onToggle={config.toggle} isVisible={config.isVisible} userId={userId} />
  ),
  insolite: (config) => (
    <InsoliteCard onToggle={config.toggle} isVisible={config.isVisible} />
  ),
}

interface CardWrapperProps {
  cardKey: string
  cardId: string
  config: CardConfig
  saviezVousFact: { id: string; text: string; sourceUrl: string | null; imageFilename: string | null } | null
  userId: string | undefined
  hasUserId: boolean
  visibility: CardVisibility | undefined
}

const CardWrapper = React.memo(function CardWrapper({
  cardKey,
  cardId,
  config,
  saviezVousFact,
  userId,
  hasUserId,
  visibility,
}: CardWrapperProps) {
  const renderer = CARD_RENDERERS[cardKey]
  if (!renderer) return null
  return (
    <div className="mb-4 sm:mb-6" id={cardId}>
      {renderer(config, saviezVousFact, userId, hasUserId, visibility)}
    </div>
  )
})

async function updateCardVisibility(field: string, value: boolean) {
  await fetch('/api/user-card-visibility', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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

export function SujetsClient({ allTopics, initialFollowedIds, saviezVousFact, userId, initialVisibility, globalVisibility, cardNavBarEnabled = true }: SujetsClientProps) {
  const router = useRouter()
  const t = useTranslations('feed')

  const [followedIds, setFollowedIds] = useState<string[]>(initialFollowedIds)
  const followedIdsSet = useMemo(() => new Set(followedIds), [followedIds])
  const isAllSelected = allTopics.length > 0 && followedIdsSet.size === allTopics.length

  const [visibility, setVisibility] = useState<CardVisibility>(initialVisibility ?? {
    saviezVous: true, wikipedia: true, wikipediaShowEn: false, radioFrance: true, wikimedia: true, wikiloves: true, cnrs: true, pixabay: true, portailLexical: true, portailWikipedia: true, proverbe: true, news: true, f1: true, citation: true, insolite: true, pixabayActiveCategory: 'bird',
  })

  const [showTopics, setShowTopics] = useState(false)

  const lastSyncedRef = useRef<string | null>(null)
  const syncKey = initialVisibility ? JSON.stringify(initialVisibility) : null

  useEffect(() => {
    if (initialVisibility && syncKey !== lastSyncedRef.current) {
      setVisibility(initialVisibility)
      lastSyncedRef.current = syncKey
    }
  }, [initialVisibility, syncKey])

  const hasUserId = !!userId
  const [cardOrder, setCardOrder] = useState<string[]>(() => hasUserId ? [] : CARD_DEFAULT_ORDER)
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
        updateCardVisibility(field, next)
          .then(() => {
            router.refresh()
          })
          .catch(() => {})
      }
      return { ...prev, [key]: next }
    })
  }, [userId, router])

  const toggleCacheRef = useRef<Map<string, () => void>>(new Map())

  const getToggle = useCallback((field: string, key: keyof CardVisibility) => {
    const cacheKey = `${field}:${String(key)}`
    let fn = toggleCacheRef.current.get(cacheKey)
    if (!fn) {
      fn = () => toggleVisibility(field, key)
      toggleCacheRef.current.set(cacheKey, fn)
    }
    return fn
  }, [toggleVisibility])

  const handleToggle = (topicId: string) => {
    if (followedIdsSet.has(topicId)) {
      setFollowedIds(prev => prev.filter(id => id !== topicId))
    } else {
      setFollowedIds(prev => [...prev, topicId])
    }
  }

  const followedTopics = useMemo(
    () => allTopics.filter(t => followedIdsSet.has(t.id)),
    [allTopics, followedIdsSet],
  )
  const unfollowedTopics = useMemo(
    () => allTopics.filter(t => !followedIdsSet.has(t.id)),
    [allTopics, followedIdsSet],
  )

  const cardDefinitions: Array<{ key: string; visKey: Exclude<keyof CardVisibility, 'pixabayActiveCategory'>; field: string; extraCheck?: () => boolean }> = [
    { key: 'saviezVous', visKey: 'saviezVous', field: 'saviezVousCardVisible' },
    { key: 'wikipedia', visKey: 'wikipedia', field: 'wikipediaImageCardVisible' },
    { key: 'cnrs', visKey: 'cnrs', field: 'cnrsNewsEnabled' },
    { key: 'radioFrance', visKey: 'radioFrance', field: 'radioFranceCardVisible' },
    { key: 'news', visKey: 'news', field: 'newsCardVisible', extraCheck: () => hasUserId },
    { key: 'wikimedia', visKey: 'wikimedia', field: 'imageWikimediaCardVisible' },
    { key: 'wikiloves', visKey: 'wikiloves', field: 'imageWikiLovesCardVisible' },
    { key: 'pixabay', visKey: 'pixabay', field: 'imagePixabayCardVisible' },
    { key: 'portailLexical', visKey: 'portailLexical', field: 'portailLexicalCardVisible' },
    { key: 'portailWikipedia', visKey: 'portailWikipedia', field: 'portailWikipediaCardVisible' },
    { key: 'proverbe', visKey: 'proverbe', field: 'proverbeCardVisible' },
    { key: 'f1', visKey: 'f1', field: 'f1CardVisible', extraCheck: () => hasUserId },
    { key: 'citation', visKey: 'citation', field: 'citationCardVisible' },
    { key: 'insolite', visKey: 'insolite', field: 'insoliteCardVisible' },
  ]

  const cardConfigs: CardConfig[] = useMemo(() =>
    cardDefinitions.map(def => ({
      key: def.key,
      isVisible: visibility[def.visKey] && (globalVisibility?.[def.visKey] ?? true) && (!def.extraCheck || def.extraCheck()),
      isGloballyVisible: globalVisibility?.[def.visKey] ?? true,
      toggle: getToggle(def.field, def.visKey),
    })),
    [visibility, globalVisibility, hasUserId, getToggle],
  )

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
  const hiddenCards = orderedConfigs.filter(c => !c.isVisible && c.isGloballyVisible && (c.key !== 'news' || hasUserId) && (c.key !== 'f1' || hasUserId))

  if (!orderLoaded) {
    return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6 md:pt-16">
        <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-xl mb-4 sm:mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-4xl md:p-6">
      <CardNavBar
        cards={visibleCards.map(c => ({
          key: c.key,
          label: CARD_DISPLAY_NAMES[c.key] ? t(CARD_DISPLAY_NAMES[c.key]) : c.key,
          color: (CARD_COLORS[c.key as keyof typeof CARD_COLORS] ?? 'teal') as string,
        }))}
        enabled={cardNavBarEnabled}
      />

      {visibleCards.map(card => (
        <CardWrapper
          key={card.key}
          cardKey={card.key}
          cardId={card.key}
          config={card}
          saviezVousFact={saviezVousFact}
          userId={userId}
          hasUserId={hasUserId}
          visibility={visibility}
        />
      ))}

      <div className="mb-4 sm:mb-6">
        <div className="rounded-xl border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 dark:border-rose-600 dark:from-rose-950/30 dark:to-pink-950/30 shadow-sm">
          <Link
            href={((userId && followedIds.length > 0) || isAllSelected) ? '/idees/au-hasard?followed=1' : '/sujets'}
            className="block p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600">
                  <span className="text-lg">🎲</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">
                    {((userId && followedIds.length > 0) || isAllSelected) ? t('carte_aléatoire') : t('choisir_sujets')}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-300">
                    {((userId && followedIds.length > 0) || isAllSelected) ? t('découvrir_hasard') : t('sélectionner_sujets')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowTopics(f => !f)
                }}
                className="flex-shrink-0 ml-2 rounded-full p-2 transition-colors hover:bg-rose-200/50 dark:hover:bg-rose-800/50"
              >
                {showTopics ? (
                  <ChevronUp className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                )}
              </button>
            </div>
          </Link>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showTopics ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-5 pt-0 space-y-6">
              {followedTopics.length > 0 && (
                <TopicGrid topics={followedTopics} followedIdsSet={followedIdsSet} onToggle={handleToggle} isAuthenticated={!!userId} />
              )}
              <TopicGrid topics={unfollowedTopics} followedIdsSet={followedIdsSet} onToggle={handleToggle} isAuthenticated={!!userId} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {hiddenCards.map(card => (
          <div key={card.key} className="h-full">
            {card.toggle && <VisibilityButton color={CARD_COLORS[card.key as keyof typeof CARD_COLORS] || 'teal'} label={CARD_DISPLAY_NAMES[card.key] ? t(CARD_DISPLAY_NAMES[card.key]) : card.key} onClick={card.toggle} />}
          </div>
        ))}
      </div>
    </div>
  )
}
