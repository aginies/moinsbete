import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hash',
  displayName: 'Test User',
  role: 'USER' as const,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  cnrsNewsEnabled: true,
  wikipediaImageCardVisible: true,
  saviezVousCardVisible: true,
  radioFranceCardVisible: true,
  imageWikimediaCardVisible: true,
  imageWikiLovesCardVisible: true,
  imageWikiLovesShowCategories: true,
  imageWikimediaShowCategories: true,
  imagePixabayCardVisible: true,
  imagePixabayShowCategories: true,
  lastLogin: null,
  lastVisited: null,
  portailLexicalCardVisible: true,
  proverbeCardVisible: true,
}

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn((name: string) => {
      if (name === '__Secure-next-auth.session-token') {
        return { value: 'mock-session-token' }
      }
      if (name === 'next-auth.session-token') {
        return { value: 'mock-session-token' }
      }
      return null
    }),
  })),
}))

vi.mock('next-auth/jwt', () => ({
  decode: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'test@example.com' }),
}))

describe('authOptions.authorize', () => {
  it('returns null when user is disabled', async () => {
    const { prisma } = await import('@/lib/db')
    const { authOptions } = await import('@/lib/auth')
    const password = 'correct-password'
    const passwordHash = await bcrypt.hash(password, 12)
    const user = { ...mockUser, passwordHash, enabled: false }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user)

    const result = await (authOptions.providers[0] as any).authorize({ email: 'test@example.com', password })

    expect(result).toBeNull()
  })

  it('returns null when user not found', async () => {
    const { prisma } = await import('@/lib/db')
    const { authOptions } = await import('@/lib/auth')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await (authOptions.providers[0] as any).authorize({ email: 'unknown@example.com', password: 'any' })

    expect(result).toBeNull()
  })
})

describe('getSession', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockReset()
    process.env.NEXTAUTH_SECRET = 'test-secret'
  })

  it('returns null when no session cookie', async () => {
    const { cookies } = await import('next/headers')
    vi.mocked(cookies).mockImplementationOnce(async () => ({
      get: vi.fn(() => undefined),
      has: vi.fn(() => false),
      getAll: vi.fn(() => []),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      size: 0,
      [Symbol.iterator]: () => ({
        next: () => Promise.resolve({ done: true, value: undefined }),
      }),
    }) as any)

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns null when no NEXTAUTH_SECRET', async () => {
    delete process.env.NEXTAUTH_SECRET

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns null when decode fails to return sub', async () => {
    const { decode } = await import('next-auth/jwt')
    vi.mocked(decode).mockResolvedValueOnce({ email: 'test@example.com' })

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns null when user not found', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns session data when valid', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()

    expect(result).not.toBeNull()
    expect(result!.user.id).toBe('user-1')
    expect(result!.user.email).toBe('test@example.com')
    expect(result!.user.name).toBe('Test User')
    expect(result!.user.role).toBe('USER')
    expect(result!.expires).toBeDefined()
  })

  it('handles decode error gracefully', async () => {
    const { decode } = await import('next-auth/jwt')
    vi.mocked(decode).mockRejectedValueOnce(new Error('decode error'))

    const { getSession } = await import('@/lib/auth')
    const result = await getSession()
    expect(result).toBeNull()
  })
})
