'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Lightbulb, Camera, Newspaper, Mic, Globe, BookOpen, Languages, Quote, Trophy, Video } from 'lucide-react'
import { getTheme, type CardColorName } from '@/lib/card-theme'

interface CardNavBarProps {
  cards: { key: string; label: string; color: string }[]
  enabled: boolean
}

const CARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  saviezVous: Lightbulb,
  wikipedia: Camera,
  cnrs: Newspaper,
  radioFrance: Mic,
  news: Globe,
  wikimedia: Camera,
  wikiloves: Camera,
  pixabay: Video,
  portailLexical: Languages,
  portailWikipedia: Languages,
  proverbe: Quote,
  f1: Trophy,
  citation: Quote,
}

const MAX_PILLS = 7

export function CardNavBar({ cards, enabled }: CardNavBarProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [isVisible, setIsVisible] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [lastHideTime, setLastHideTime] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    const allKeys = new Set(cards.map(c => c.key))

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleKeys(prev => {
          const next = new Set(prev)
          for (const entry of entries) {
            const key = entry.target.getAttribute('data-card-key')
            if (!key) continue
            if (entry.isIntersecting) {
              next.add(key)
            } else {
              next.delete(key)
            }
          }
          return next
        })
      },
      { rootMargin: '-10px 0px -10px 0px', threshold: 0.1 }
    )

    for (const card of cards) {
      const el = document.getElementById(card.key)
      if (el) {
        el.setAttribute('data-card-key', card.key)
        observerRef.current.observe(el)
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [cards])

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const now = Date.now()
    const scrollingDown = currentScrollY > lastScrollY

    if (currentScrollY < 80) {
      if (isVisible) setIsVisible(false)
      setLastScrollY(currentScrollY)
      return
    }

    if (scrollingDown) {
      if (!isVisible || now - lastHideTime > 2500) {
        setIsVisible(true)
      }
    } else {
      if (isVisible) {
        setIsVisible(false)
        setLastHideTime(now)
      }
    }

    setLastScrollY(currentScrollY)
  }, [isVisible, lastScrollY, lastHideTime])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => {
      setIsVisible(false)
      setLastHideTime(Date.now())
    }, 2500)
    return () => clearTimeout(timer)
  }, [isVisible])

  const handleCardClick = useCallback((key: string) => {
    const el = document.getElementById(key)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const excludedKeys = useMemo(() => {
    const excluded = new Set<string>()
    const cardKeys = cards.map(c => c.key)

    for (const visibleKey of visibleKeys) {
      const idx = cardKeys.indexOf(visibleKey)
      if (idx === -1) continue

      if (idx > 0) excluded.add(cardKeys[idx - 1])
      excluded.add(cardKeys[idx])
      if (idx < cardKeys.length - 1) excluded.add(cardKeys[idx + 1])
    }

    return excluded
  }, [visibleKeys, cards])

  const offscreenCards = useMemo(() => {
    const filtered = cards.filter(card => !visibleKeys.has(card.key) && !excludedKeys.has(card.key))
    return isDesktop ? filtered : filtered.slice(0, MAX_PILLS)
  }, [cards, visibleKeys, excludedKeys, isDesktop])

  if (!enabled || cards.length === 0) return null

  return (
    <div
      className={`fixed top-[56px] left-0 right-0 z-40 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-border/30 py-1.5 transition-all duration-300 ${
        isVisible && offscreenCards.length > 0 ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="mx-auto w-full max-w-4xl px-3 md:px-6">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {offscreenCards.map(card => {
            const Icon = CARD_ICONS[card.key] || Lightbulb
            const colors = getTheme(card.color as CardColorName)
            const shortLabel = (() => {
              const label = card.label.split(' ').slice(0, 2).join(' ')
              if (card.key === 'f1') return 'F1'
              if (card.key === 'portailLexical') return 'Lexical'
              if (card.key === 'portailWikipedia') return 'Wikipedia'
              if (card.key === 'wikiloves') return 'Loves'
              if (card.key === 'saviezVous') return 'Anecdote'
              if (card.key === 'radioFrance') return 'RadioF'
              return label
            })()

            return (
              <button
                key={card.key}
                onClick={() => handleCardClick(card.key)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap min-w-[44px] ${colors.navBg} ${colors.navText} ${colors.navBgDark} ${colors.navTextDark} border border-current/20 hover:border-current/40 transition-colors`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
