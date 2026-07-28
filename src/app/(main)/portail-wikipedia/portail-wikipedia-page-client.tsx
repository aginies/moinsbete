'use client'

import { useState, useCallback, useEffect } from 'react'
import { Globe, Search, RefreshCw, ExternalLink, X, Clock, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/feed/card-header'
import { PortailWikipediaCard } from '@/components/feed/portail-wikipedia-card'

interface SearchArticle {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

const STORAGE_KEY = 'portail_wikipedia_search_history'

function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function addToHistory(title: string) {
  if (typeof window === 'undefined') return
  try {
    const history = getHistory().filter(t => t !== title)
    history.unshift(title)
    if (history.length > 20) history.pop()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

async function searchArticles(term: string): Promise<SearchArticle[]> {
  try {
    const res = await fetch(`/api/portail-wikipedia/search?q=${encodeURIComponent(term)}&limit=10`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return data.articles || []
  } catch {
    return []
  }
}

export function PortailWikipediaPageClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchArticle[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>(getHistory())

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      searchArticles(searchTerm).then(results => {
        setResults(results)
        setShowResults(true)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSelectArticle = useCallback((article: SearchArticle) => {
    setSearchTerm(article.title)
    setShowResults(false)
    window.open(article.pageUrl, '_blank', 'noopener,noreferrer')
  }, [])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    if (!trimmed) return
    setShowResults(false)
    if (results.length > 0) {
      window.open(results[0].pageUrl, '_blank', 'noopener,noreferrer')
    }
  }, [searchTerm, results])

  const handleHistoryClick = useCallback((title: string) => {
    setSearchTerm(title)
    window.open(`https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer')
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
        <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:border-indigo-700 dark:from-indigo-950/30 dark:to-violet-950/30">
          <CardHeader
            icon={<Globe className="h-4 w-4 text-indigo-950" />}
            iconBgColor="bg-indigo-500"
            iconDarkColor="dark:bg-indigo-600"
            title="Recherche Portail Wikipédia"
            titleColor="text-indigo-800"
            titleDarkColor="dark:text-indigo-300"
          />

          <form onSubmit={handleSearch} className="mt-4 relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Rechercher un article..."
                  className="pl-10 pr-10 border-indigo-200 focus:border-indigo-400 dark:border-indigo-800 dark:focus:border-indigo-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setShowResults(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {showResults && results.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-indigo-200 bg-white dark:border-indigo-800 dark:bg-gray-900 shadow-lg max-h-80 overflow-y-auto">
                    {results.map((article, i) => (
                      <button
                        key={article.id}
                        type="button"
                        onMouseDown={() => handleSelectArticle(article)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-start gap-3"
                      >
                        {article.imageUrl && (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                            {article.title}
                          </span>
                          {article.extract && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 line-clamp-2 mt-1">
                              {article.extract}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <PortailWikipediaCard />

      {history.length > 0 && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:border-indigo-700 dark:from-indigo-950/30 dark:to-violet-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                  Recherches récentes
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-indigo-300 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-800/40 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Effacer
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 10).map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleHistoryClick(title)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-indigo-300 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-800/40 transition-colors"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
