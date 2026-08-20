'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SearchOverlay } from '@/components/search/search-overlay'

export function SearchButton() {
  const t = useTranslations('nav')
  const [showSearch, setShowSearch] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSearch(true)}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label={t('search')}
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </button>
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  )
}
