import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const RSS_URL = 'https://lejournal.cnrs.fr/rss-types/article'

interface CnrsArticle {
  title: string
  imageUrl: string
  link: string
  category: string
  date: string
}

async function fetchRandomArticle(): Promise<CnrsArticle | null> {
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'MoinsBete/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const obj = parser.parse(xml)

    const items = obj?.rss?.channel?.item
    if (!items || !Array.isArray(items) || items.length === 0) return null

    const random = items[Math.floor(Math.random() * items.length)]

    const enclosure = random?.enclosure
    const imageUrl = typeof enclosure === 'object' ? enclosure['@_url'] : ''
    const category = random?.category || ''
    const pubDate = random?.pubDate || ''

    return {
      title: random?.title || '',
      imageUrl,
      link: random?.link || '',
      category,
      date: pubDate ? new Date(pubDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
    }
  } catch {
    return null
  }
}

export async function GET() {
  const article = await fetchRandomArticle()
  if (!article) {
    return NextResponse.json({ error: true })
  }
  return NextResponse.json(article)
}
