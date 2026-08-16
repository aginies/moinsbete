import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    bookmark: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { toggleBookmark, isBookmarked, isBookmarkedBatch, getBookmarks, getBookmarksCount } from '@/lib/favorite'
import { prisma } from '@/lib/db'

const existingRow = {
  id: 'bm1',
  userId: 'u1',
  resourceId: 'r1',
  type: 'NEWS' as const,
  meta: null,
  createdAt: new Date(),
}

describe('toggleBookmark', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates bookmark when none exists (default action)', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.bookmark.create).mockResolvedValue(existingRow)

    const result = await toggleBookmark('u1', 'NEWS', 'r1')

    expect(result).toEqual({ bookmarked: true, wasBookmarked: false })
    expect(prisma.bookmark.create).toHaveBeenCalledTimes(1)
    expect(prisma.bookmark.delete).not.toHaveBeenCalled()
  })

  it('creates bookmark with meta when provided', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.bookmark.create).mockResolvedValue(existingRow)

    await toggleBookmark('u1', 'NEWS', 'r1', 'add', { title: 't' })

    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: { userId: 'u1', resourceId: 'r1', type: 'NEWS', meta: { title: 't' } },
    })
  })

  it('deletes bookmark when exists (default action)', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(existingRow)
    vi.mocked(prisma.bookmark.delete).mockResolvedValue(existingRow)

    const result = await toggleBookmark('u1', 'NEWS', 'r1')

    expect(result).toEqual({ bookmarked: false, wasBookmarked: true })
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 'bm1' } })
    expect(prisma.bookmark.create).not.toHaveBeenCalled()
  })

  it('no-op when exists and action=add, reports still bookmarked', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(existingRow)

    const result = await toggleBookmark('u1', 'NEWS', 'r1', 'add')

    expect(result).toEqual({ bookmarked: true, wasBookmarked: true })
    expect(prisma.bookmark.create).not.toHaveBeenCalled()
    expect(prisma.bookmark.delete).not.toHaveBeenCalled()
  })

  it('no-op when missing and action=remove, reports not bookmarked', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)

    const result = await toggleBookmark('u1', 'NEWS', 'r1', 'remove')

    expect(result).toEqual({ bookmarked: false, wasBookmarked: false })
    expect(prisma.bookmark.create).not.toHaveBeenCalled()
    expect(prisma.bookmark.delete).not.toHaveBeenCalled()
  })
})

describe('isBookmarked', () => {
  it('returns true when bookmark exists', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(existingRow)
    await expect(isBookmarked('u1', 'NEWS', 'r1')).resolves.toBe(true)
  })

  it('returns false when no bookmark', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
    await expect(isBookmarked('u1', 'NEWS', 'r1')).resolves.toBe(false)
  })
})

describe('isBookmarkedBatch', () => {
  it('returns empty set for empty input without querying', async () => {
    const result = await isBookmarkedBatch('u1', 'NEWS', [])
    expect(result).toEqual(new Set())
    expect(prisma.bookmark.findMany).not.toHaveBeenCalled()
  })

  it('returns set of bookmarked resource ids', async () => {
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([
      { resourceId: 'r1' },
      { resourceId: 'r2' },
      { resourceId: null },
    ])

    const result = await isBookmarkedBatch('u1', 'NEWS', ['r1', 'r2', 'r3'])

    expect(result).toEqual(new Set(['r1', 'r2']))
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', type: 'NEWS', resourceId: { in: ['r1', 'r2', 'r3'] } },
      select: { resourceId: true },
    })
  })
})

describe('getBookmarks / getBookmarksCount', () => {
  it('getBookmarks returns items ordered by createdAt desc', async () => {
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([existingRow])

    const result = await getBookmarks('u1', 'NEWS')

    expect(result).toHaveLength(1)
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', type: 'NEWS' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, resourceId: true, type: true, meta: true, createdAt: true },
    })
  })

  it('getBookmarksCount returns count', async () => {
    vi.mocked(prisma.bookmark.count).mockResolvedValue(42)
    await expect(getBookmarksCount('u1', 'NEWS')).resolves.toBe(42)
  })
})
