import 'dotenv/config'
import { prisma } from '../lib/db'
import { Prisma } from '@/generated/client'
import { decodeHtmlEntities } from '../lib/utils'

const DRY_RUN = process.argv.includes('--dry-run')

interface TableConfig {
  model: string
  columns: string[]
  uniqueTextKey?: { authorCol: string; textCol: string }
}

interface ModelLike {
  findMany(args: unknown): Promise<Array<Record<string, unknown> & { id: string }>>
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>
  delete(args: { where: { id: string } }): Promise<unknown>
}

const TABLES: TableConfig[] = [
  { model: 'cachedInsoliteArticle', columns: ['title', 'description'] },
  { model: 'cachedCnrsArticle', columns: ['title'] },
  { model: 'cachedRadioEpisode', columns: ['title', 'description'] },
  { model: 'cachedNewsArticle', columns: ['title', 'description'] },
  { model: 'cachedF1Article', columns: ['title', 'description', 'content'] },
  { model: 'cachedCitationArticle', columns: ['text', 'source'], uniqueTextKey: { authorCol: 'author', textCol: 'text' } },
  { model: 'cachedWikipediaPortalArticle', columns: ['title', 'extract'] },
  { model: 'cachedWikipediaImage', columns: ['description'] },
  { model: 'cachedWikiLovesImage', columns: ['title', 'author'] },
  { model: 'cachedApodImage', columns: ['title', 'explanation'] },
  { model: 'saviezVousFact', columns: ['text'] },
]

function decodeJsonStrings(value: unknown): unknown {
  if (typeof value === 'string') return decodeHtmlEntities(value)
  if (Array.isArray(value)) return value.map(decodeJsonStrings)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = decodeJsonStrings(v)
    }
    return out
  }
  return value
}

async function cleanModel(model: ModelLike, columns: string[], uniqueTextKey?: TableConfig['uniqueTextKey']) {
  const rows = await model.findMany({
    where: { OR: columns.map(c => ({ [c]: { contains: '&' } })) },
  })

  let updated = 0
  let deleted = 0
  let skipped = 0

  for (const row of rows) {
    const data: Record<string, unknown> = {}
    for (const c of columns) {
      const v = row[c]
      if (typeof v === 'string' && v.includes('&')) {
        const decoded = decodeHtmlEntities(v)
        if (decoded !== v) data[c] = decoded
      }
    }

    if (Object.keys(data).length === 0) {
      skipped++
      continue
    }

    if (DRY_RUN) {
      updated++
      continue
    }

    try {
      await model.update({ where: { id: row.id }, data })
      updated++
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002' && uniqueTextKey) {
        // A newer row with the same decoded unique key already exists: drop the stale one
        await model.delete({ where: { id: row.id } })
        deleted++
      } else {
        throw e
      }
    }
  }

  return { found: rows.length, updated, deleted, skipped }
}

async function cleanBookmarks() {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; meta: string }>>(
    "SELECT id, meta FROM Bookmark WHERE meta LIKE '%&%'"
  )

  let updated = 0
  let skipped = 0

  for (const bm of rows) {
    let parsed: unknown
    try {
      parsed = JSON.parse(bm.meta)
    } catch {
      skipped++
      continue
    }
    const decoded = decodeJsonStrings(parsed)
    if (JSON.stringify(decoded) === JSON.stringify(parsed)) {
      skipped++
      continue
    }
    if (!DRY_RUN) {
      await prisma.bookmark.update({ where: { id: bm.id }, data: { meta: decoded as Prisma.InputJsonValue } })
    }
    updated++
  }

  return { found: rows.length, updated, deleted: 0, skipped }
}

async function main() {
  console.log(DRY_RUN ? '🧹 HTML entities cleanup (DRY RUN — aucune modification)' : '🧹 HTML entities cleanup...')

  let totalUpdated = 0
  let totalDeleted = 0

  for (const table of TABLES) {
    const model = (prisma as unknown as Record<string, ModelLike | undefined>)[table.model]
    if (!model) {
      console.log(`  ⚠️ ${table.model}: modèle introuvable, ignoré`)
      continue
    }
    const r = await cleanModel(model, table.columns, table.uniqueTextKey)
    totalUpdated += r.updated
    totalDeleted += r.deleted
    console.log(`  ${table.model}: ${r.found} lignes avec '&', ${r.updated} à corriger${r.deleted ? `, ${r.deleted} doublons supprimés` : ''}${r.skipped ? `, ${r.skipped} sans entités` : ''}`)
  }

  const bm = await cleanBookmarks()
  totalUpdated += bm.updated
  console.log(`  bookmark (meta): ${bm.found} lignes avec '&', ${bm.updated} à corriger${bm.skipped ? `, ${bm.skipped} sans entités` : ''}`)

  console.log(`\n${DRY_RUN ? '📋' : '✅'} Total: ${totalUpdated} lignes à corriger${totalDeleted ? `, ${totalDeleted} doublons à supprimer` : ''}`)
  if (DRY_RUN) {
    console.log('   Relancer sans --dry-run pour appliquer.')
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
