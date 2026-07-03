'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SearchResult {
  ideas: Array<{ id: string; title: string; slug: string; topics: Array<{ name: string; icon: string }> }>
  sources: Array<{ id: string; title: string; slug: string }>
  topics: Array<{ id: string; name: string; slug: string; icon: string }>
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const closeSearch = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch {
        setResults(null)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const hasResults = results && (results.ideas.length > 0 || results.sources.length > 0 || results.topics.length > 0)

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher des idées, sources, sujets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && hasResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-4 shadow-lg">
          {results.topics.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Sujets</h4>
              <div className="space-y-1">
                {results.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/sujets/${topic.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => { setQuery(''); setIsOpen(false) }}
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.ideas.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Idées</h4>
              <div className="space-y-1">
                {results.ideas.slice(0, 5).map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/idees/${idea.slug}`}
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => { setQuery(''); setIsOpen(false) }}
                  >
                    <span className="font-medium">{idea.title}</span>
                    {idea.topics.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {idea.topics[0].icon} {idea.topics[0].name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.sources.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Sources</h4>
              <div className="space-y-1">
                {results.sources.slice(0, 3).map((source) => (
                  <Link
                    key={source.id}
                    href={`/sources/${source.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => { setQuery(''); setIsOpen(false) }}
                  >
                    <span>{source.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && !hasResults && query.length >= 2 && !searching && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-6 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">Aucun résultat pour "{query}"</p>
        </div>
      )}

      {searching && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-6 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">Recherche en cours...</p>
        </div>
      )}
    </div>
  )
}
