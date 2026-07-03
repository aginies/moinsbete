const stores = new Map<string, number[]>()

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
