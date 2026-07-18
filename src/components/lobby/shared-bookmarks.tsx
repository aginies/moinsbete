'use client'

import Link from 'next/link'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { User, Trash2, Camera, BookOpen, ExternalLink, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { unshareFromLobby, unshareResourceFromLobby } from '@/actions/lobby-share-actions'
import { sanitizeUrl, isValidUrl } from '@/lib/utils'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { useState, useMemo } from 'react'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked = local.length > 2 ? local[0] + '***' : local.slice(0, 1) + '*'
  return `${masked}@${domain}`
}

interface SaviezVousFact {
  id: string
  text: string
  sourceUrl: string | null
  imageFilename: string | null
}

interface CachedWikipediaImage {
  id: string
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

interface CachedWikiLovesImage {
  id: string
  docid: string
  title: string
  author: string
  imageUrl: string
  commonsUrl: string | null
  license: string
  year: number
}

interface SharedBookmark {
  id: string
  userId: string
  ideaId: string | null
  resourceId: string | null
  resourceType: string
  meta: any
  createdAt: Date
  idea: {
    id: string
    title: string
    slug: string
    content: string
    takeaway: string
    source: { title: string; type: string; url: string | null }
    ideaTopics: { topic: { id: string; name: string; slug: string; icon: string; color: string } }[]
  } | null
  saviezFact: SaviezVousFact | null
  wikiImage: CachedWikipediaImage | null
  wikiMediaImage: CachedWikiLovesImage | null
  wikiLovesImage: CachedWikiLovesImage | null
  user: { id: string; displayName: string | null; email: string }
}

interface SharedBookmarksProps {
  sharedBookmarks: SharedBookmark[]
  currentUserId: string | null
  isAdmin?: boolean
  typeFilters?: { value: string; label: string }[]
  activeType?: string
  searchQuery?: string
  onTypeChange?: (value: string) => void
  onSearchChange?: (value: string) => void
}

function IdeaBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
}: {
  bookmark: SharedBookmark & { idea: NonNullable<SharedBookmark['idea']> }
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const topics = bookmark.idea.ideaTopics.map((t: { topic: { id: string; name: string; slug: string; icon: string; color: string } }) => t.topic)
  const idea = {
    id: bookmark.idea.id,
    title: bookmark.idea.title,
    slug: bookmark.idea.slug,
    source: { title: bookmark.idea.source.title, type: bookmark.idea.source.type, url: bookmark.idea.source.url },
    topics,
    viewedAt: new Date().toISOString(),
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CompactIdeaCard idea={idea} />
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => bookmark.idea && unshareFromLobby(bookmark.idea.id).then(r => r.success && window.location.reload())}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}

function SaviezVousBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
}: {
  bookmark: SharedBookmark & { saviezFact: NonNullable<SharedBookmark['saviezFact']> }
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SaviezVousCard
        id={bookmark.saviezFact.id}
        text={bookmark.saviezFact.text}
        sourceUrl={bookmark.saviezFact.sourceUrl}
        imageFilename={bookmark.saviezFact.imageFilename}
        showLink={false}
        showToggle={false}
        showBookmark={false}
        showRefresh={false}
        showShare={false}
        imageHeight="h-40"
        swipeable={false}
      />
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => bookmark.resourceId && unshareResourceFromLobby('SAVIEZ_VOUS', bookmark.resourceId).then(r => r.success && window.location.reload())}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}

function WikiImageBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
}: {
  bookmark: SharedBookmark & { wikiImage: NonNullable<SharedBookmark['wikiImage']> }
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 dark:border-teal-700 dark:from-teal-950/30 dark:to-emerald-950/30">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4 text-teal-600" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">Image du jour</h4>
        </div>
        {isValidUrl(bookmark.wikiImage.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-teal-200 dark:border-teal-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={sanitizeUrl(bookmark.wikiImage.imageUrl, '')}
              alt={bookmark.wikiImage.description}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="teal" />
          </div>
        )}
        <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100 mb-2">
          {bookmark.wikiImage.description}
        </p>
        {isValidUrl(bookmark.wikiImage.fileUrl) && (
          <Link
            href={sanitizeUrl(bookmark.wikiImage.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => r.success && window.location.reload())}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
      </div>
      {showFullImage && (
        <ImageLightbox
          src={bookmark.wikiImage.imageUrl}
          alt={bookmark.wikiImage.description}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </div>
  )
}

function WikiLovesBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
}: {
  bookmark: SharedBookmark & { wikiLovesImage: NonNullable<SharedBookmark['wikiLovesImage']> }
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl border-2 border-indigo-800 bg-gradient-to-br from-indigo-50 to-emerald-50 p-4 dark:border-indigo-900 dark:from-indigo-950/30 dark:to-emerald-950/30">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-white" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">Wiki Loves</h4>
        </div>
        {isValidUrl(bookmark.wikiLovesImage.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-indigo-200 dark:border-indigo-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={sanitizeUrl(bookmark.wikiLovesImage.imageUrl, '')}
              alt={bookmark.wikiLovesImage.title}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="cyan" />
          </div>
        )}
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
          {bookmark.wikiLovesImage.title}
        </p>
        {bookmark.wikiLovesImage.author && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
            {bookmark.wikiLovesImage.author}
          </p>
        )}
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
          {bookmark.wikiLovesImage.license || 'Wikimedia Commons'} · {bookmark.wikiLovesImage.year}
        </p>
        {bookmark.wikiLovesImage.commonsUrl && (
          <Link
            href={sanitizeUrl(bookmark.wikiLovesImage.commonsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => r.success && window.location.reload())}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
      </div>
      {showFullImage && (
        <ImageLightbox
          src={bookmark.wikiLovesImage.imageUrl}
          alt={bookmark.wikiLovesImage.title}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </div>
  )
}

function WikiMediaBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
}: {
  bookmark: SharedBookmark & { wikiMediaImage: NonNullable<SharedBookmark['wikiMediaImage']> }
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl border-2 border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 p-4 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-white" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-rose-800 dark:text-rose-300">Wikimedia</h4>
        </div>
        {isValidUrl(bookmark.wikiMediaImage.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-rose-200 dark:border-rose-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={sanitizeUrl(bookmark.wikiMediaImage.imageUrl, '')}
              alt={bookmark.wikiMediaImage.title}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="rose" />
          </div>
        )}
        <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
          {bookmark.wikiMediaImage.title}
        </p>
        {bookmark.wikiMediaImage.author && (
          <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
            {bookmark.wikiMediaImage.author}
          </p>
        )}
        <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">
          {bookmark.wikiMediaImage.license || 'Wikimedia Commons'} · {bookmark.wikiMediaImage.year}
        </p>
        {bookmark.wikiMediaImage.commonsUrl && (
          <Link
            href={sanitizeUrl(bookmark.wikiMediaImage.commonsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 hover:underline"
          >
            Voir sur Wikimedia Commons
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => r.success && window.location.reload())}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Partagé le {bookmark.createdAt.toLocaleDateString('fr-FR')}
      </div>
      {showFullImage && (
        <ImageLightbox
          src={bookmark.wikiMediaImage.imageUrl}
          alt={bookmark.wikiMediaImage.title}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </div>
  )
}

export function SharedBookmarks({
  sharedBookmarks,
  currentUserId,
  isAdmin = false,
  typeFilters = [],
  activeType = '',
  searchQuery = '',
  onTypeChange,
  onSearchChange,
}: SharedBookmarksProps) {
  const items = sharedBookmarks.filter(b => b.idea || b.saviezFact || b.wikiImage || b.wikiMediaImage || b.wikiLovesImage)

  const hasFilters = typeFilters.length > 0 || searchQuery

  return (
    <div className="space-y-4">
      {hasFilters && (
        <div className="space-y-3">
          {typeFilters.length > 0 && onTypeChange && (
            <div className="flex flex-wrap gap-2">
              {typeFilters.map(filter => (
                <Badge
                  key={filter.value || 'all'}
                  variant={activeType === filter.value ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => onTypeChange(filter.value)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          )}
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher dans les favoris partagés..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
          <p className="text-muted-foreground">Aucun favori partagé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((bookmark) => {
            if (bookmark.idea) {
              return <IdeaBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { idea: NonNullable<SharedBookmark['idea']> }} currentUserId={currentUserId} isAdmin={isAdmin} />
            }
            if (bookmark.saviezFact) {
              return <SaviezVousBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { saviezFact: NonNullable<SharedBookmark['saviezFact']> }} currentUserId={currentUserId} isAdmin={isAdmin} />
            }
            if (bookmark.wikiImage) {
              return <WikiImageBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiImage: NonNullable<SharedBookmark['wikiImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} />
            }
            if (bookmark.wikiMediaImage) {
              return <WikiMediaBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiMediaImage: NonNullable<SharedBookmark['wikiMediaImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} />
            }
            if (bookmark.wikiLovesImage) {
              return <WikiLovesBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiLovesImage: NonNullable<SharedBookmark['wikiLovesImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
