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
    const h2Content = h2Match[1]
    const dateMatch = h2Content.match(/(\d{1,2}(?:er)?\s+[a-zàâæçéèêëîïôœùûüÿ]+(?:\s+[a-zàâæçéèêëîïôœùûüÿ]+)?\s+\d{4})/i)
    if (!dateMatch) continue

    const date = dateMatch[1].replace(/<[^>]*>/g, '').trim()
    const afterH2 = html.slice(h2Match.index + h2Match[0].length, h2Match.index + h2Match[0].length + 5000)

    const imgSrcMatch = afterH2.match(/src="(\/\/upload\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterH2.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterH2.match(/href="\/wiki\/Fichier:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }

      entries.push({
        imageUrl,
        description: imgAltMatch[1].replace(/\s*\([^)]*définition réelle[^)]*\)/, '').trim(),
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

    const imgSrcMatch = afterDate.match(/src="(\/\/upload\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterDate.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterDate.match(/href="\/wiki\/File:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }

      entries.push({
        imageUrl,
        description: imgAltMatch[1].trim(),
        fileUrl: `https://en.wikipedia.org/wiki/File:${fileHrefMatch[1]}`,
        date,
        archive,
      })
    }

    if (entries.length >= 31) break
  }

  return entries
}
