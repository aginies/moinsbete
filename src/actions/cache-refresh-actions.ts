'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { scrapeAndCacheCnrs } from '@/scripts/cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from '@/scripts/cache-radio-france'
import { scrapeAndCacheNews } from '@/scripts/cache-news'
import { scrapeAndCacheWikipediaImages, scrapeAndCacheWikipediaImagesEN } from '@/scripts/cache-wikipedia-image'
import { scrapeAndCacheSaviezVousImages } from '@/scripts/cache-saviez-vous-images'
import { scrapeAndCacheWikiLoves } from '@/scripts/scrape-wikiloves'
import { scrapeAndCacheF1 } from '@/scripts/cache-f1'
import { scrapeAndCacheCitation } from '@/scripts/cache-citation'
import { scrapeAndCachePortailLexicalWotd } from '@/scripts/cache-portail-lexical'
import { scrapeAndCachePortailWikipedia } from '@/scripts/cache-portail-wikipedia'
import { scrapeAndCacheInsolite } from '@/scripts/cache-insolite'
import { scrapeAndCacheApod } from '@/scripts/cache-apod'
import { cleanupExpired, cleanupNewsByMaxAge } from '@/lib/cache-helpers'
import { cleanupOldInsoliteConfigs } from '@/lib/insolite'

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

async function executeRefresh(name: string, fn: () => Promise<unknown>): Promise<RefreshResult> {
  const authErr = await authCheck()
  if (authErr) return authErr

  try {
    await fn()
    const counts = await cleanupExpired()
    const total = counts.cnrs + counts.radio + counts.wiki + counts.wikiLoves + counts.news + counts.f1 + counts.portailWikipedia
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

export async function refreshPortailWikipedia(): Promise<RefreshResult> {
  return executeRefresh('Portail Wikipédia', scrapeAndCachePortailWikipedia)
}

export async function refreshInsolite(): Promise<RefreshResult> {
  return executeRefresh('Articles insolites', scrapeAndCacheInsolite)
}

export async function refreshApod(): Promise<RefreshResult> {
  return executeRefresh('APOD', scrapeAndCacheApod)
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

    await scrapeAndCacheWikipediaImagesEN()
    results.push({ name: 'Image Wikipédia EN', ok: true })

    await scrapeAndCacheF1()
    results.push({ name: 'F1', ok: true })

    await scrapeAndCacheCitation()
    results.push({ name: 'Citation', ok: true })

    await scrapeAndCachePortailWikipedia()
    results.push({ name: 'Portail Wikipédia', ok: true })

    await scrapeAndCacheInsolite()
    results.push({ name: 'Articles insolites', ok: true })

    await scrapeAndCacheApod()
    results.push({ name: 'APOD', ok: true })

    const counts = await cleanupExpired()
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    await cleanupNewsByMaxAge(5)
    await cleanupOldInsoliteConfigs(30)
    results.push({ name: `Cleanup (${total} expirés)`, ok: true })

    await scrapeAndCacheSaviezVousImages()
    results.push({ name: 'Saviez-vous', ok: true })

    await scrapeAndCachePortailLexicalWotd()
    results.push({ name: 'Portail Lexical', ok: true })

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
