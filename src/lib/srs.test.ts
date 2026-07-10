import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateNextReview, getInitialNextReviewAt, type SrsRating } from './srs'

describe('calculateNextReview', () => {
  const now = new Date('2026-07-10T00:00:00.000Z')
  const pastDate = new Date('2026-07-09T00:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns next review 1 day ahead for first review with again', () => {
    const result = calculateNextReview(2.5, 'again', null, 0)
    expect(result.newReviewCount).toBe(1)
    expect(result.newEaseFactor).toBe(2.3)
    expect(result.nextReviewAt.getDate()).toBe(11)
  })

  it('resets interval to 1 day for again rating', () => {
    const result = calculateNextReview(2.5, 'again', pastDate, 5)
    expect(result.newReviewCount).toBe(6)
    expect(result.nextReviewAt.getDate()).toBe(11)
  })

  it('calculates correct interval for hard rating', () => {
    const result = calculateNextReview(2.5, 'hard', now, 1)
    expect(result.newReviewCount).toBe(2)
    expect(result.newEaseFactor).toBe(2.4)
    expect(result.nextReviewAt.getDate()).toBe(11)
  })

  it('doubles interval for good rating', () => {
    const result = calculateNextReview(2.5, 'good', now, 1)
    expect(result.newReviewCount).toBe(2)
    expect(result.newEaseFactor).toBe(2.5)
    expect(result.nextReviewAt.getDate()).toBe(12)
  })

  it('triples interval for easy rating', () => {
    const result = calculateNextReview(2.5, 'easy', now, 1)
    expect(result.newReviewCount).toBe(2)
    expect(result.newEaseFactor).toBe(2.6)
    expect(result.nextReviewAt.getDate()).toBe(13)
  })

  it('caps interval at 30 days', () => {
    const thirtyDaysAgo = new Date('2026-06-10T00:00:00.000Z')
    const result = calculateNextReview(2.5, 'easy', thirtyDaysAgo, 10)
    expect(result.nextReviewAt.getDate()).toBe(9)
  })

  it('decreases ease factor for again', () => {
    const result = calculateNextReview(2.5, 'again', now, 1)
    expect(result.newEaseFactor).toBe(2.3)
  })

  it('decreases ease factor for hard', () => {
    const result = calculateNextReview(2.5, 'hard', now, 1)
    expect(result.newEaseFactor).toBe(2.4)
  })

  it('keeps ease factor for good', () => {
    const result = calculateNextReview(2.5, 'good', now, 1)
    expect(result.newEaseFactor).toBe(2.5)
  })

  it('increases ease factor for easy', () => {
    const result = calculateNextReview(2.5, 'easy', now, 1)
    expect(result.newEaseFactor).toBe(2.6)
  })

  it('caps ease factor at minimum 1.3', () => {
    const result = calculateNextReview(1.5, 'again', now, 1)
    expect(result.newEaseFactor).toBe(1.3)
  })

  it('uses 1 day as initial interval when no lastReviewAt', () => {
    const result = calculateNextReview(2.5, 'good', null, 0)
    expect(result.nextReviewAt.getDate()).toBe(12)
  })

  it('increments review count', () => {
    const result = calculateNextReview(2.5, 'good', now, 5)
    expect(result.newReviewCount).toBe(6)
  })
})

describe('getInitialNextReviewAt', () => {
  it('returns date 1 day from now', () => {
    const now = new Date()
    const result = getInitialNextReviewAt()
    const expected = new Date(now)
    expected.setDate(expected.getDate() + 1)
    expected.setHours(0, 0, 0, 0)
    expect(result.getTime()).toBe(expected.getTime())
  })
})
