import { describe, it, expect, beforeEach } from 'vitest'

describe('robots.txt', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  it('allows all paths by default', async () => {
    const robots = await import('@/app/robots')
    const defaultFn = robots.default
    const result = defaultFn()

    expect((result.rules as any).allow).toBe('/')
  })

  it('disallows admin and api paths', async () => {
    const robots = await import('@/app/robots')
    const defaultFn = robots.default
    const result = defaultFn()

    expect((result.rules as any).disallow).toContain('/admin')
    expect((result.rules as any).disallow).toContain('/api/')
  })

  it('includes sitemap URL', async () => {
    const robots = await import('@/app/robots')
    const defaultFn = robots.default
    const result = defaultFn()

    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml')
  })

  it('uses NEXTAUTH_URL env var for sitemap', async () => {
    process.env.NEXTAUTH_URL = 'https://example.com'

    const robots = await import('@/app/robots')
    const defaultFn = robots.default
    const result = defaultFn()

    expect(result.sitemap).toBe('https://example.com/sitemap.xml')
  })

  it('defaults to localhost when NEXTAUTH_URL is not set', async () => {
    delete process.env.NEXTAUTH_URL

    const robots = await import('@/app/robots')
    const defaultFn = robots.default
    const result = defaultFn()

    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml')
  })
})
