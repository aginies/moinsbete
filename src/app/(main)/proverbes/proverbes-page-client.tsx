'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Quote, Search, BookOpen, Clock, Trash2, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/feed/card-header'
import { ProverbeCard, type Proverbe } from '@/components/feed/proverbe-card'

interface SearchSuggestion {
  id: string
  text: string
  signification: string
  source: string
  hasWiktionnairePage: boolean
  wiktionnaireUrl?: string
  etymologie?: string
  definitions?: string[]
}

const STORAGE_KEY = 'proverbes_history'

function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function addToHistory(text: string) {
  if (typeof window === 'undefined') return
  try {
    const history = getHistory().filter(t => t !== text)
    history.unshift(text)
    if (history.length > 20) history.pop()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

async function searchProverbes(term: string): Promise<SearchSuggestion[]> {
  try {
    const res = await fetch(`/api/proverbes?action=search&q=${encodeURIComponent(term)}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return data.proverbs || []
  } catch {
    return []
  }
}

async function fetchRandomProverbe(): Promise<Proverbe | null> {
  try {
    const res = await fetch('/api/proverbes?action=random', {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export function ProverbesPageClient({ userId }: { userId?: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentProverbe, setCurrentProverbe] = useState<Proverbe | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>(getHistory())
  const [error, setError] = useState(false)

  const loadProverbe = useCallback(async () => {
    setLoading(true)
    setError(false)
    const proverb = await fetchRandomProverbe()
    if (proverb) {
      setCurrentProverbe(proverb)
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (currentProverbe || loadedRef.current) return
    loadedRef.current = true
    loadProverbe()
  }, [loadProverbe, currentProverbe])

  const filteredSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return []
    return suggestions
  }, [searchTerm, suggestions])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchProverbes(searchTerm).then(results => {
          setSuggestions(results)
          setShowSuggestions(true)
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  const handleRefresh = useCallback(async () => {
    await loadProverbe()
  }, [loadProverbe])

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text)
    setShowSuggestions(false)
    setCurrentProverbe(suggestion as Proverbe)
  }, [])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    addToHistory(trimmed)
    setHistory(getHistory())

    setLoading(true)
    const results = await searchProverbes(trimmed)
    if (results.length > 0) {
      setCurrentProverbe(results[0] as Proverbe)
    }
    setLoading(false)
  }, [searchTerm])

  const handleHistoryClick = useCallback(async (text: string) => {
    setSearchTerm(text)
    setLoading(true)
    const results = await searchProverbes(text)
    if (results.length > 0) {
      setCurrentProverbe(results[0] as Proverbe)
    }
    setLoading(false)
  }, [])

  const handleClearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    }
  }, [])

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <div className="mb-6">
        <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardHeader
            icon={<Quote className="h-4 w-4 text-emerald-950" />}
            iconBgColor="bg-emerald-500"
            iconDarkColor="dark:bg-emerald-600"
            title="Proverbes"
            titleColor="text-emerald-800"
            titleDarkColor="dark:text-emerald-300"
            showRefresh={true}
            loading={loading}
            onRefresh={handleRefresh}
          />

          <form onSubmit={handleSearch} className="mt-4 relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      const val = e.target.value
                      const filtered = val.replace(/[^a-zA-ZàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
                      if (filtered.length <= 100) {
                        setSearchTerm(filtered)
                      }
                    }}
                    onFocus={() => filteredSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Rechercher un proverbe..."
                    className="pl-10 pr-10 border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setShowSuggestions(false)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                    >
                      <span className="text-lg">×</span>
                    </button>
                  )}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-gray-900 shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          {suggestion.text}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          {suggestion.source}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <BookOpen className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Recherches récentes
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-800/40 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 10).map((text, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleHistoryClick(text)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-800/40 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentProverbe && (
        <ProverbeCard
          userId={userId}
          proverbe={currentProverbe}
          onRefresh={handleRefresh}
          loading={loading}
          showToggle={false}
          title="Proverbe"
          linkHref={null}
        />
      )}

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-100/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center">
            Erreur lors du chargement du proverbe.
          </p>
        </div>
      )}

      {loading && !currentProverbe && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}
    </div>
  )
}
