const stores = new Map<string, number[]>()
const CLEANUP_INTERVAL = 5 * 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function cleanup() {
  const now = Date.now()
  for (const [key, timestamps] of stores.entries()) {
    const recent = timestamps.filter(t => now - t < 60000)
    if (recent.length === 0) {
      stores.delete(key)
    } else {
      stores.set(key, recent)
    }
  }
}

cleanup()
cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL)

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = stores.get(key) || []
  const recent = timestamps.filter(t => now - t < windowMs)
  if (recent.length >= max) {
    stores.set(key, recent)
    return false
  }
  recent.push(now)
  stores.set(key, recent)
  return true
}
