'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CompactIdeaCard } from '@/components/feed/idea-card'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { User, Trash2, Camera, BookOpen, ExternalLink, Search, X, Bookmark, Loader2, Quote, Lightbulb, Info, Image as ImageIcon, Earth, List, Newspaper, Languages, Sparkles, Telescope, Plane } from 'lucide-react'
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
  Sparkles: Sparkles,
  Telescope: Telescope,
  Plane: Plane,
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

interface PortailWikipediaArticle {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
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
  newsArticle: { id: string; title: string; description: string; imageUrl: string | null; source: string; category: string; url: string } | null
  portailWikipediaArticle: PortailWikipediaArticle | null
  proverbe?: {
    id: string
    text: string
    signification: string
    source: string
    wiktionnaireUrl?: string
    etymologie?: string
    definitions?: string[]
  } | null
  citation?: {
    id: string
    text: string
    author: string
    source: string | null
    category: string
    wikiUrl: string
    imageUrl: string | null
  } | null
  insoliteArticle?: {
    id: string
    title: string
    description: string
    url: string
    imageUrl: string | null
  } | null
  airCrashArticle?: {
    id: string
    title: string
    description: string
    url: string
    imageUrl: string | null
  } | null
  apodImage?: {
    id: string
    date: string
    title: string
    explanation: string
    imageUrl: string
    hdImageUrl: string | null
    copyright: string | null
    apodUrl: string
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
    NEWS: Set<string>
    PORTAIL_WIKIPEDIA: Set<string>
    CITATION: Set<string>
    INSOLITE: Set<string>
    APOD: Set<string>
    AIR_CRASH: Set<string>
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
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              if (bookmark.resourceType === 'IDEA' && bookmark.resourceId) {
                unshareResourceFromLobby('IDEA', bookmark.resourceId).then(r => {
                  if (r?.error) toast.error(r.error)
                  else router.refresh()
                }).catch(handleUnshareError)
              } else if (bookmark.ideaId) {
                unshareFromLobby(bookmark.ideaId).then(r => {
                  if (r?.error) toast.error(r.error)
                  else router.refresh()
                }).catch(handleUnshareError)
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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
  bookmark: SharedBookmark & { saviezFact: NonNullable<SharedBookmark['saviezFact']>; sharedToCommunity?: boolean; sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
        {bookmark.sharedToCommunity && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {t('shared_to_community')}
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby('SAVIEZ_VOUS', bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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

function NewsBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { newsArticle: NonNullable<SharedBookmark['newsArticle']>; sharedToCommunity?: boolean; sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.NEWS.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('NEWS', bookmark.resourceId, {
        title: bookmark.newsArticle.title,
        description: bookmark.newsArticle.description,
        imageUrl: bookmark.newsArticle.imageUrl,
        source: bookmark.newsArticle.source,
        category: bookmark.newsArticle.category,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
            <Newspaper className="h-3 w-3 text-white" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">NEWS</h4>
          {bookmark.newsArticle.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {bookmark.newsArticle.category}
            </span>
          )}
        </div>
        {bookmark.newsArticle.imageUrl && isValidUrl(bookmark.newsArticle.imageUrl) && (
          <div className="mb-2 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
            <img
              src={sanitizeUrl(bookmark.newsArticle.imageUrl, '')}
              alt={bookmark.newsArticle.title}
              loading="lazy"
              className="w-full h-32 object-cover hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
          {bookmark.newsArticle.title}
        </p>
        {bookmark.newsArticle.description && (
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 line-clamp-2">
            {bookmark.newsArticle.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mb-2">
          <span>{bookmark.newsArticle.source}</span>
          <span>·</span>
          <Link
            href={sanitizeUrl(bookmark.newsArticle.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Lire l'article
            <ExternalLink className="h-3 w-3 ml-1 inline" />
          </Link>
        </div>
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
        {bookmark.sharedToCommunity && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {t('shared_to_community')}
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
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
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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

function ApodBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { apodImage: NonNullable<SharedBookmark['apodImage']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.APOD.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('APOD', bookmark.resourceId, {
        titre: bookmark.apodImage.title,
        auteur: bookmark.apodImage.copyright || '',
        imageUrl: bookmark.apodImage.imageUrl,
        link: bookmark.apodImage.apodUrl,
        droits: 'NASA / APOD',
        description: bookmark.apodImage.explanation,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-indigo-900 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="mb-2 flex items-center gap-2">
          <Telescope className="h-4 w-4 text-white" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">APOD</h4>
        </div>
        {isValidUrl(bookmark.apodImage.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-indigo-200 dark:border-indigo-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={sanitizeUrl(bookmark.apodImage.imageUrl, '')}
              alt={bookmark.apodImage.title}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <ImageHint color="purple" />
          </div>
        )}
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
          {bookmark.apodImage.title}
        </p>
        {bookmark.apodImage.copyright && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
            {bookmark.apodImage.copyright}
          </p>
        )}
        {bookmark.apodImage.explanation && (
          <p className="text-xs text-indigo-800 dark:text-indigo-200 mb-2 line-clamp-3">
            {bookmark.apodImage.explanation}
          </p>
        )}
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
          NASA / APOD · {bookmark.apodImage.date}
        </p>
        {bookmark.apodImage.apodUrl && (
          <Link
            href={sanitizeUrl(bookmark.apodImage.apodUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
          >
            Voir sur APOD
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
      {showFullImage && (
        <ImageLightbox
          src={bookmark.apodImage.imageUrl}
          alt={bookmark.apodImage.title}
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
  const router = useRouter()
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
        router.refresh()
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
    <div className="group relative">
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby('PROVERBE', bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
    </div>
  )
}

function PortailWikipediaBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { portailWikipediaArticle: NonNullable<SharedBookmark['portailWikipediaArticle']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.PORTAIL_WIKIPEDIA.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('PORTAIL_WIKIPEDIA', bookmark.resourceId, {
        title: bookmark.portailWikipediaArticle.title,
        extract: bookmark.portailWikipediaArticle.extract,
        imageUrl: bookmark.portailWikipediaArticle.imageUrl,
        pageUrl: bookmark.portailWikipediaArticle.pageUrl,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-700 dark:from-indigo-950/30 dark:to-violet-950/30">
        <div className="mb-2 flex items-center gap-2">
          <Languages className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">Portail Wikipédia</h4>
        </div>
        {bookmark.portailWikipediaArticle.imageUrl && isValidUrl(bookmark.portailWikipediaArticle.imageUrl) && (
          <div
            className="mb-2 cursor-pointer overflow-hidden rounded-lg border border-indigo-200 dark:border-indigo-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={sanitizeUrl(bookmark.portailWikipediaArticle.imageUrl, '')}
              alt={bookmark.portailWikipediaArticle.title}
              loading="lazy"
              className="w-full h-32 object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
          {bookmark.portailWikipediaArticle.title}
        </p>
        {bookmark.portailWikipediaArticle.extract && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2 line-clamp-3">
            {bookmark.portailWikipediaArticle.extract}
          </p>
        )}
        <Link
          href={sanitizeUrl(bookmark.portailWikipediaArticle.pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline"
        >
          Lire l'article
          <ExternalLink className="h-3 w-3" />
        </Link>
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby('PORTAIL_WIKIPEDIA', bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
          </Button>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t('shared_on')} {bookmark.formattedCreatedAt}
      </div>
      {showFullImage && (
        <ImageLightbox
          src={bookmark.portailWikipediaArticle.imageUrl || ''}
          alt={bookmark.portailWikipediaArticle.title}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </div>
  )
}

function InsoliteBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { insoliteArticle: NonNullable<SharedBookmark['insoliteArticle']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.INSOLITE.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('INSOLITE', bookmark.resourceId, {
        title: bookmark.insoliteArticle.title,
        description: bookmark.insoliteArticle.description,
        url: bookmark.insoliteArticle.url,
        imageUrl: bookmark.insoliteArticle.imageUrl,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-4 dark:border-purple-700 dark:from-purple-950/20 dark:to-violet-950/20">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-purple-800 dark:text-purple-300">Insolite</h4>
        </div>
        <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
          {bookmark.insoliteArticle.title}
        </p>
        {bookmark.insoliteArticle.description && (
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 line-clamp-3">
            {bookmark.insoliteArticle.description}
          </p>
        )}
        {bookmark.insoliteArticle.url && (
          <Link
            href={sanitizeUrl(bookmark.insoliteArticle.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline"
          >
            Lire l'article
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
          <button
            type="button"
            onClick={handleAddToFavorites}
            disabled={isAdding}
            className="rounded-full p-1.5 text-purple-600 opacity-60 hover:opacity-100 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40 transition-all"
            title="Ajouter aux favoris"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && bookmark.resourceId && (
          <button
            type="button"
            onClick={() => {
              unshareResourceFromLobby('INSOLITE', bookmark.resourceId!).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
            className="rounded-full p-1.5 text-red-500 opacity-60 hover:opacity-100 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 transition-all"
            title="Retirer du lobby"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function AirCrashBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { airCrashArticle: NonNullable<SharedBookmark['airCrashArticle']> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.AIR_CRASH.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('AIR_CRASH', bookmark.resourceId, {
        title: bookmark.airCrashArticle.title,
        description: bookmark.airCrashArticle.description,
        url: bookmark.airCrashArticle.url,
        imageUrl: bookmark.airCrashArticle.imageUrl,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-sky-50 p-4 dark:border-blue-700 dark:from-blue-950/20 dark:to-sky-950/20">
        <div className="mb-2 flex items-center gap-2">
          <Plane className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">Air Crash Investigation</h4>
        </div>
        <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
          {bookmark.airCrashArticle.title}
        </p>
        {bookmark.airCrashArticle.description && (
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 line-clamp-3">
            {bookmark.airCrashArticle.description}
          </p>
        )}
        {bookmark.airCrashArticle.url && (
          <Link
            href={sanitizeUrl(bookmark.airCrashArticle.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
          >
            Lire l'article
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
          <button
            type="button"
            onClick={handleAddToFavorites}
            disabled={isAdding}
            className="rounded-full p-1.5 text-blue-600 opacity-60 hover:opacity-100 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-all"
            title="Ajouter aux favoris"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        )}
        {(currentUserId === bookmark.user.id || isAdmin) && bookmark.resourceId && (
          <button
            type="button"
            onClick={() => {
              unshareResourceFromLobby('AIR_CRASH', bookmark.resourceId!).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
            className="rounded-full p-1.5 text-red-500 opacity-60 hover:opacity-100 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 transition-all"
            title="Retirer du lobby"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function CitationBookmarkItem({
  bookmark,
  currentUserId,
  isAdmin,
  userFavoriteIds,
  locale,
  t,
}: {
  bookmark: SharedBookmark & { citation: NonNullable<SharedBookmark['citation']>; sharedToCommunity?: boolean; sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }> }
  currentUserId: string | null
  isAdmin: boolean
  userFavoriteIds: SharedBookmarksProps['userFavoriteIds']
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const isFavorite = bookmark.resourceId ? userFavoriteIds.CITATION.has(bookmark.resourceId) : false
  const showBookmarkBtn = currentUserId !== bookmark.user.id && isAdmin === false && !isFavorite

  const handleAddToFavorites = async () => {
    if (isAdding || !bookmark.resourceId) return
    setIsAdding(true)
    try {
      const result = await addToFavoritesFromLobby('CITATION', bookmark.resourceId, {
        text: bookmark.citation.text,
        author: bookmark.citation.author,
        source: bookmark.citation.source,
        url: bookmark.citation.wikiUrl,
        category: bookmark.citation.category,
      })
      if (result.success) {
        router.refresh()
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
    <div className="group relative">
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 dark:border-amber-700 dark:from-amber-950/20 dark:to-yellow-950/20">
        <div className="mb-2 flex items-center gap-2">
          <Quote className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          <h4 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Citation</h4>
        </div>
        <p className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2 italic">
          &quot;{bookmark.citation.text}&quot;
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {bookmark.citation.author}
          </span>
          {bookmark.citation.source && (
            <span className="text-xs text-amber-500 dark:text-amber-400">
              - {bookmark.citation.source}
            </span>
          )}
        </div>
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {bookmark.citation.category}
          </span>
        </div>
        {bookmark.citation.wikiUrl && (
          <Link
            href={sanitizeUrl(bookmark.citation.wikiUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:underline"
          >
            Lire la citation
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
        {bookmark.sharedToCommunity && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 backdrop-blur-sm dark:bg-green-900/30 dark:text-green-400">
            <User className="h-3 w-3" />
            {t('shared_to_community')}
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
            className="h-7 w-7 p-0 transition-opacity opacity-100"
            onClick={() => {
              bookmark.resourceId && unshareResourceFromLobby(bookmark.resourceType, bookmark.resourceId).then(r => {
                if (r?.error) toast.error(r.error)
                else router.refresh()
              }).catch(handleUnshareError)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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
  const items = sharedBookmarks.filter(b => b.idea || b.saviezFact || b.wikiImage || b.wikiMediaImage || b.wikiLovesImage || b.newsArticle || b.portailWikipediaArticle || b.proverbe || b.citation || b.insoliteArticle || b.apodImage || b.airCrashArticle)

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
            if (bookmark.newsArticle) {
              return <NewsBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { newsArticle: NonNullable<SharedBookmark['newsArticle']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.portailWikipediaArticle) {
              return <PortailWikipediaBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { portailWikipediaArticle: NonNullable<SharedBookmark['portailWikipediaArticle']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.proverbe) {
              return <ProverbeBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { proverbe: NonNullable<SharedBookmark['proverbe']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.citation) {
              return <CitationBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { citation: NonNullable<SharedBookmark['citation']>; sharedToCommunity?: boolean; sharedWithUsers?: Array<{ id: string; displayName: string | null; email: string }> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.insoliteArticle) {
              return <InsoliteBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { insoliteArticle: NonNullable<SharedBookmark['insoliteArticle']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.apodImage) {
              return <ApodBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { apodImage: NonNullable<SharedBookmark['apodImage']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            if (bookmark.airCrashArticle) {
              return <AirCrashBookmarkItem key={bookmark.id} bookmark={bookmark as SharedBookmark & { airCrashArticle: NonNullable<SharedBookmark['airCrashArticle']> }} currentUserId={currentUserId} isAdmin={isAdmin} userFavoriteIds={userFavoriteIds} locale={locale} t={t} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
