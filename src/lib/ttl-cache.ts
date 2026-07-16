export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface TtlCacheOptions {
  ttlMs: number
}

export function createTtlCache<T>(options?: TtlCacheOptions) {
  const cache = new Map<string, CacheEntry<T>>()
  const ttlMs = options?.ttlMs ?? 5 * 60 * 1000

  function get(key: string): T | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (entry.expiresAt > Date.now()) {
      return entry.value
    }
    cache.delete(key)
    return null
  }

  function set(key: string, value: T): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  function has(key: string): boolean {
    return get(key) !== null
  }

  function del(key: string): void {
    cache.delete(key)
  }

  function clear(): void {
    cache.clear()
  }

  return { get, set, has, del, clear }
}
