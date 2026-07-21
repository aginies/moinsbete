import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()
const mockQueryRawUnsafe = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    collection: {
      findUnique: vi.fn(),
    },
    $queryRawUnsafe: (...args: unknown[]) => mockQueryRawUnsafe(...args),
  },
}))

describe('getAllDescendantTopicIds', () => {
  beforeEach(async () => {
    mockFindUnique.mockReset()
    mockFindMany.mockReset()
    mockQueryRawUnsafe.mockReset()
    const { topicCache } = await import('@/lib/feed-helpers')
    await topicCache.clear()
  })

  it('returns single topic id with no children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'topic-1',
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([{ id: 'topic-1' }])

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('test-slug')
    expect(result).toEqual(['topic-1'])
  })

  it('returns topic with direct children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'topic-1',
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([
      { id: 'topic-1' },
      { id: 'topic-2' },
      { id: 'topic-3' },
    ])

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('test-slug')
    expect(result).toEqual(['topic-1', 'topic-2', 'topic-3'])
  })

  it('returns multi-level hierarchy', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'root',
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([
      { id: 'root' },
      { id: 'child-1' },
      { id: 'grandchild-1' },
    ])

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('multi-level-slug')
    expect(result).toContain('root')
    expect(result).toContain('child-1')
    expect(result).toContain('grandchild-1')
  })

  it('handles non-existent topic', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('nonexistent')
    expect(result).toEqual([])
  })
})
