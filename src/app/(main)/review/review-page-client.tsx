'use client'

import { useState } from 'react'
import { FlashcardPageClient } from './flashcard-page-client'
import { LexicalPageClient } from './lexical-page-client'
import { BookOpen, Lightbulb } from 'lucide-react'

interface ReviewPageClientProps {
  currentPage: number
}

export default function ReviewPageClient({ currentPage }: ReviewPageClientProps) {
  const [activeTab, setActiveTab] = useState<'ideas' | 'lexical'>('ideas')

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <h1 className="mb-6 text-2xl font-heading font-bold">Révision</h1>
      
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'ideas'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          Idées
        </button>
        <button
          onClick={() => setActiveTab('lexical')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'lexical'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Lexique
        </button>
      </div>

      {activeTab === 'ideas' ? (
        <FlashcardPageClient currentPage={currentPage} />
      ) : (
        <LexicalPageClient currentPage={currentPage} />
      )}
    </div>
  )
}
