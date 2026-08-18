import { describe, it, expect } from 'vitest'
import { withTimeout } from './redis-cache'

describe('withTimeout', () => {
  it('resolves with promise value when promise settles first', async () => {
    const value = await withTimeout(Promise.resolve('value'), 'fallback', 100)
    expect(value).toBe('value')
  })

  it('resolves with fallback when promise never settles (ioredis offline queue hang)', async () => {
    const never = new Promise<string>(() => {})
    const t0 = Date.now()
    const value = await withTimeout(never, 'fallback', 50)
    expect(value).toBe('fallback')
    expect(Date.now() - t0).toBeLessThan(2000)
  })

  it('resolves with fallback when promise rejects is not swallowed by timeout', async () => {
    const value = await withTimeout(Promise.reject(new Error('boom')), 'fallback', 100).catch(e => e.message)
    expect(value).toBe('boom')
  })
})
