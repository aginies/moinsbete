export type SrsRating = 'again' | 'hard' | 'good' | 'easy'

const RATING_MULTIPLIERS: Record<SrsRating, number> = {
  again: 0,
  hard: 1.2,
  good: 2,
  easy: 3,
}

const RATING_EASE_ADJUSTMENTS: Record<SrsRating, number> = {
  again: -0.2,
  hard: -0.1,
  good: 0,
  easy: 0.1,
}

const MIN_INTERVAL_DAYS = 1
const MAX_INTERVAL_DAYS = 30

export interface SrsResult {
  nextReviewAt: Date
  newEaseFactor: number
  newReviewCount: number
}

export function calculateNextReview(
  easeFactor: number,
  rating: SrsRating,
  lastReviewAt: Date | null,
  reviewCount: number,
): SrsResult {
  const now = new Date()

  let lastInterval: number
  if (lastReviewAt && reviewCount > 0) {
    lastInterval = Math.max(
      Math.round((now.getTime() - lastReviewAt.getTime()) / (1000 * 60 * 60 * 24)),
      MIN_INTERVAL_DAYS,
    )
  } else {
    lastInterval = MIN_INTERVAL_DAYS
  }

  const multiplier = RATING_MULTIPLIERS[rating]
  let newInterval: number

  if (rating === 'again') {
    newInterval = MIN_INTERVAL_DAYS
  } else {
    newInterval = Math.min(
      Math.max(Math.round(lastInterval * multiplier), MIN_INTERVAL_DAYS),
      MAX_INTERVAL_DAYS,
    )
  }

  const newEaseFactor = Math.max(1.3, easeFactor + RATING_EASE_ADJUSTMENTS[rating])
  const newReviewCount = reviewCount + 1

  const nextReviewAt = new Date(now)
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)
  nextReviewAt.setHours(0, 0, 0, 0)

  return {
    nextReviewAt,
    newEaseFactor: Math.round(newEaseFactor * 10) / 10,
    newReviewCount,
  }
}

export function getInitialNextReviewAt(): Date {
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + 1)
  nextReviewAt.setHours(0, 0, 0, 0)
  return nextReviewAt
}
