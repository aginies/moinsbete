import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    collection: {
      findUnique: vi.fn(),
    },
  },
}))

describe('getAllDescendantTopicIds', () => {
  beforeEach(async () => {
    mockFindUnique.mockReset()
    mockFindMany.mockReset()
    const { topicCache } = await import('@/lib/feed-helpers')
    topicCache.clear()
  })

  it('returns single topic id with no children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'topic-1',
      children: [],
    })

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('test-slug')
    expect(result).toEqual(['topic-1'])
  })

  it('returns topic with direct children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'topic-1',
      children: [{ id: 'topic-2' }, { id: 'topic-3' }],
    })
    mockFindMany.mockResolvedValueOnce([{ id: 'topic-2' }])
    mockFindMany.mockResolvedValueOnce([{ id: 'topic-3' }])

    const { getAllDescendantTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantTopicIds('test-slug')
    expect(result).toEqual(['topic-1', 'topic-2', 'topic-3'])
  })

  it('returns multi-level hierarchy', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'root',
      children: [{ id: 'child-1' }],
    })
    mockFindMany.mockResolvedValueOnce([{ id: 'grandchild-1' }])
    mockFindMany.mockResolvedValueOnce([])

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
