'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { scrapeAndCacheCnrs } from '@/scripts/cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from '@/scripts/cache-radio-france'
import { scrapeAndCacheNews } from '@/scripts/cache-news'
import { scrapeAndCacheWikipediaImages } from '@/scripts/cache-wikipedia-image'
import { scrapeAndCacheSaviezVousImages } from '@/scripts/cache-saviez-vous-images'
import { scrapeAndCacheWikiLoves } from '@/scripts/scrape-wikiloves'
import { cleanupExpired } from '@/lib/cache-helpers'

export interface RefreshResult {
  success: boolean
  message: string
  count?: number
}

async function authCheck(): Promise<RefreshResult | null> {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, message: 'Non autorisé' }
  }
  return null
}

async function executeRefresh(name: string, fn: () => Promise<void>): Promise<RefreshResult> {
  const authErr = await authCheck()
  if (authErr) return authErr

  try {
    await fn()
    const counts = await cleanupExpired()
    const total = counts.cnrs + counts.radio + counts.wiki + counts.wikiLoves + counts.news
    return { success: true, message: `${name} mis à jour. ${total} éléments expirés nettoyés.` }
  } catch (error) {
    return { success: false, message: `${name}: ${error instanceof Error ? error.message : String(error)}` }
  }
}

export async function refreshCnrs(): Promise<RefreshResult> {
  return executeRefresh('CNRS', scrapeAndCacheCnrs)
}

export async function refreshRadio(): Promise<RefreshResult> {
  return executeRefresh('Radio France', scrapeAndCacheRadioEpisodes)
}

export async function refreshNews(): Promise<RefreshResult> {
  return executeRefresh('News', scrapeAndCacheNews)
}

export async function refreshWikiImage(): Promise<RefreshResult> {
  return executeRefresh('Image Wikipédia', scrapeAndCacheWikipediaImages)
}

export async function refreshWikiLoves(): Promise<RefreshResult> {
  return executeRefresh('Wiki Loves', scrapeAndCacheWikiLoves)
}

export async function refreshSaviezVous(): Promise<RefreshResult> {
  return executeRefresh('Saviez-vous', scrapeAndCacheSaviezVousImages)
}

export async function refreshAll(): Promise<RefreshResult> {
  const authErr = await authCheck()
  if (authErr) return authErr

  const startTime = Date.now()
  const results: Array<{ name: string; ok: boolean }> = []

  try {
    await scrapeAndCacheCnrs()
    results.push({ name: 'CNRS', ok: true })

    await scrapeAndCacheRadioEpisodes()
    results.push({ name: 'Radio France', ok: true })

    await scrapeAndCacheNews()
    results.push({ name: 'News', ok: true })

    await scrapeAndCacheWikipediaImages()
    results.push({ name: 'Image Wikipédia', ok: true })

    await cleanupExpired()

    await scrapeAndCacheSaviezVousImages()
    results.push({ name: 'Saviez-vous', ok: true })

    const duration = ((Date.now() - startTime) / 1000).toFixed(0)
    const allOk = results.every(r => r.ok)
    return {
      success: allOk,
      message: `Tout actualisé en ${duration}s. ${results.filter(r => r.ok).length}/${results.length} sources.`,
    }
  } catch (error) {
    return { success: false, message: `Refresh partiel: ${error instanceof Error ? error.message : String(error)}` }
  }
}
