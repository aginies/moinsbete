import { decodeHtmlEntities } from '@/lib/utils'

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'
const MAX_CHUNK_CHARS = 500
const CHUNK_DELAY_MS = 500
const REQUEST_TIMEOUT_MS = 15000

interface MyMemoryResponse {
  responseData?: { translatedText?: string }
  responseStatus?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function chunkText(text: string, maxChars: number = MAX_CHUNK_CHARS): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= maxChars) return [trimmed]

  const sentences = trimmed.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [trimmed]
  const chunks: string[] = []
  let current = ''

  const pushCurrent = () => {
    if (current) {
      chunks.push(current)
      current = ''
    }
  }

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      pushCurrent()
      let piece = ''
      for (const word of sentence.split(/\s+/)) {
        if (piece && (piece + ' ' + word).length > maxChars) {
          chunks.push(piece)
          piece = word
        } else {
          piece = piece ? piece + ' ' + word : word
        }
      }
      current = piece
      continue
    }
    if (current && (current + sentence).length > maxChars) {
      pushCurrent()
    }
    current += sentence
  }
  pushCurrent()
  return chunks
}

async function translateChunk(chunk: string): Promise<string | null> {
  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(chunk)}&langpair=en%7Cfr`
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as MyMemoryResponse
    const translated = data?.responseData?.translatedText
    if (!translated) return null
    if (translated.toUpperCase().startsWith('MYMEMORY WARNING')) return null
    return decodeHtmlEntities(translated)
  } catch {
    return null
  }
}

export async function translateEnToFr(text: string, maxChars: number = MAX_CHUNK_CHARS): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const chunks = chunkText(trimmed, maxChars)
  const parts: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const part = await translateChunk(chunks[i])
    if (part === null) return null
    parts.push(part.trim())
    if (i < chunks.length - 1) await sleep(CHUNK_DELAY_MS)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
