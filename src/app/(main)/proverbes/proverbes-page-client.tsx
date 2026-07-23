'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Quote, Search, BookOpen, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/feed/card-header'
import { ProverbeCard, type Proverbe } from '@/components/feed/proverbe-card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'

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

async function fetchSources(): Promise<string[]> {
  try {
    const res = await fetch('/api/proverbes?action=sources', {
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return data.sources || []
  } catch {
    return []
  }
}

async function fetchAllProverbes(categories?: string[]): Promise<SearchSuggestion[]> {
  try {
    const params = new URLSearchParams({ action: 'all' })
    if (categories && categories.length > 0) {
      params.set('categories', categories.join(','))
    }
    const res = await fetch(`/api/proverbes?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return data.proverbs || []
  } catch {
    return []
  }
}

async function searchProverbes(term: string, categories?: string[]): Promise<SearchSuggestion[]> {
  try {
    const params = new URLSearchParams({ action: 'search', q: term })
    if (categories && categories.length > 0) {
      params.set('categories', categories.join(','))
    }
    const res = await fetch(`/api/proverbes?${params.toString()}`, {
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

export function ProverbesPageClient({ userId, initialQuery }: { userId?: string; initialQuery?: string }) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || '')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentProverbe, setCurrentProverbe] = useState<Proverbe | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>(getHistory())
  const [error, setError] = useState(false)
  const [allSources, setAllSources] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [allProverbes, setAllProverbes] = useState<SearchSuggestion[]>([])
  const [showAllList, setShowAllList] = useState(false)

  const t = useTranslations()

  useEffect(() => {
    if (initialQuery && initialQuery.length >= 2) {
      setSearchTerm(initialQuery)
      searchProverbes(initialQuery, selectedCategories).then(results => {
        setSuggestions(results)
        if (results.length > 0) {
          setCurrentProverbe(results[0] as Proverbe)
        }
      })
    }
  }, [initialQuery])

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

  useEffect(() => {
    fetchSources().then(sources => setAllSources(sources))
  }, [])

  useEffect(() => {
    fetchAllProverbes(selectedCategories).then(proverbes => {
      setAllProverbes(proverbes)
    })
  }, [selectedCategories])

  const filteredSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return []
    return suggestions
  }, [searchTerm, suggestions])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchProverbes(searchTerm, selectedCategories).then(results => {
          setSuggestions(results)
          setShowSuggestions(true)
        })
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, selectedCategories])

  const handleRefresh = useCallback(async () => {
    await loadProverbe()
  }, [loadProverbe])

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text)
    setShowSuggestions(false)
    setShowAllList(false)
    setCurrentProverbe(suggestion as Proverbe)
  }, [])

  const handleSelectFromAllList = useCallback((proverb: SearchSuggestion) => {
    setSearchTerm(proverb.text)
    setShowAllList(false)
    setCurrentProverbe(proverb as Proverbe)
  }, [])

  const handleInputFocus = useCallback(() => {
    if (searchTerm.length < 2) {
      setShowAllList(true)
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowAllList(false)
      setShowSuggestions(false)
    }, 200)
  }, [])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    addToHistory(trimmed)
    setHistory(getHistory())

    setLoading(true)
    const results = await searchProverbes(trimmed, selectedCategories)
    if (results.length > 0) {
      setCurrentProverbe(results[0] as Proverbe)
    }
    setLoading(false)
  }, [searchTerm, selectedCategories])

  const handleHistoryClick = useCallback(async (text: string) => {
    setSearchTerm(text)
    setLoading(true)
    const results = await searchProverbes(text, selectedCategories)
    if (results.length > 0) {
      setCurrentProverbe(results[0] as Proverbe)
    }
    setLoading(false)
  }, [selectedCategories])

  const handleClearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    }
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  const clearCategories = useCallback(() => {
    setSelectedCategories([])
  }, [])

  const hasActiveCategories = selectedCategories.length > 0

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <div className="mb-6">
        <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardHeader
            icon={<Quote className="h-4 w-4 text-emerald-950" />}
            iconBgColor="bg-emerald-500"
            iconDarkColor="dark:bg-emerald-600"
            title="Recherche proverbe"
            titleColor="text-emerald-800"
            titleDarkColor="dark:text-emerald-300"
            showRefresh={false}
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
                        if (filtered.length >= 2) {
                          setShowAllList(false)
                        }
                      }
                    }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={t('feed.search_proverbe_placeholder')}
                    className="pl-10 pr-10 border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setShowSuggestions(false)
                        setShowAllList(false)
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

                {showAllList && allProverbes.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-gray-900 shadow-lg max-h-80 overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-2 border-b border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t('feed.all_proverbes', { count: allProverbes.length })}
                      </span>
                    </div>
                    {allProverbes.map((proverb, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectFromAllList(proverb)}
                        className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm text-emerald-900 dark:text-emerald-100 truncate pr-4">
                          {proverb.text}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                          {proverb.source}
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

          <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
              >
                <Filter className="h-4 w-4" />
                {t('feed.categories')}
                {hasActiveCategories && (
                  <span className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs min-w-[20px] h-5 px-1">
                    {selectedCategories.length}
                  </span>
                )}
                {showCategories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showCategories && (
                <div className="mt-3 space-y-2">
                  {allSources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allSources.map((source) => (
                        <label
                          key={source}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm"
                          style={{
                            borderColor: selectedCategories.includes(source)
                              ? 'rgb(16, 185, 129)'
                              : 'rgb(187, 247, 208)',
                            backgroundColor: selectedCategories.includes(source)
                              ? 'rgb(16, 185, 129)'
                              : 'rgb(240, 253, 244)',
                            color: selectedCategories.includes(source)
                              ? 'white'
                              : 'rgb(22, 101, 52)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(source)}
                            onChange={() => toggleCategory(source)}
                            className="sr-only"
                          />
                          <span className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                            style={{
                              borderColor: selectedCategories.includes(source) ? 'white' : 'rgb(16, 185, 129)',
                              backgroundColor: selectedCategories.includes(source) ? 'white' : 'transparent',
                            }}
                          >
                            {selectedCategories.includes(source) && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{source}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {hasActiveCategories && (
                    <button
                      type="button"
                      onClick={clearCategories}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 underline"
                    >
                      {t('feed.clear_filters')}
                    </button>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {t('feed.recent_searches')}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-800/40 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                {t('feed.clear')}
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
          title={t('feed.proverbe')}
          linkHref={null}
        />
      )}

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-100/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center">
            {t('feed.proverbe_load_error')}
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
