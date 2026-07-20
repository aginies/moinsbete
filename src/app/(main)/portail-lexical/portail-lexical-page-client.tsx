'use client'

import { useState, useCallback, useEffect } from 'react'
import { Languages, Search, RefreshCw, BookOpen, ExternalLink, Clock, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/feed/card-header'
import { PortailLexicalCard } from '@/components/feed/portail-lexical-card'

interface PortailLexicalWord {
  form: string
  pos: string
  full_form: string
  full_pos: string
  description: string
  ipa: string
  tlfidefinitions: string[]
  wiktionnaireDefinitions: string[]
  etymologie: string
  concordance: Array<{
    name: string
    title: string
    date: string
    left: string
    matching: string
    right: string
  }>
}

interface SearchSuggestion {
  form: string
  pos: string
  label: string
}

const STORAGE_KEY = 'portail_lexical_history'

function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function addToHistory(word: string) {
  if (typeof window === 'undefined') return
  try {
    const history = getHistory().filter(w => w !== word)
    history.unshift(word)
    if (history.length > 20) history.pop()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

async function searchWords(term: string): Promise<SearchSuggestion[]> {
  try {
    const res = await fetch(`/api/portail-lexical?action=search&q=${encodeURIComponent(term)}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return data.suggestions || []
  } catch {
    return []
  }
}

async function fetchWordDetails(word: string): Promise<PortailLexicalWord | null> {
  try {
    const res = await fetch(`/api/portail-lexical?action=word&word=${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

export function PortailLexicalPageClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedWord, setSelectedWord] = useState<PortailLexicalWord | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>(getHistory())
  const [error, setError] = useState(false)

  useEffect(() => {
    if (searchTerm.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      searchWords(searchTerm).then(results => {
        setSuggestions(results)
        setShowSuggestions(true)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadWord = useCallback(async (word: string) => {
    const safeRegex = /^[a-zA-ZàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]+$/
    if (!word || word.length > 100 || !safeRegex.test(word)) {
      setError(true)
      return
    }
    setLoading(true)
    setError(false)
    const details = await fetchWordDetails(word)
    if (details) {
      setSelectedWord(details)
      addToHistory(word)
      setHistory(getHistory())
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }, [])

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.form)
    setShowSuggestions(false)
    loadWord(suggestion.form)
  }, [loadWord])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    const safeRegex = /^[a-zA-ZàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]+$/
    if (!trimmed || trimmed.length > 100 || !safeRegex.test(trimmed)) {
      setError(true)
      return
    }
    setShowSuggestions(false)
    await loadWord(trimmed)
  }, [searchTerm, loadWord])

  const handleHistoryClick = useCallback(async (word: string) => {
    setSearchTerm(word)
    await loadWord(word)
  }, [loadWord])

  const handleClearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    }
  }, [])

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <div className="mb-6">
        <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-yellow-950/30">
          <CardHeader
            icon={<Languages className="h-4 w-4 text-amber-950" />}
            iconBgColor="bg-amber-500"
            iconDarkColor="dark:bg-amber-600"
            title="Portail Lexical"
            titleColor="text-amber-800"
            titleDarkColor="dark:text-amber-300"
          />

          <form onSubmit={handleSearch} className="mt-4 relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    const val = e.target.value
                    // Keep only letters, accents, spaces, hyphens and apostrophes
                    const filtered = val.replace(/[^a-zA-ZàâäéèêëîïôöùûüçÂÀÆÉÈÊËÎÏÔÖÙÛÜÇœŒ\s'-]/g, '')
                    if (filtered.length <= 100) {
                      setSearchTerm(filtered)
                    }
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Rechercher un mot..."
                  className="pl-10 pr-4 border-amber-200 focus:border-amber-400 dark:border-amber-800 dark:focus:border-amber-600"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-amber-200 bg-white dark:border-amber-800 dark:bg-gray-900 shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          {suggestion.form}
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {suggestion.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
                <BookOpen className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-6">
        <PortailLexicalCard showToggle={false} />
      </div>

      {selectedWord && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-yellow-950/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {selectedWord.form}
              </h2>
              <Link
                href={`https://www.portail-lexical.fr/definition/${encodeURIComponent(selectedWord.form)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
              >
                Voir sur Portail Lexical
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {selectedWord.full_pos}
              </span>
              {selectedWord.ipa && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-mono">
                  /{selectedWord.ipa}/
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 mb-4">
              {selectedWord.description}
            </p>

            {selectedWord.tlfidefinitions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                  Définitions (TLFi)
                </h3>
                <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                  {selectedWord.tlfidefinitions.map((def, i) => (
                    <li key={i} className="leading-relaxed">{def}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedWord.wiktionnaireDefinitions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                  Wiktionnaire
                </h3>
                <ol className="space-y-2 list-decimal list-inside text-sm text-amber-800 dark:text-amber-200">
                  {selectedWord.wiktionnaireDefinitions.map((def, i) => (
                    <li key={i} className="leading-relaxed">{def}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedWord.etymologie && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                  Étimologie
                </h3>
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                  {selectedWord.etymologie}
                </p>
              </div>
            )}

            {selectedWord.concordance.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                  Exemples littéraires
                </h3>
                <div className="space-y-2">
                  {selectedWord.concordance.map((ex, i) => (
                    <blockquote key={i} className="border-l-2 border-amber-300 dark:border-amber-700 pl-3 text-sm italic text-amber-700 dark:text-amber-300">
                      <p className="leading-relaxed text-amber-700 dark:text-amber-300">
                        <span className="mr-1">{`&ldquo;`}</span>{ex.left}{' '}
                        <strong className="not-italic text-amber-900 dark:text-amber-100">{ex.matching}</strong>{' '}
                        {ex.right}
                        <span className="ml-1">{`&rdquo;`}</span>
                      </p>
                      <footer className="text-xs not-italic mt-1 text-amber-600 dark:text-amber-400">
                        — {ex.name}, <em>{ex.title}</em> ({ex.date})
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-100/50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Mot non trouvé. Essayez une autre recherche.
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-yellow-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Recherches récentes
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-800/40 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Effacer
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 10).map((word, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleHistoryClick(word)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/40 transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}
    </div>
  )
}
