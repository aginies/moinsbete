import { decodeHtmlEntities } from './utils'

export interface WikipediaImageEntry {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
  archive: string
}

export function extractEntriesFR(html: string, archive: string): WikipediaImageEntry[] {
  const entries: WikipediaImageEntry[] = []
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  let h2Match: RegExpExecArray | null

  while ((h2Match = h2Regex.exec(html)) !== null) {
    // Parsoid markup wraps the ordinal in tags (e.g. <abbr>1<sup>er</sup></abbr>),
    // so strip tags before matching the date
    const h2Text = h2Match[1].replace(/<[^>]*>/g, '')
    const dateMatch = h2Text.match(/(\d{1,2}(?:er)?\s+[a-zàâæçéèêëîïôœùûüÿ]+(?:\s+[a-zàâæçéèêëîïôœùûüÿ]+)?\s+\d{4})/i)
    if (!dateMatch) continue

    const date = dateMatch[1].trim()
    const afterH2 = html.slice(h2Match.index + h2Match[0].length, h2Match.index + h2Match[0].length + 5000)

    const imgSrcMatch = afterH2.match(/src="(\/\/(?:upload|thumb)\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterH2.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterH2.match(/href="(?:https?:\/\/[^"\/]+)?\/wiki\/Fichier:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }
      imageUrl = imageUrl.split('?')[0]

      entries.push({
        imageUrl,
        description: decodeHtmlEntities(imgAltMatch[1].replace(/\s*\([^)]*définition réelle[^)]*\)/, '')).trim(),
        fileUrl: `https://fr.wikipedia.org/wiki/Fichier:${fileHrefMatch[1]}`,
        date,
        archive,
      })
    }

    if (entries.length >= 31) break
  }

  return entries
}

export function extractEntriesEN(html: string, archive: string): WikipediaImageEntry[] {
  const entries: WikipediaImageEntry[] = []

  const datePattern = /<span class="anchor nowrap" id="(\d+)"><b>(.+?)<\/b><\/span>/g
  let dateMatch: RegExpExecArray | null

  while ((dateMatch = datePattern.exec(html)) !== null) {
    const date = dateMatch[2].trim()
    const afterDate = html.slice(dateMatch.index + dateMatch[0].length, dateMatch.index + dateMatch[0].length + 5000)

    const imgSrcMatch = afterDate.match(/src="(\/\/(?:upload|thumb)\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterDate.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterDate.match(/href="(?:https?:\/\/[^"\/]+)?\/wiki\/File:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }
      imageUrl = imageUrl.split('?')[0]

      entries.push({
        imageUrl,
        description: decodeHtmlEntities(imgAltMatch[1]).trim(),
        fileUrl: `https://en.wikipedia.org/wiki/File:${fileHrefMatch[1]}`,
        date,
        archive,
      })
    }

    if (entries.length >= 31) break
  }

  return entries
}
