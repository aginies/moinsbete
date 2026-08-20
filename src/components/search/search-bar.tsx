'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { useTranslations } from 'next-intl'
import { sanitizeUrl } from '@/lib/utils'

interface SearchResult {
  ideas: Array<{ id: string; title: string; slug: string; content: string; takeaway: string; topics: Array<{ id: string; name: string; slug: string; icon: string; color: string }>; source: { title: string; type: string; url: string | null; coverUrl: string | null } }>
  sources: Array<{ id: string; title: string; slug: string }>
  topics: Array<{ id: string; name: string; slug: string; icon: string }>
  facts: Array<{ id: string; text: string }>
  proverbs: Array<{ id: string; text: string; signification: string; source: string }>
  images: Array<{ id: string; imageUrl: string; description: string; fileUrl: string; date: string }>
  news: Array<{ id: string; title: string; description: string; url: string; imageUrl: string | null }>
  citations: Array<{ id: string; text: string; author: string; wikiUrl: string }>
  portailWikipedia: Array<{ id: string; title: string; extract: string; pageUrl: string; imageUrl: string | null }>
  insolite: Array<{ id: string; title: string; description: string; url: string; imageUrl: string | null }>
}

interface SearchBarProps {
  onClose?: () => void
}

export const SearchBar = memo(function SearchBar({ onClose }: SearchBarProps) {
  const t = useTranslations('search')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const closeResults = useCallback(() => {
    setQuery('')
    setResults(null)
    setError(false)
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const navigateAndClose = useCallback((href: string) => {
    router.push(href)
    closeResults()
  }, [router, closeResults])

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
      setError(false)
      setIsOpen(false)
      return
    }

    setResults(null)
    setError(false)

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) {
          console.error('Search API error:', res.status, res.statusText)
          setError(true)
          return
        }
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Search fetch error:', err)
        setError(true)
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const hasResults = results && (results.ideas.length > 0 || results.sources.length > 0 || results.topics.length > 0 || results.facts.length > 0 || results.proverbs.length > 0 || results.images.length > 0 || results.news.length > 0 || results.citations.length > 0 || results.portailWikipedia.length > 0 || results.insolite.length > 0)

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
          role="combobox"
          aria-expanded={!!(isOpen && hasResults)}
          aria-controls="search-results-dropdown"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={closeResults}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && hasResults && (
        <div id="search-results-dropdown" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-xl border border-border/60 bg-card p-4 shadow-lg">
          {results.topics.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_topics')}</h4>
              <div className="space-y-1">
                {results.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/sujets/${topic.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={closeResults}
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
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_ideas')}</h4>
              <div className="space-y-2">
                {results.ideas.map((idea) => {
                    const compactIdea = {
                    id: idea.id,
                    title: idea.title,
                    slug: idea.slug,
                    source: { title: idea.source.title, type: idea.source.type, url: idea.source.url, coverUrl: idea.source.coverUrl },
                    topics: idea.topics.map(t => ({ id: t.id || '', name: t.name, slug: t.slug || '', icon: t.icon, color: t.color })),
                  }
                  return (
                    <CompactIdeaCard key={idea.id} idea={compactIdea} />
                  )
                })}
              </div>
            </div>
          )}

          {results.facts.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_facts')}</h4>
              <div className="space-y-1">
                {results.facts.map((fact) => (
                  <button
                    key={fact.id}
                    type="button"
                    onClick={() => navigateAndClose(`/le-saviez-vous?factId=${fact.id}`)}
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                  >
                    <span className="line-clamp-2">{fact.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.proverbs.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_proverbs')}</h4>
              <div className="space-y-1">
                {results.proverbs.map((proverb) => (
                  <Link
                    key={proverb.id}
                    href={`/proverbes?q=${encodeURIComponent(proverb.text)}`}
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    onClick={closeResults}
                  >
                    <span className="line-clamp-2 font-medium text-foreground">{proverb.text}</span>
                    {proverb.signification && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{proverb.signification}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.portailWikipedia.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_portail_wikipedia')}</h4>
              <div className="space-y-1">
                {results.portailWikipedia.map((article) => (
                  <Link
                    key={article.id}
                    href={sanitizeUrl(article.pageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    onClick={closeResults}
                  >
                    <span className="line-clamp-2 font-medium text-foreground">{article.title}</span>
                    {article.extract && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{article.extract}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.citations.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_citations')}</h4>
              <div className="space-y-1">
                {results.citations.map((citation) => (
                  <Link
                    key={citation.id}
                    href={sanitizeUrl(citation.wikiUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    onClick={closeResults}
                  >
                    <span className="line-clamp-2 font-medium text-foreground italic">&ldquo;{citation.text}&rdquo;</span>
                    {citation.author && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">— {citation.author}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.insolite.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_insolite')}</h4>
              <div className="space-y-1">
                {results.insolite.map((article) => (
                  <Link
                    key={article.id}
                    href={sanitizeUrl(article.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    onClick={closeResults}
                  >
                    <span className="line-clamp-2 font-medium text-foreground">{article.title}</span>
                    {article.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{article.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.news.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_news')}</h4>
              <div className="space-y-1">
                {results.news.map((article) => (
                  <Link
                    key={article.id}
                    href={sanitizeUrl(article.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    onClick={closeResults}
                  >
                    <span className="line-clamp-2 font-medium text-foreground">{article.title}</span>
                    {article.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{article.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.images.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_images')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {results.images.map((image) => (
                  <Link
                    key={image.id}
                    href={sanitizeUrl(image.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg overflow-hidden border border-border/60 hover:border-border hover:shadow-sm transition-all"
                    onClick={closeResults}
                  >
                    <div className="aspect-square bg-muted relative">
                      <Image
                        src={image.imageUrl}
                        alt={image.description}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors">
                        {image.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.sources.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('results_sources')}</h4>
              <div className="space-y-1">
                {results.sources.map((source) => (
                  <Link
                    key={source.id}
                    href={`/sources/${source.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={closeResults}
                  >
                    <span>{source.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && !hasResults && query.length >= 2 && !searching && !error && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-6 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">{t('no_results', { query })}</p>
        </div>
      )}

      {error && !searching && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-6 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">{t('error')}</p>
        </div>
      )}

      {searching && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/60 bg-card p-6 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('searching')}</p>
          </div>
          <p className="text-xs text-muted-foreground/60">{t('time_estimate')}</p>
        </div>
      )}
    </div>
  )
})
