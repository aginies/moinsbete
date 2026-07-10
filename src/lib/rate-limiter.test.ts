import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limiter'

describe('checkRateLimit', () => {
  it('allows first request', async () => {
    const result = await checkRateLimit('test-key', 3, 60000)
    expect(result).toBe(true)
  })

  it('allows requests under the limit', async () => {
    await checkRateLimit('under-limit', 5, 60000)
    await checkRateLimit('under-limit', 5, 60000)
    await checkRateLimit('under-limit', 5, 60000)
    await checkRateLimit('under-limit', 5, 60000)
    expect(await checkRateLimit('under-limit', 5, 60000)).toBe(true)
  })

  it('blocks request at the limit', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('at-limit', 3, 60000)
    }
    expect(await checkRateLimit('at-limit', 3, 60000)).toBe(false)
  })

  it('blocks requests over the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('over-limit', 5, 60000)
    }
    expect(await checkRateLimit('over-limit', 5, 60000)).toBe(false)
    expect(await checkRateLimit('over-limit', 5, 60000)).toBe(false)
  })

  it('uses different keys independently', async () => {
    await checkRateLimit('key-a', 1, 60000)
    expect(await checkRateLimit('key-a', 1, 60000)).toBe(false)
    expect(await checkRateLimit('key-b', 1, 60000)).toBe(true)
  })

  it('allows new requests after window expires', async () => {
    const key = `expire-key-${Date.now()}`
    await checkRateLimit(key, 1, 100)
    expect(await checkRateLimit(key, 1, 100)).toBe(false)

    // Manually expire by clearing timestamps and setting expiresAt in the past
    const { stores } = await import('@/lib/rate-limiter')
    const entry = stores.get(key)
    expect(entry).toBeDefined()
    entry!.timestamps = []
    entry!.expiresAt = Date.now() - 200
    stores.set(key, entry!)

    expect(await checkRateLimit(key, 1, 100)).toBe(true)
  })
})
