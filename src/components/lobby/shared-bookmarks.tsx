'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { User, Trash2, Camera, BookOpen, ExternalLink, Search, X, Bookmark, Loader2, Quote, Lightbulb, Info, Image as ImageIcon, Earth, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { unshareFromLobby, unshareResourceFromLobby, addToFavoritesFromLobby } from '@/actions/lobby-share-actions'
import { sanitizeUrl, isValidUrl, maskEmail } from '@/lib/utils'
import { ImageLightbox } from '@/components/feed/image-lightbox'
import { ImageHint } from '@/components/feed/image-hint'
import { toast } from 'sonner'
import type { SharedLobbyBookmark } from '@/generated/client'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  List: List,
  Lightbulb: Lightbulb,
  Camera: Camera,
  Info: Info,
  Image: ImageIcon,
  Earth: Earth,
  Quote: Quote,
}

const handleUnshareResult = (r: { error?: string } | null | undefined) => {
  if (r?.error) {
    toast.error(r.error)
  } else {
    setTimeout(() => window.location.reload(), 100)
  }
}

const handleUnshareError = (err: Error & { code?: string }) => {
  toast.error(err?.message || 'Erreur lors de la suppression')
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
  meta: unknown
  createdAt: Date
  formattedCreatedAt: string
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
  proverbe?: {
    id: string
    text: string
    signification: string
    source: string
    wiktionnaireUrl?: string
    etymologie?: string
    definitions?: string[]
  } | null
  user: { id: string; displayName: string | null; email: string }
  sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }>
}

interface SharedBookmarksProps {
  sharedBookmarks: SharedBookmark[]
  currentUserId: string | null
  isAdmin?: boolean
  locale: string
  userFavoriteIds: {
    IDEA: Set<string>
    SAVIEZ_VOUS: Set<string>
    IMAGE_DU_JOUR: Set<string>
    IMAGE_WIKIMEDIA: Set<string>
    IMAGE_WIKILOVES: Set<string>
    PROVERBE: Set<string>
  }
  typeFilters?: { value: string; label: string; icon: string }[]
  activeType?: string
  searchQuery?: string
  onTypeChange?: (value: string) => void
  onSearchChange?: (value: string) => void
  emptyMessage?: string
}

function IdeaBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { idea: NonNullable<SharedBookmark['idea']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = userFavoriteIds.IDEA.has(bookmark.idea.id)
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite
  const topics = bookmark.idea.ideaTopics.map((t: { topic: { id: string; name: string; slug: string; icon: string; color: string } }) => t.topic)
  const idea = {
    id: bookmark.idea.id,
    title: bookmark.idea.title,
    slug: bookmark.idea.slug,
    source: { title: bookmark.idea.source.title, type: bookmark.idea.source.type, url: bookmark.idea.source.url },
    topics,
    viewedAt: '',
  }

  const handleAddToFavorites = async () => {
    if (isAdding) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('IDEA', bookmark.idea.id)
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
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
        {bookmark.sharedWithUsers && bookmark.sharedWithUsers.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {bookmark.sharedWithUsers.map(u => u.displayName || maskEmail(u.email)).join(', ')}
          </span>
        )}
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              if (bookmark.resourceType === 'IDEA' && bookmark.resourceId) {
                unshareResourceFromLobby('IDEA', bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
              } else if (bookmark.ideaId) {
                unshareFromLobby(bookmark.ideaId).then(handleUnshareResult).catch(handleUnshareError)
              }
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
    </div>
  )
}

function SaviezVousBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { saviezFact: NonNullable<SharedBookmark['saviezFact']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.SAVIEZ_VOUS.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('SAVIEZ_VOUS', bookmark.resourceId, {
        text: bookmark.saviezFact.text,
        sourceUrl: bookmark.saviezFact.sourceUrl,
        imageFilename: bookmark.saviezFact.imageFilename,
      })
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
  }

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
        {bookmark.sharedWithUsers && bookmark.sharedWithUsers.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {bookmark.sharedWithUsers.map(u => u.displayName || maskEmail(u.email)).join(', ')}
          </span>
        )}
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby('SAVIEZ_VOUS', bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
    </div>
  )
}

function WikiImageBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { wikiImage: NonNullable<SharedBookmark['wikiImage']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.IMAGE_DU_JOUR.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('IMAGE_DU_JOUR', bookmark.resourceId, {
        imageUrl: bookmark.wikiImage.imageUrl,
        description: bookmark.wikiImage.description,
        fileUrl: bookmark.wikiImage.fileUrl,
        date: bookmark.wikiImage.date,
      })
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
  }

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
        {bookmark.sharedWithUsers && bookmark.sharedWithUsers.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {bookmark.sharedWithUsers.map(u => u.displayName || maskEmail(u.email)).join(', ')}
          </span>
        )}
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
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
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { wikiLovesImage: NonNullable<SharedBookmark['wikiLovesImage']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.IMAGE_WIKILOVES.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('IMAGE_WIKILOVES', bookmark.resourceId, {
        titre: bookmark.wikiLovesImage.title,
        auteur: bookmark.wikiLovesImage.author,
        imageUrl: bookmark.wikiLovesImage.imageUrl,
        link: bookmark.wikiLovesImage.commonsUrl,
        droits: bookmark.wikiLovesImage.license,
      })
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
  }

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
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
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
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { wikiMediaImage: NonNullable<SharedBookmark['wikiMediaImage']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.IMAGE_WIKIMEDIA.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('IMAGE_WIKIMEDIA', bookmark.resourceId, {
        titre: bookmark.wikiMediaImage.title,
        auteur: bookmark.wikiMediaImage.author,
        imageUrl: bookmark.wikiMediaImage.imageUrl,
        link: bookmark.wikiMediaImage.commonsUrl,
        droits: bookmark.wikiMediaImage.license,
      })
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
  }

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
        {bookmark.sharedWithUsers && bookmark.sharedWithUsers.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {bookmark.sharedWithUsers.map(u => u.displayName || maskEmail(u.email)).join(', ')}
          </span>
        )}
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
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

function ProverbeBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { proverbe: NonNullable<SharedBookmark['proverbe']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const [hovered, setHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.PROVERBE.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('PROVERBE', bookmark.resourceId, {
        text: bookmark.proverbe.text,
        signification: bookmark.proverbe.signification,
        source: bookmark.proverbe.source,
        url: bookmark.proverbe.wiktionnaireUrl,
        etymologie: bookmark.proverbe.etymologie,
        definitions: bookmark.proverbe.definitions,
      })
      if (result.success) {
        window.location.reload()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout aux favoris')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-4 dark:border-emerald-700 dark:from-emerald-950/20 dark:to-green-950/20">
        <div className="mb-2 flex items-center gap-2">
          <Quote className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Proverbe</h4>
        </div>
        <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2 italic">
          &quot;{bookmark.proverbe.text}&quot;
        </p>
        {bookmark.proverbe.signification && (
          <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200 mb-2">
            {bookmark.proverbe.signification}
          </p>
        )}
        {bookmark.proverbe.etymologie && (
          <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-300 mb-2 italic">
            {bookmark.proverbe.etymologie}
          </p>
        )}
        {bookmark.proverbe.definitions && bookmark.proverbe.definitions.length > 0 && (
          <div className="mb-2 space-y-1">
            {bookmark.proverbe.definitions.map((def, i) => (
              <p key={i} className="text-sm text-emerald-700 dark:text-emerald-300">
                <span className="font-medium">{i + 1}.</span> {def}
              </p>
            ))}
          </div>
        )}
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {bookmark.proverbe.source}
          </span>
        </div>
        {bookmark.proverbe.wiktionnaireUrl && (
          <Link
            href={sanitizeUrl(bookmark.proverbe.wiktionnaireUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 hover:underline"
          >
            Voir sur Wiktionnaire
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <User className="h-3 w-3" />
          {bookmark.user.displayName || maskEmail(bookmark.user.email)}
        </span>
        {bookmark.sharedWithUsers && bookmark.sharedWithUsers.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {bookmark.sharedWithUsers.map(u => u.displayName || maskEmail(u.email)).join(', ')}
          </span>
        )}
        {showBookmarkBtn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAddToFavorites}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''} text-muted-foreground`} />
            )}
          </Button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby('PROVERBE', bookmark.resourceId).then(handleUnshareResult).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
    </div>
  )
}

export function SharedBookmarks({
  sharedBookmarks,
  currentUserId,
  isAdmin = false,
  locale,
  userFavoriteIds,
  typeFilters = [],
  activeType = '',
  searchQuery = '',
  onTypeChange,
  onSearchChange,
  emptyMessage,
}: SharedBookmarksProps) {
  const t = useTranslations('feed')
  const items = sharedBookmarks.filter(b => b.idea || b.saviezFact || b.wikiImage || b.wikiMediaImage || b.wikiLovesImage || b.proverbe)

  const hasFilters = typeFilters.length > 0 || searchQuery

  return (
    <div className="space-y-4">
      {hasFilters && (
        <div className="space-y-3">
          {typeFilters.length > 0 && onTypeChange && (
            <div className="flex flex-wrap gap-2">
              {typeFilters.map(filter => {
                const Icon = ICON_MAP[filter.icon]
                return (
                  <Badge
                    key={filter.value || 'all'}
                    variant={activeType === filter.value ? 'default' : 'outline'}
                    className="cursor-pointer select-none rounded-md flex items-center gap-1.5"
                    onClick={() => onTypeChange(filter.value)}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {filter.label}
                  </Badge>
                )
              })}
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
          <p className="text-muted-foreground">{emptyMessage || 'Aucun favori partagé'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((bookmark) => {
            if (bookmark.idea) {
              return <IdeaBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { idea: NonNullable<SharedBookmark['idea']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.saviezFact) {
              return <SaviezVousBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { saviezFact: NonNullable<SharedBookmark['saviezFact']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.wikiImage) {
              return <WikiImageBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiImage: NonNullable<SharedBookmark['wikiImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.wikiMediaImage) {
              return <WikiMediaBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiMediaImage: NonNullable<SharedBookmark['wikiMediaImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.wikiLovesImage) {
              return <WikiLovesBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { wikiLovesImage: NonNullable<SharedBookmark['wikiLovesImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.proverbe) {
              return <ProverbeBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { proverbe: NonNullable<SharedBookmark['proverbe']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
