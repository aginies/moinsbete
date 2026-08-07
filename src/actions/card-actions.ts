'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type CardKey = 'saviezVous' | 'wikipedia' | 'cnrs' | 'radioFrance' | 'news' | 'wikimedia' | 'wikiloves' | 'pixabay' | 'portailLexical' | 'portailWikipedia' | 'proverbe' | 'f1' | 'citation' | 'insolite'

const DEFAULT_VISIBILITY: Record<CardKey, boolean> = {
  saviezVous: true,
  wikipedia: true,
  cnrs: true,
  radioFrance: true,
  news: true,
  wikimedia: true,
  wikiloves: true,
  pixabay: true,
  portailLexical: true,
  portailWikipedia: true,
  proverbe: true,
  f1: true,
  citation: true,
  insolite: true,
}

const CONFIG_KEY = 'cartes_global_visibility'

// Module-level cache for visibility config to avoid repeated DB query + JSON.parse
let visibilityCache: { data: Record<CardKey, boolean>; expiresAt: number } | null = null
const VISIBILITY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function parseVisibility(config: { value: string }): Record<CardKey, boolean> | null {
  try {
    const parsed = JSON.parse(config.value) as Record<string, boolean>
    const result: Partial<Record<CardKey, boolean>> = {}
    for (const key of Object.keys(DEFAULT_VISIBILITY)) {
      const k = key as CardKey
      result[k] = typeof parsed[k] === 'boolean' ? parsed[k] : DEFAULT_VISIBILITY[k]
    }
    return result as Record<CardKey, boolean>
  } catch {
    return null
  }
}

export async function getGlobalCardVisibility(): Promise<Record<CardKey, boolean>> {
  const now = Date.now()
  if (visibilityCache && visibilityCache.expiresAt > now) {
    return visibilityCache.data
  }

  const config = await prisma.cachedConfig.findUnique({ where: { key: CONFIG_KEY } })
  let result: Record<CardKey, boolean>
  if (!config) {
    result = { ...DEFAULT_VISIBILITY }
  } else {
    const parsed = parseVisibility(config)
    result = parsed ?? { ...DEFAULT_VISIBILITY }
  }

  visibilityCache = { data: result, expiresAt: now + VISIBILITY_CACHE_TTL }
  return result
}

export async function updateGlobalCardVisibility(field: CardKey, enabled: boolean) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  const config = await prisma.cachedConfig.findUnique({ where: { key: CONFIG_KEY } })
  let visibility: Record<string, boolean> = { ...DEFAULT_VISIBILITY }
  if (config) {
    try {
      visibility = JSON.parse(config.value) as Record<string, boolean>
    } catch {
      visibility = { ...DEFAULT_VISIBILITY }
    }
  }
  visibility[field] = enabled

  await prisma.cachedConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(visibility) },
    update: { value: JSON.stringify(visibility) },
  })

  // Invalidate cache so next read fetches fresh data
  visibilityCache = null

  return { success: true }
}
