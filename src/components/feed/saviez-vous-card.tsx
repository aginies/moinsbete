'use client'

import { useState } from 'react'
import { Lightbulb, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface SaviezVousCardProps {
  text: string
  sourceUrl?: string | null
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

export function SaviezVousCard({ text, sourceUrl }: SaviezVousCardProps) {
  const [fact, setFact] = useState({ text, sourceUrl })
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const newFact = await fetchRandomFact()
    if (newFact) {
      setFact({ text: newFact.text, sourceUrl: newFact.sourceUrl })
    }
    setLoading(false)
  }

  return (
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
        <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
      </div>
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
  )
}
