import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()
const mockQueryRawUnsafe = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
    collection: {
      findUnique: mockFindUnique,
    },
    $queryRawUnsafe: mockQueryRawUnsafe,
  },
}))

describe('getAllDescendantCollectionTopicIds', () => {
  beforeEach(async () => {
    mockFindUnique.mockReset()
    mockFindMany.mockReset()
    const { topicCache } = await import('@/lib/feed-helpers')
    await topicCache.clear()
  })

  it('returns collection topic ids with no children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'coll-1',
      topics: [{ id: 'topic-1' }],
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([{ id: 'topic-1' }])

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantCollectionTopicIds('test-collection')
    expect(result).toEqual(['topic-1'])
  })

  it('returns collection topics with children', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'coll-1',
      topics: [{ id: 'topic-1', children: [{ id: 'topic-2' }] }],
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([
      { id: 'topic-1' },
      { id: 'topic-2' },
    ])

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantCollectionTopicIds('test-collection')
    expect(result).toContain('topic-1')
    expect(result).toContain('topic-2')
  })

  it('returns empty array for non-existent collection', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantCollectionTopicIds('nonexistent')
    expect(result).toEqual([])
  })

  it('uses cache when available', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'coll-1',
      topics: [{ id: 'topic-1' }],
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([{ id: 'topic-1' }])

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')

    await getAllDescendantCollectionTopicIds('cached-collection')
    expect(mockFindUnique).toHaveBeenCalledTimes(1)

    await getAllDescendantCollectionTopicIds('cached-collection')
    expect(mockFindUnique).toHaveBeenCalledTimes(1)
  })

  it('handles multiple root topics in collection', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'coll-1',
      topics: [
        { id: 'topic-1', children: [] },
        { id: 'topic-2', children: [{ id: 'topic-3' }] },
      ],
    })
    mockQueryRawUnsafe.mockResolvedValueOnce([
      { id: 'topic-1' },
      { id: 'topic-2' },
      { id: 'topic-3' },
    ])

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantCollectionTopicIds('multi-root')
    expect(result).toContain('topic-1')
    expect(result).toContain('topic-2')
    expect(result).toContain('topic-3')
  })

  it('handles empty collection', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'coll-1',
      topics: [],
    })

    const { getAllDescendantCollectionTopicIds } = await import('@/lib/feed-helpers')
    const result = await getAllDescendantCollectionTopicIds('empty-collection')
    expect(result).toEqual([])
  })
})
