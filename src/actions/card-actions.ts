'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type CardKey = 'saviezVous' | 'wikipedia' | 'cnrs' | 'radioFrance' | 'wikimedia' | 'wikiloves' | 'pixabay' | 'portailLexical' | 'proverbe'

const DEFAULT_VISIBILITY: Record<CardKey, boolean> = {
  saviezVous: true,
  wikipedia: true,
  cnrs: true,
  radioFrance: true,
  wikimedia: true,
  wikiloves: true,
  pixabay: true,
  portailLexical: true,
  proverbe: true,
}

const CONFIG_KEY = 'cartes_global_visibility'

export async function getGlobalCardVisibility(): Promise<Record<CardKey, boolean>> {
  const config = await prisma.cachedConfig.findUnique({ where: { key: CONFIG_KEY } })
  if (!config) return { ...DEFAULT_VISIBILITY }
  try {
    const parsed = JSON.parse(config.value) as Record<string, boolean>
    const result: Partial<Record<CardKey, boolean>> = {}
    for (const key of Object.keys(DEFAULT_VISIBILITY)) {
      const k = key as CardKey
      result[k] = typeof parsed[k] === 'boolean' ? parsed[k] : DEFAULT_VISIBILITY[k]
    }
    return result as Record<CardKey, boolean>
  } catch {
    return { ...DEFAULT_VISIBILITY }
  }
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

  return { success: true }
}
