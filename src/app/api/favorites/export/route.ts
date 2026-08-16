import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apodPageUrl } from '@/lib/utils'
import { exportFavoritesToHtml, type ExportBookmarkItem } from '@/lib/favorites-export'
import { BookmarkType } from '@/generated/client'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifi\u00e9' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    const NON_IDEA_TYPES: BookmarkType[] = [
      'RADIO_FRANCE', 'CNRS_NEWS', 'IMAGE_DU_JOUR', 'SAVIEZ_VOUS',
      'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES', 'IMAGE_PIXABAY', 'PORTAIL_LEXICAL',
      'PORTAIL_WIKIPEDIA', 'PROVERBE', 'NEWS', 'F1', 'CITATION', 'INSOLITE', 'APOD',
    ]

    const [ideaBookmarks, otherBookmarks] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId, type: 'IDEA' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, resourceId: true, type: true, meta: true, createdAt: true, idea: { select: { id: true, title: true, slug: true, content: true, takeaway: true, source: { select: { title: true } } } } },
      }),
      prisma.bookmark.findMany({
        where: { userId, type: { in: NON_IDEA_TYPES } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, resourceId: true, type: true, meta: true, createdAt: true },
      }),
    ])

    const byType = new Map<BookmarkType, typeof otherBookmarks>()
    for (const bm of otherBookmarks) {
      const list = byType.get(bm.type)
      if (list) list.push(bm)
      else byType.set(bm.type, [bm])
    }
    const radioBookmarks = byType.get('RADIO_FRANCE') ?? []
    const cnrsBookmarks = byType.get('CNRS_NEWS') ?? []
    const imageDuJourBookmarks = byType.get('IMAGE_DU_JOUR') ?? []
    const saviezVousBookmarks = byType.get('SAVIEZ_VOUS') ?? []
    const wikimediaBookmarks = byType.get('IMAGE_WIKIMEDIA') ?? []
    const wikiLovesBookmarks = byType.get('IMAGE_WIKILOVES') ?? []
    const pixabayBookmarks = byType.get('IMAGE_PIXABAY') ?? []
    const portailLexicalBookmarks = byType.get('PORTAIL_LEXICAL') ?? []
    const portailWikipediaBookmarks = byType.get('PORTAIL_WIKIPEDIA') ?? []
    const proverbeBookmarks = byType.get('PROVERBE') ?? []
    const newsBookmarks = byType.get('NEWS') ?? []
    const f1Bookmarks = byType.get('F1') ?? []
    const citationBookmarks = byType.get('CITATION') ?? []
    const insoliteBookmarks = byType.get('INSOLITE') ?? []
    const apodBookmarks = byType.get('APOD') ?? []

    const items: ExportBookmarkItem[] = []

    // IDEA bookmarks
    for (const bm of ideaBookmarks) {
      if (!bm.idea) continue
      items.push({
        type: 'IDEA' as BookmarkType,
        title: bm.idea.title,
        description: bm.idea.takeaway || '',
        url: `https://moinsbete.guibo.com/idees/${bm.idea.slug}`,
        imageUrl: null,
        favoritedAt: bm.createdAt.toISOString(),
        meta: bm.meta as Record<string, unknown> | null,
      })
    }

    // Helper to convert bookmark meta to export item
    function metaToItem(
      bm: { resourceId: string | null; type: BookmarkType; meta: unknown; createdAt: Date },
      title: string,
      description: string,
      url: string,
      imageUrl: string | null,
    ): ExportBookmarkItem {
      return {
        type: bm.type,
        title,
        description,
        url,
        imageUrl,
        favoritedAt: bm.createdAt.toISOString(),
        meta: bm.meta as Record<string, unknown> | null,
      }
    }

    // RADIO_FRANCE
    for (const bm of radioBookmarks) {
      const m = bm.meta as { title?: string; description?: string; url?: string; image?: string; radio?: string; section?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Documentaire radio', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Documentaire radio', m.description || '', m.url || '', m.image || null))
    }

    // CNRS_NEWS
    for (const bm of cnrsBookmarks) {
      const m = bm.meta as { title?: string; description?: string; link?: string; imageUrl?: string; category?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Actualité CNRS', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Actualité CNRS', m.description || '', m.link || '', m.imageUrl || null))
    }

    // IMAGE_DU_JOUR
    for (const bm of imageDuJourBookmarks) {
      const m = bm.meta as { imageUrl?: string; description?: string; fileUrl?: string; date?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Image du jour', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.description || 'Image du jour', m.description || '', m.fileUrl || '', m.imageUrl || null))
    }

    // SAVIEZ_VOUS
    for (const bm of saviezVousBookmarks) {
      const m = bm.meta as { text?: string; sourceUrl?: string | null; imageFilename?: string | null } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Le saviez-vous ?', '', '', null))
        continue
      }
      const imageUrl = m.imageFilename ? `https://moinsbete.guibo.com/images/saviez-vous/${m.imageFilename}` : null
      items.push(metaToItem(bm, m.text || 'Le saviez-vous ?', '', m.sourceUrl || '', imageUrl))
    }

    // IMAGE_WIKIMEDIA
    for (const bm of wikimediaBookmarks) {
      const m = bm.meta as { titre?: string; imageUrl?: string; link?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Image Wikimedia', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.titre || 'Image Wikimedia', m.titre || '', m.link || '', m.imageUrl || null))
    }

    // IMAGE_WIKILOVES
    for (const bm of wikiLovesBookmarks) {
      const m = bm.meta as { titre?: string; imageUrl?: string; link?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Wiki Loves', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.titre || 'Wiki Loves', m.titre || '', m.link || '', m.imageUrl || null))
    }

    // IMAGE_PIXABAY
    for (const bm of pixabayBookmarks) {
      const m = bm.meta as { title?: string; thumbnailUrl?: string; pageURL?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Vidéo Pixabay', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Vidéo Pixabay', m.title || '', m.pageURL || '', m.thumbnailUrl || null))
    }

    // PORTAIL_LEXICAL
    for (const bm of portailLexicalBookmarks) {
      const m = bm.meta as { form?: string; description?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Portail Lexical', '', '', null))
        continue
      }
      items.push(metaToItem(bm, `${m.form || 'Mot'} — Portail Lexical`, m.description || '', `https://www.portail-lexical.fr/definition/${encodeURIComponent(m.form || '')}`, null))
    }

    // PORTAIL_WIKIPEDIA
    for (const bm of portailWikipediaBookmarks) {
      const m = bm.meta as { title?: string; extract?: string; pageUrl?: string; imageUrl?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Article Wikipédia', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Article Wikipédia', m.extract || '', m.pageUrl || '', m.imageUrl || null))
    }

    // PROVERBE
    for (const bm of proverbeBookmarks) {
      const m = bm.meta as { text?: string; source?: string; url?: string; wiktionnaireUrl?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Proverbe', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.text || 'Proverbe', m.source || '', m.wiktionnaireUrl || m.url || '', null))
    }

    // NEWS
    for (const bm of newsBookmarks) {
      const m = bm.meta as { title?: string; description?: string; url?: string; imageUrl?: string; source?: string; category?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Actualité', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Actualité', m.description || '', m.url || '', m.imageUrl || null))
    }

    // F1
    for (const bm of f1Bookmarks) {
      const m = bm.meta as { title?: string; description?: string; link?: string; imageUrl?: string; section?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Actualité F1', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Actualité F1', m.description || '', m.link || '', m.imageUrl || null))
    }

    // CITATION
    for (const bm of citationBookmarks) {
      const m = bm.meta as { text?: string; author?: string; url?: string; imageUrl?: string; source?: string; category?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Citation', '', '', null))
        continue
      }
      const desc = m.author ? `"${m.text}" — ${m.author}` : m.text || 'Citation'
      items.push(metaToItem(bm, m.text || 'Citation', desc, m.url || '', m.imageUrl || null))
    }

    // INSOLITE
    for (const bm of insoliteBookmarks) {
      const m = bm.meta as { title?: string; description?: string; url?: string | null; imageUrl?: string | null } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'Article insolite', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.title || 'Article insolite', m.description || '', m.url || '', m.imageUrl || null))
    }

    // APOD
    for (const bm of apodBookmarks) {
      const m = bm.meta as { titre?: string; imageUrl?: string; link?: string; description?: string } | null | undefined
      if (!m) {
        items.push(metaToItem(bm, 'APOD', '', '', null))
        continue
      }
      items.push(metaToItem(bm, m.titre || 'APOD', m.description || '', apodPageUrl(bm.resourceId ?? '') || m.link || '', m.imageUrl || null))
    }

    // Sort by favoritedAt descending
    items.sort((a, b) => new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime())

    const html = exportFavoritesToHtml(items, now)

    const filename = `moinsbete-favorites-${now.toISOString().slice(0, 10)}.html`
    const headers = new Headers()
    headers.set('Content-Type', 'text/html; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`)

    return new NextResponse(html, { headers })
  } catch (error) {
    console.error('Export favorites error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 })
  }
}
