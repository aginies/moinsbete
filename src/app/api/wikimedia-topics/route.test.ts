import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSession = { user: { id: 'user-1', role: 'USER' as const } }

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [], secret: 'test' },
}))

const mockFindUniqueUser = vi.fn()
const mockFindUniqueTopic = vi.fn()
const mockFindManyTopic = vi.fn()
const mockUpsertTopic = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUniqueUser(...args),
    },
    userWikimediaTopic: {
      findUnique: (...args: any[]) => mockFindUniqueTopic(...args),
      findMany: (...args: any[]) => mockFindManyTopic(...args),
      upsert: (...args: any[]) => mockUpsertTopic(...args),
    },
  },
}))

describe('Wikimedia Topics API route', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFindUniqueUser.mockReset()
    mockFindUniqueTopic.mockReset()
    mockFindManyTopic.mockReset()
    mockUpsertTopic.mockReset()
  })

  it('GET returns default topics and custom merged topics', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    mockFindUniqueUser.mockResolvedValue({ id: 'user-1', imageWikimediaCardVisible: true })
    mockFindManyTopic.mockResolvedValue([
      {
        topicId: 'paintings',
        enabled: true,
        active: true,
        label: 'Peintures Custom',
        icon: '🎨',
        searchTerms: ['Custom painting'],
      }
    ])

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/wikimedia-topics')
    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.topics).toBeDefined()
    // Paintings should have active: true and labels from the custom database entry
    const paintings = data.topics.find((t: any) => t.id === 'paintings')
    expect(paintings.active).toBe(true)
    expect(paintings.enabled).toBe(true)
  })

  it('POST with toggle_active toggles active and falls back to default if no entry exists', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    // Scenario 1: aviation topic has active: true by default. Toggling should set it to false.
    mockFindUniqueTopic.mockResolvedValueOnce(null) // no existing db entry
    
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/wikimedia-topics', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle_active', topicId: 'aviation' }),
    })
    
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockUpsertTopic).toHaveBeenCalledWith({
      where: { userId_topicId: { userId: 'user-1', topicId: 'aviation' } },
      create: expect.objectContaining({
        active: false, // negated from aviation's default (true)
      }),
      update: { active: false },
    })
  })

  it('POST with toggle_enabled toggles enabled and falls back to default if no entry exists', async () => {
    const { getServerSession } = await import('next-auth/next')
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    // Scenario 1: paintings topic has enabled: true by default. Toggling should set it to false.
    mockFindUniqueTopic.mockResolvedValueOnce(null) // no existing db entry
    
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/wikimedia-topics', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle_enabled', topicId: 'paintings' }),
    })
    
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockUpsertTopic).toHaveBeenCalledWith({
      where: { userId_topicId: { userId: 'user-1', topicId: 'paintings' } },
      create: expect.objectContaining({
        enabled: false, // negated from paintings' default (true)
      }),
      update: { enabled: false },
    })
  })
})
