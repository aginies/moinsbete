export interface CardImageFetchResult<T> {
  data: T | null
  error: string | null
}

export async function fetchCardImage<T>(
  path: string,
  params: Record<string, string | undefined>,
  options?: { timeoutMs?: number; requireField?: keyof T },
): Promise<CardImageFetchResult<T>> {
  try {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
    const qs = search.toString()
    const url = qs ? `${path}?${qs}` : path

    const res = await fetch(url, {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 15000),
      cache: 'no-store',
    })
    if (!res.ok) return { data: null, error: null }

    const data = await res.json()
    if (data?.error) return { data: null, error: String(data.error) }
    if (options?.requireField && !data?.[options.requireField]) return { data: null, error: null }

    return { data: data as T, error: null }
  } catch {
    return { data: null, error: null }
  }
}
