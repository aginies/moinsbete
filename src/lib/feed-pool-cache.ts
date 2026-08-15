import { createRedisTtlCache } from './redis-cache'

export const POOL_CACHE_TTL_MS = 60_000

const poolCache = createRedisTtlCache<unknown>({ ttlMs: POOL_CACHE_TTL_MS })

export async function getCachedPool<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = await poolCache.get(key)
  if (cached !== null) return cached as T
  const fresh = await loader()
  await poolCache.set(key, fresh)
  return fresh
}
