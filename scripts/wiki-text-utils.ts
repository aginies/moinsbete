export function normalize(text: string): string {
  return text.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function cleanText(
  wikiText: string,
  options?: { skipImageRemoval?: boolean; skipTemplateExpansions?: boolean; stripBullet?: boolean; useDisplayText?: boolean }
): string {
  let text = wikiText
  if (options?.stripBullet) {
    text = text.replace(/^\*\s*/, '')
  }
  if (!options?.skipImageRemoval) {
    text = text.replace(/\[\[Fichier:[^\]]*\]\]/g, '')
    text = text.replace(/\[\[Image:[^\]]*\]\]/g, '')
  }
  if (options?.useDisplayText) {
    // Two-pass: replace display text first, then bare links
    text = text.replace(/\[\[([^\]|]+)\|([^]]*?)\]\]/g, '$2')
    text = text.replace(/\[\[([^\]|]+)\]\]/g, '$1')
  } else {
    text = text.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
  }
  text = text.replace(/'''((?:[^']|'(?!''))*)'''/g, '$1')
  text = text.replace(/''([^']*)''/g, '$1')
  text = text.replace(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g, '$1 $2')
  text = text.replace(/\{\{[^}]*\}\}/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  text = text.replace(/\n/g, ' ')
  text = text.replace(/\s+/g, ' ')
  if (!options?.skipTemplateExpansions) {
    text = text.replace(/\{\{lang\|[^\}]*\}\}/g, '')
    text = text.replace(/\{\{noble\|[^\}]*\}\}/g, '')
    text = text.replace(/\{\{s\|[^\}]*\}\}/g, '')
    text = text.replace(/\{\{nobr\|[^\}]*\}\}/g, '')
    text = text.replace(/\{\{XV\}\}/g, '15')
    text = text.replace(/\{\{VII\}\}/g, '7')
  }
  return text.trim()
}

export function extractImageFilename(
  wikiText: string,
  options?: { alsoTryImage?: boolean; decode?: boolean }
): string | null {
  let match = wikiText.match(/\[\[Fichier:([^\]]+)\]\]/)
  if (match) {
    const result = match[1].trim().split('|')[0]
    return options?.decode ? decodeURIComponent(result) : result
  }
  if (options?.alsoTryImage !== false) {
    match = wikiText.match(/\[\[Image:([^\]]+)\]\]/)
    if (match) return match[1].trim().split('|')[0]
  }
  return null
}

export function extractArticleLink(
  wikiText: string,
  options?: { skipNamespaceFilter?: boolean }
): string | null {
  const linkRegex = /\[\[(?!Fichier:|Image:)([^\]|]+)(\|([^]]*?))?\]\]/g
  let match
  while ((match = linkRegex.exec(wikiText)) !== null) {
    const pageName = match[1]
    if (!options?.skipNamespaceFilter) {
      if (pageName.startsWith('Catégorie:') || pageName.startsWith('Catégorie :') ||
          pageName.startsWith('Discussion:') || pageName.startsWith('Discussion :') ||
          pageName.startsWith('Wikipédia:') || pageName.startsWith('Wikipédia :') ||
          pageName.startsWith('Fichier:') || pageName.startsWith('Fichier :') ||
          pageName.startsWith('Image:') || pageName.startsWith('Image :')) {
        continue
      }
    }
    return pageName.replace(/ /g, '_').replace(/#/g, '%23').replace(/'/g, '%27')
  }
  return null
}

const WIKI_USER_AGENT = 'moinsbete/1.0 (contact: antoine@ginies.org)'

export async function fetchPage(url: string): Promise<string> {
  const encoded = encodeURIComponent(url)
  const rawUrl = `https://fr.wikipedia.org/w/index.php?title=${encoded}&action=raw`
  const res = await fetch(rawUrl, { headers: { 'User-Agent': WIKI_USER_AGENT } })
  if (!res.ok) {
    console.log(`  ⚠️ Failed to fetch: ${url} (${res.status})`)
    return ''
  }
  return res.text()
}

export async function parseFacts(
  wikitext: string,
  options?: {
    cleanOptions?: Parameters<typeof cleanText>[1]
    imageOptions?: Parameters<typeof extractImageFilename>[1]
    articleOptions?: Parameters<typeof extractArticleLink>[1]
  }
): Promise<Array<{ text: string; image: string | null; article: string }>> {
  const facts: Array<{ text: string; image: string | null; article: string }> = []
  const lines = wikitext.split('\n')
  for (const line of lines) {
    if (!line.match(/^\*\s*<!--@ID_\d+-->/)) continue
    const afterComment = line.replace(/^\*\s*<!--@ID_\d+-->\s*/, '')
    const text = cleanText(afterComment, options?.cleanOptions)
    if (!text || text.length < 20) continue
    const image = extractImageFilename(afterComment, options?.imageOptions)
    const article = extractArticleLink(afterComment, options?.articleOptions)
    facts.push({ text, image: image || null, article: article || '' })
  }
  return facts
}
