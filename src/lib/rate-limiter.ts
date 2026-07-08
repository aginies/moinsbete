const USE_REDIS = process.env.RATE_LIMITER_DRIVER === 'redis'
export const stores = new Map<string, { timestamps: number[]; expiresAt: number }>()
const CLEANUP_INTERVAL = 5 * 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function cleanup() {
  const now = Date.now()
  for (const [key, data] of stores.entries()) {
    if (now > data.expiresAt) {
      stores.delete(key)
    }
  }
}

cleanup()
cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL)

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  
  // Check if key expired
  const data = stores.get(key)
  if (data && now > data.expiresAt) {
    stores.delete(key)
  }
  
  const timestamps = data?.timestamps || []
  const recent = timestamps.filter(t => now - t < windowMs)
  
  if (recent.length >= max) {
    stores.set(key, { timestamps: recent, expiresAt: now + windowMs })
    return false
  }
  
  recent.push(now)
  stores.set(key, { timestamps: recent, expiresAt: now + windowMs })
  return true
}
