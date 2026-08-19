'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Telescope, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { BaseImageCard } from './base-image-card'
import { sanitizeUrl } from '@/lib/utils'
import { fetchCardImage } from '@/lib/fetch-card-image'

interface ApodImage {
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
  date: string
  titreFr?: string
  descriptionFr?: string
}

const APOD_LANG_KEY = 'apod_lang'

function readSavedLang(): 'fr' | 'en' | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const v = localStorage.getItem(APOD_LANG_KEY)
    return v === 'fr' || v === 'en' ? v : null
  } catch {
    return null
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatApodDate(date: string): string {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return date
  }
}

interface ApodCardProps {
  fullImage?: boolean
  largeImage?: boolean
  showLink?: boolean
  showToggle?: boolean
  swipeable?: boolean
  onToggle?: () => void
  storageKey?: string
  isVisible?: boolean
  initialDate?: string
}

function ApodCardInner({
  fullImage = false,
  largeImage = false,
  showLink = true,
  showToggle = true,
  swipeable = false,
  onToggle,
  storageKey = 'apod',
  isVisible,
  initialDate,
}: ApodCardProps) {
  const [topics] = useState<unknown[]>([])
  const locale = useLocale()
  const [lang, setLang] = useState<'fr' | 'en'>(() => readSavedLang() ?? (locale === 'en' ? 'en' : 'fr'))

  const handleLangChange = useCallback((l: 'fr' | 'en') => {
    setLang(l)
    try {
      localStorage.setItem(APOD_LANG_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  const [startDate] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) return initialDate
    if (typeof sessionStorage === 'undefined') return todayStr()
    try {
      const saved = sessionStorage.getItem('base_image_apod')
      if (saved) {
        const docid = JSON.parse(saved)?.docid
        if (typeof docid === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(docid)) return docid
      }
    } catch {
      // ignore
    }
    return todayStr()
  })
  const dateRef = useRef<string>(startDate)

  const fetchFn = useCallback(async (_topics: string | undefined, _direction?: 'prev' | 'next') => {
    if (_direction) {
      const d = new Date(`${dateRef.current}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() - 1)
      dateRef.current = d.toISOString().slice(0, 10)
    }
    const { data } = await fetchCardImage<ApodImage>('/api/apod', { date: dateRef.current }, { requireField: 'imageUrl', timeoutMs: 8000 })
    if (data) {
      dateRef.current = data.docid
    }
    return data
  }, [])

  return (
    <BaseImageCard
      config={{
        resourceType: 'APOD',
        fetchFn,
        defaultTopics: [],
        icon: <Telescope className="h-4 w-4 text-indigo-950" />,
        title: 'APOD',
        color: 'indigo',
        linkHref: showLink ? '/apod' : undefined,
        enablePrefetch: false,
        storageKey,
        visibilityStorageKey: 'apod_card_visible',
        categoriesVisibilityStorageKey: 'apod_show_categories',
        loadingProps: {
          borderColor: 'border-indigo-200',
          borderDarkColor: 'dark:border-indigo-800',
          iconColor: 'text-indigo-400',
          iconDarkColor: 'dark:text-indigo-400',
        },
        imageBorderClass: 'border-indigo-200 dark:border-indigo-800',
        hintColor: 'purple',
        buttonColor: 'purple',
        shareTitlePrefix: 'APOD',
        visibilityLabel: 'Afficher APOD',
        shareTextAuthor: 'NASA',
        shareTextRights: 'NASA / APOD',
        showRefresh: false,
      }}
      topics={topics}
      showCategories={false}
      modalOpen={false}
      onToggleTopic={async () => {}}
      onImageLoaded={() => {}}
      swipeable={swipeable}
      fullImage={fullImage}
      largeImage={largeImage}
      showLink={showLink}
      showToggle={showToggle}
      onToggle={onToggle}
      isVisible={isVisible}
      renderTopics={() => null}
      renderImage={(img) => (
        <img
          decoding="async"
          src={img.imageUrl}
          alt={img.titre}
          loading="lazy"
          className={`w-full transition-opacity ${largeImage ? 'h-[40vh] object-cover bg-neutral-100 dark:bg-neutral-800' : fullImage ? 'max-h-[60vh] object-contain bg-neutral-100 dark:bg-neutral-800' : 'h-64 object-cover pointer-events-none hover:opacity-90'}`}
          onLoad={() => {}}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      renderMetadata={(img) => {
        const hasFr = Boolean(img.titreFr || img.descriptionFr)
        const titre = lang === 'fr' && img.titreFr ? img.titreFr : img.titre
        const description = lang === 'fr' && img.descriptionFr ? img.descriptionFr : img.description
        return (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                {titre}
              </p>
              <span className="flex flex-shrink-0 items-center gap-1">
                {hasFr && (
                  <span className="flex items-center gap-0.5 rounded-full bg-indigo-100 p-0.5 dark:bg-indigo-900/40">
                    {(['fr', 'en'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleLangChange(l) }}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${lang === l ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-200 dark:text-indigo-300 dark:hover:bg-indigo-800/60'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </span>
                )}
                {img.docid && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {formatApodDate(img.docid)}
                  </span>
                )}
              </span>
            </div>
            {img.auteur && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
                {img.auteur}
              </p>
            )}
            {description && (
              <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100 mb-2">
                {description}
              </p>
            )}
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
              {img.droits || 'NASA / APOD'}
            </p>
            {img.link && (
              <Link
                href={sanitizeUrl(img.link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
              >
                Voir sur APOD
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </>
        )
      }}
    />
  )
}

export const ApodCard = React.memo(ApodCardInner)
