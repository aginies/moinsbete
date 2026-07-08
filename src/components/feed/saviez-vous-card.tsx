'use client'

import React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { Lightbulb, ExternalLink, RefreshCw, ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import { isValidUrl as isValidUrlUtil } from '@/lib/utils'
import { useShare } from './use-share'
import { ShareButton } from './share-button'

interface SaviezVousCardProps {
  id: string
  text: string
  sourceUrl?: string | null
  imageFilename?: string | null
}

async function fetchRandomFact() {
  try {
    const res = await fetch('/api/saviez-vous?count=1')
    const data = await res.json()
    if (data.facts?.length > 0) {
      return data.facts[0]
    }
  } catch {}
  return null
}

export const SaviezVousCard = React.memo(function SaviezVousCardInner({ id, text, sourceUrl, imageFilename }: SaviezVousCardProps) {
  const [fact, setFact] = useState({ id, text, sourceUrl, imageFilename })
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const resolvedImageFilename = fact.imageFilename || imageFilename

  const handleClick = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setImageError(false)
    const newFact = await fetchRandomFact()
    if (newFact) {
      setFact({ text: newFact.text, sourceUrl: newFact.sourceUrl, imageFilename: newFact.imageFilename })
    }
    setLoading(false)
  }, [loading])

  const hasImage = isValidUrlUtil(resolvedImageFilename) && !imageError

  const shareOptions = fact.id ? {
    title: 'Le saviez-vous ?',
    text: fact.text,
    url: `${typeof window !== 'undefined' ? window.location.origin : 'https://moinsbete.guibo.com'}/saviez-vous/${fact.id}`,
  } : null
  const { share, copied, shareUrl } = useShare(shareOptions)

  return (
    <>
      <div
        onClick={handleClick}
        className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/30 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 dark:bg-amber-600">
              <Lightbulb className="h-4 w-4 text-amber-950" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Le saviez-vous ?
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <ShareButton onClick={share} copied={copied} shareUrl={shareUrl} />
          </div>
        </div>

        {hasImage && (
          <div
            className="mb-3 cursor-pointer overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800"
            onClick={(e) => {
              e.stopPropagation()
              setShowFullImage(true)
            }}
          >
            <img
              src={isValidUrlUtil(resolvedImageFilename) ? resolvedImageFilename! : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt="Illustration"
              className="w-full h-48 object-contain transition-opacity hover:opacity-90 pointer-events-none bg-neutral-100 dark:bg-neutral-800"
              onError={() => setImageError(true)}
            />
            <div className="flex items-center justify-center gap-1 bg-amber-100/80 px-3 py-1.5 dark:bg-amber-900/40">
              <ImageIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-700 dark:text-amber-300">Cliquez pour agrandir</span>
            </div>
          </div>
        )}

        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
          {fact.text}
        </p>
        {fact.sourceUrl && (
          <div className="mt-3">
            <Link
              href={fact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Source: Wikipédia
            </Link>
          </div>
        )}
      </div>

      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] p-4">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={isValidUrlUtil(resolvedImageFilename) ? resolvedImageFilename! : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt="Illustration"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
})
