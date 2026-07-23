import { createTtlCache, type CacheEntry, type TtlCacheOptions } from './ttl-cache'

type RedisClient = {
  type: 'upstash' | 'ioredis'
  url?: string
  token?: string
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: { EX: number }) => Promise<string>
  del: (key: string) => Promise<number>
  keys: (pattern: string) => Promise<string[]>
  incr: (key: string) => Promise<number>
  ttl: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<number>
  multi: () => {
    incr: (key: string) => any
    ttl: (key: string) => any
    exec: () => Promise<any[]>
  }
}

let redisClient: RedisClient | 'fallback' | null = null

async function getRedisClient(): Promise<RedisClient | 'fallback' | null> {
  if (redisClient !== null) return redisClient

  // Skip Redis in test environment
  if (process.env.NODE_ENV === 'test') {
    redisClient = 'fallback'
    return redisClient
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = {
      type: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      async get(key: string) {
        const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/GET/${key}`, {
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        })
        const data = await res.json()
        return data.result === null ? null : data.result
      },
      async set(key: string, value: string, options?: { EX: number }) {
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/SET`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([key, value, ...(options?.EX ? ['EX', options.EX] : [])]),
        })
        return 'OK'
      },
      async del(key: string) {
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/DEL`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([key]),
        })
        return 1
      },
      async keys(pattern: string) {
        const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/KEYS/${pattern}`, {
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        })
        const data = await res.json()
        return Array.isArray(data.result) ? data.result : []
      },
      incr: async () => 1,
      ttl: async () => -1,
      expire: async () => 1,
      multi: () => ({
        incr: () => ({ exec: async () => [null, 1] }),
        ttl: () => ({ exec: async () => [null, -1] }),
        exec: async () => [[null, 1], [null, -1]],
      }),
    }
    return redisClient
  }

  try {
    const { Redis } = await import('ioredis')
    const client = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis()
    client.on('error', (err) => {
      console.error('ioredis connection error, falling back to in-memory cache:', err)
    })
    redisClient = {
      type: 'ioredis',
      url: process.env.REDIS_URL,
      get: (key: string) => client.get(key),
      set: (key: string, value: string, options?: { EX: number }) => (client as any).set(key, value, options),
      del: (key: string) => client.del(key),
      keys: (pattern: string) => client.keys(pattern),
      incr: (key: string) => client.incr(key),
      ttl: (key: string) => client.ttl(key),
      expire: (key: string, seconds: number) => client.expire(key, seconds),
      multi: () => client.multi(),
    } as unknown as RedisClient
    return redisClient
  } catch {
    console.warn('Redis cache selected but ioredis not available. Falling back to in-memory cache.')
    redisClient = 'fallback'
    return redisClient
  }
}

export function createRedisTtlCache<T>(options?: TtlCacheOptions) {
  const fallbackCache = createTtlCache<T>(options)
  const ttlMs = options?.ttlMs ?? 5 * 60 * 1000
  const prefix = `cache:`

  async function get(key: string): Promise<T | null> {
    const cached = fallbackCache.get(key)
    if (cached !== null) return cached

    const client = await getRedisClient()
    if (client && client !== 'fallback') {
      try {
        const raw = await client.get(`${prefix}${key}`)
        if (raw) {
          const value = JSON.parse(raw) as T
          fallbackCache.set(key, value)
          return value
        }
      } catch (err) {
        console.error('Redis get error:', err)
      }
    }
    return null
  }

  async function set(key: string, value: T): Promise<void> {
    fallbackCache.set(key, value)

    const client = await getRedisClient()
    if (client && client !== 'fallback') {
      try {
        await client.set(`${prefix}${key}`, JSON.stringify(value), { EX: Math.ceil(ttlMs / 1000) })
      } catch (err) {
        console.error('Redis set error:', err)
      }
    }
  }

  function has(key: string): boolean {
    return fallbackCache.has(key)
  }

  async function del(key: string): Promise<void> {
    fallbackCache.del(key)

    const client = await getRedisClient()
    if (client && client !== 'fallback') {
      try {
        await client.del(`${prefix}${key}`)
      } catch (err) {
        console.error('Redis del error:', err)
      }
    }
  }

  async function clear(): Promise<void> {
    fallbackCache.clear()

    const client = await getRedisClient()
    if (client && client !== 'fallback') {
      try {
        const keys = await client.keys(`${prefix}*`)
        if (keys.length > 0) {
          for (const key of keys) {
            await client.del(key)
          }
        }
      } catch (err) {
        console.error('Redis clear error:', err)
      }
    }
  }

  return { get, set, has, del, clear }
}
