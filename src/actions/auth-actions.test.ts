import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [], secret: 'test' },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.1'
      if (name === 'x-real-ip') return null
      return null
    }),
  })),
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('next-auth/jwt', () => ({
  encode: vi.fn().mockResolvedValue('mock-token'),
  decode: vi.fn().mockResolvedValue({ sub: 'user-1' }),
}))

const originalFetch = global.fetch
beforeEach(() => {
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    json: vi.fn().mockResolvedValue({ success: true }),
    redirected: false,
    url: '',
    type: 'basic',
    body: null,
    bodyUsed: false,
  } as unknown as Response
  global.fetch = vi.fn().mockResolvedValue(mockResponse)
})

afterEach(() => {
  global.fetch = originalFetch
})

describe('isRegistrationLocked', () => {
  it('returns true when REGISTRATION_LOCKED is true', async () => {
    process.env.REGISTRATION_LOCKED = 'true'
    const { isRegistrationLocked } = await import('@/actions/auth-actions')
    expect(await isRegistrationLocked()).toBe(true)
  })

  it('returns false when REGISTRATION_LOCKED is not set', async () => {
    delete process.env.REGISTRATION_LOCKED
    const { isRegistrationLocked } = await import('@/actions/auth-actions')
    expect(await isRegistrationLocked()).toBe(false)
  })
})

describe('registerAction', () => {
  beforeEach(async () => {
    const { checkRateLimit } = await import('@/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue(true)
    delete process.env.REGISTRATION_LOCKED
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it('returns success for valid registration', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      passwordHash: 'hash',
      displayName: 'New User',
      role: 'USER' as const,
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
    })

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      cfToken: 'test-token',
    })

    expect(result).toEqual({ success: true })
  })

  it('returns error when email already exists', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'existing@example.com',
      passwordHash: 'hash',
      displayName: 'Existing',
      role: 'USER' as const,
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
    })

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'existing@example.com',
      password: 'password123',
      displayName: 'New User',
    })

    expect(result).toEqual({ error: 'Cet email est déjà utilisé' })
  })

  it('returns error when registration is locked', async () => {
    process.env.REGISTRATION_LOCKED = 'true'

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    })

    expect(result).toEqual({ error: 'Inscriptions temporairement fermées pendant la mise à jour de la base de données.' })
  })

  it('returns rate limit error', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    })

    expect(result).toEqual({ error: 'Trop de tentatives. Réessayez dans 60 secondes.' })
  })

  it('returns error when Turnstile fails', async () => {
    delete process.env.REGISTRATION_LOCKED
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: vi.fn().mockResolvedValue({ success: false }),
      redirected: false,
      url: '',
      type: 'basic',
      body: null,
      bodyUsed: false,
    } as unknown as Response
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      cfToken: 'bad-token',
    })

    expect(result).toEqual({ error: 'Vérification humaine échouée. Réessayez.' })
  })

  it('returns error when cfToken missing but secret configured', async () => {
    delete process.env.REGISTRATION_LOCKED
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'

    const { registerAction } = await import('@/actions/auth-actions')
    const result = await registerAction({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    })

    expect(result).toEqual({ error: 'Vérification humaine requise.' })
  })
})

describe('loginAction', () => {
  beforeEach(async () => {
    const { checkRateLimit } = await import('@/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue(true)
  })

  it('returns success for valid credentials', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 12)
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hash,
      displayName: 'Test User',
      role: 'USER' as const,
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
    }
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    process.env.NEXTAUTH_SECRET = 'test-secret'

    const { loginAction } = await import('@/actions/auth-actions')
    const result = await loginAction({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: true })
  })

  it('returns error for wrong email', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { loginAction } = await import('@/actions/auth-actions')
    const result = await loginAction({
      email: 'nobody@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ error: 'Email ou mot de passe incorrect' })
  })

  it('returns error for wrong password', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correct', 12)
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hash,
      displayName: 'Test User',
      role: 'USER' as const,
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
    }
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const { loginAction } = await import('@/actions/auth-actions')
    const result = await loginAction({
      email: 'test@example.com',
      password: 'wrong',
    })

    expect(result).toEqual({ error: 'Email ou mot de passe incorrect' })
  })

  it('returns rate limit error', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)

    const { loginAction } = await import('@/actions/auth-actions')
    const result = await loginAction({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ error: 'Trop de tentatives. Réessayez dans 60 secondes.' })
  })
})

describe('logoutAction', () => {
  it('returns success', async () => {
    const { logoutAction } = await import('@/actions/auth-actions')
    const result = await logoutAction()
    expect(result).toEqual({ success: true })
  })
})

describe('changePasswordAction', () => {
  beforeEach(async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' as const },
    })
  })

  it('returns error for short new password', async () => {
    const { changePasswordAction } = await import('@/actions/auth-actions')
    const formData = new FormData()
    formData.set('currentPassword', 'oldpass')
    formData.set('newPassword', 'short')

    const result = await changePasswordAction(formData)
    expect(result).toEqual({ error: 'Le mot de passe doit contenir au moins 8 caractères' })
  })

  it('returns error when not logged in', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(null)

    const { changePasswordAction } = await import('@/actions/auth-actions')
    const formData = new FormData()
    formData.set('currentPassword', 'oldpass')
    formData.set('newPassword', 'newpassword123')

    const result = await changePasswordAction(formData)
    expect(result).toEqual({ error: 'Non connecté' })
  })
})

describe('getTurnstileSiteKey', () => {
  it('returns the configured site key or empty string', async () => {
    const originalKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key'

    const { getTurnstileSiteKey } = await import('@/actions/auth-actions')
    const result = await getTurnstileSiteKey()
    expect(result).toBe('test-site-key')

    if (originalKey !== undefined) {
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalKey
    } else {
      delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    }
  })
})
