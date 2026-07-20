const USE_REDIS = process.env.RATE_LIMITER_DRIVER === 'redis'
export const stores = new Map<string, { timestamps: number[]; expiresAt: number }>()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanup() {
  const now = Date.now()
  for (const [key, data] of stores.entries()) {
    if (now > data.expiresAt) {
      stores.delete(key)
    }
  }
}

cleanup()
if (typeof window === 'undefined') {
  setInterval(cleanup, CLEANUP_INTERVAL)
}

// Support Redis dynamically to allow serverless, container, and local dev versatility
let redisClient: any = null

async function getRedisClient() {
  if (redisClient !== null) return redisClient
  
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = {
      type: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }
    return redisClient
  }

  try {
    const { Redis } = await import('ioredis')
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL)
    } else {
      redisClient = new Redis()
    }
    redisClient.type = 'ioredis'
    return redisClient
  } catch {
    try {
      const { createClient } = await import('redis')
      const client = createClient({ url: process.env.REDIS_URL })
      await client.connect()
      redisClient = client
      redisClient.type = 'redis'
      return redisClient
    } catch {
      console.warn('Redis rate limiter selected but ioredis/redis not installed and no Upstash REST credentials found. Falling back to in-memory rate limiter.')
      redisClient = 'fallback'
      return redisClient
    }
  }
}

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const sanitizedKey = key.replace(/[:\n\r]/g, '_').slice(0, 64)

  if (USE_REDIS) {
    const client = await getRedisClient()
    if (client && client !== 'fallback') {
      try {
        const fullKey = `ratelimit:${sanitizedKey}`
        if (client.type === 'upstash') {
          const res = await fetch(`${client.url}/pipeline`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${client.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([
              ['INCR', fullKey],
              ['TTL', fullKey],
            ]),
          })
          const data = await res.json()
          if (Array.isArray(data) && data[0] && data[0].result !== undefined) {
            const count = data[0].result as number
            const ttl = data[1].result as number
            if (count === 1 || ttl === -1) {
              await fetch(`${client.url}/EXPIRE`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${client.token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify([fullKey, Math.ceil(windowMs / 1000)]),
              })
            }
            return count <= max
          }
        } else if (client.type === 'ioredis') {
          const pipeline = client.multi()
          pipeline.incr(fullKey)
          pipeline.ttl(fullKey)
          const results = await pipeline.exec()
          if (results && results[0] && results[0][1] !== undefined) {
            const count = results[0][1] as number
            const ttl = results[1][1] as number
            if (count === 1 || ttl === -1) {
              await client.expire(fullKey, Math.ceil(windowMs / 1000))
            }
            return count <= max
          }
        } else if (client.type === 'redis') {
          const multi = client.multi()
          multi.incr(fullKey)
          multi.ttl(fullKey)
          const results = await multi.exec()
          if (results && results[0] !== undefined) {
            const count = results[0] as number
            const ttl = results[1] as number
            if (count === 1 || ttl === -1) {
              await client.expire(fullKey, Math.ceil(windowMs / 1000))
            }
            return count <= max
          }
        }
      } catch (err) {
        console.error('Redis rate limit error, falling back to in-memory:', err)
      }
    }
  }
  
  // Clean expired keys before checking
  cleanup()
  
  const data = stores.get(sanitizedKey)
  if (data && now > data.expiresAt) {
    stores.delete(sanitizedKey)
  }
  
  const timestamps = data?.timestamps || []
  const recent = timestamps.filter(t => now - t < windowMs)
  
  if (recent.length >= max) {
    stores.set(sanitizedKey, { timestamps: recent, expiresAt: now + windowMs })
    return false
  }
  
  recent.push(now)
  stores.set(sanitizedKey, { timestamps: recent, expiresAt: now + windowMs })
  return true
}
