'use client'

import { Search } from 'lucide-react'
import { normalizeAccents } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  description: string
  source: string
  sourceTab: string
  navigateTo: () => void
}

interface SearchResultsProps {
  searchQuery: string
  results: SearchResult[]
}

function highlightMatch(text: string, query: string): string {
  if (!query?.trim()) return text
  const normalizedText = normalizeAccents(text).toLowerCase()
  const normalizedQuery = normalizeAccents(query).toLowerCase()
  const index = normalizedText.indexOf(normalizedQuery)
  if (index === -1) return text
  
  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)
  
  return `${before}<mark class="bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100">${match}</mark>${after}`
}

export function SearchResults({ searchQuery, results }: SearchResultsProps) {
  const router = useRouter()
  
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.source]) {
      acc[result.source] = []
    }
    acc[result.source].push(result)
    return acc
  }, {})
  
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Aucun résultat pour "{searchQuery}"</p>
        <p className="text-sm text-muted-foreground mt-1">Essayez avec d&apos;autres termes de recherche</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {results.length} résultat{results.length !== 1 ? 's' : ''} pour &quot;{searchQuery}&quot;
      </p>
      
      {Object.entries(groupedResults).map(([source, items]) => (
        <div key={source}>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            {source}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h3>
          <div className="space-y-2">
            {items.map((result) => (
              <button
                key={result.id}
                onClick={result.navigateTo}
                className="w-full text-left rounded-lg border border-border/60 bg-card p-3 hover:bg-muted transition-colors"
              >
                <p 
                  className="text-sm font-medium text-foreground mb-1"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(result.title, searchQuery) }}
                />
                {result.description && (
                  <p 
                    className="text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: highlightMatch(result.description, searchQuery) }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
