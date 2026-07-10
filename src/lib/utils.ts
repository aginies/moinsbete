import crypto from 'node:crypto'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s()-]/g, '')
    .replace(/\s*\(\s*([^)]+)\s*\)/g, ' $1')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function generateSlug(title: string): string {
  const slug = slugify(title)
  const timestamp = Date.now().toString().slice(-6)
  return `${slug}-${timestamp}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export const TOPIC_ICONS = [
  '🧠', '📚', '💡', '🎯', '🔬', '💰', '🏛️', '🗣️',
  '🧘', '🌱', '⚡', '📜', '🤝', '🎨', '🏃',
  '👑', '🔑', '🌟', '📈', '🤖', '🌍', '💎', '🔥',
]

export const TOPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#2563eb', '#7c3aed', '#c026d3', '#db2777',
]

export function getRandomIcon(): string {
  return TOPIC_ICONS[Math.floor(Math.random() * TOPIC_ICONS.length)]
}

export function getRandomColor(): string {
  return TOPIC_COLORS[Math.floor(Math.random() * TOPIC_COLORS.length)]
}

const MAX_URL_LENGTH = 2048

export function isValidUrl(url: string | null | undefined): boolean {
  if (typeof url !== 'string' || !url) return false
  const trimmed = url.trim()
  if (trimmed.length > MAX_URL_LENGTH) return false
  
  const lower = trimmed.toLowerCase()
  // Check valid protocol
  if (!lower.startsWith('http://') && !lower.startsWith('https://') && !lower.startsWith('mailto:')) {
    return false
  }
  
  // Reject dangerous protocols
  if (lower.startsWith('javascript:')) return false
  if (lower.startsWith('data:')) return false
  if (lower.startsWith('vbscript:')) return false
  if (lower.startsWith('file:')) return false
  
  // Reject newlines
  if (trimmed.includes('\n') || trimmed.includes('\r')) return false
  
  // Validate URL structure for http/https
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      new URL(trimmed)
      return true
    } catch {
      return false
    }
  }
  
  return true
}

export function sanitizeUrl(url: string | null | undefined, fallback: string = '/'): string {
  if (url && isValidUrl(url)) {
    return url.trim()
  }
  return fallback
}

export async function resolveWikimediaImageUrls(facts: Array<{ id: string; imageFilename: string | null }>) {
  const pending = facts
    .filter(f => f.imageFilename && !f.imageFilename.startsWith('http'))

  if (pending.length === 0) return facts

  const titles = pending.map(f => `File:${f.imageFilename}`).join('|')
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
      { headers: { 'User-Agent': 'moinsbete/1.0' } }
    )
    const data = await res.json()
    const pages = data?.query?.pages || {}

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      const url = page?.imageinfo?.[0]?.url
      if (url) {
        const fact = pending.find(f => f.imageFilename === page.title.replace(/^File:/, ''))
        if (fact) {
          fact.imageFilename = url
        }
      }
    }
  } catch {
    // If API fails, keep original filenames
  }

  // Fallback: construct direct Wikimedia URL for facts still not resolved
  for (const fact of facts) {
    if (!fact.imageFilename || fact.imageFilename.startsWith('http')) continue
    fact.imageFilename = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fact.imageFilename)}?width=1200`
  }

  return facts
}

export async function resolveWikimediaImageUrlsViaREST(filenames: string[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>()
  if (filenames.length === 0) return urlMap

  try {
    const titles = filenames.join('|')
    const res = await fetch(
      `https://commons.wikimedia.org/w/rest.php/wikibase/v0/offloadable_urls?titles=${encodeURIComponent(titles)}`,
      { headers: { 'User-Agent': 'moinsbete/1.0' } }
    )
    if (!res.ok) return urlMap
    const data = await res.json()
    if (data?.pages) {
      for (const page of data.pages) {
        const filename = page?.title?.replace(/^File:/, '')
        const url = page?.mainEntity?.url || page?.url
        if (filename && url) {
          urlMap.set(filename, url)
        }
      }
    }
  } catch {
    // Fall through to MD5 fallback
  }

  return urlMap
}

export function generateImageId(fileUrl: string, date: string): string {
  return crypto.createHash('sha256')
    .update(fileUrl + date)
    .digest('hex')
    .slice(0, 8)
}
