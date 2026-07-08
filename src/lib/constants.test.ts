import { describe, it, expect } from 'vitest'
import * as constants from '@/lib/constants'

describe('password constants', () => {
  it('has minimum password length of 8', () => {
    expect(constants.MIN_PASSWORD_LENGTH).toBe(8)
  })

  it('has maximum password length of 128', () => {
    expect(constants.MAX_PASSWORD_LENGTH).toBe(128)
  })
})

describe('rate limit constants', () => {
  it('has correct register rate limit', () => {
    expect(constants.RATE_LIMIT_REGISTER_MAX).toBe(3)
    expect(constants.RATE_LIMIT_REGISTER_WINDOW_MS).toBe(60_000)
  })

  it('has correct login rate limit', () => {
    expect(constants.RATE_LIMIT_LOGIN_MAX).toBe(5)
    expect(constants.RATE_LIMIT_LOGIN_WINDOW_MS).toBe(60_000)
  })

  it('has correct reset password rate limits', () => {
    expect(constants.RATE_LIMIT_RESET_GENERATE_MAX).toBe(3)
    expect(constants.RATE_LIMIT_RESET_GENERATE_WINDOW_MS).toBe(300_000)
    expect(constants.RATE_LIMIT_RESET_MAX).toBe(5)
    expect(constants.RATE_LIMIT_RESET_WINDOW_MS).toBe(300_000)
  })

  it('has correct suggest rate limit', () => {
    expect(constants.RATE_LIMIT_SUGGEST_MAX).toBe(10)
    expect(constants.RATE_LIMIT_SUGGEST_WINDOW_MS).toBe(60_000)
  })
})

describe('session constants', () => {
  it('has 30-day session max age in seconds', () => {
    expect(constants.SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60)
  })

  it('has 30-day session max age in ms', () => {
    expect(constants.SESSION_COOKIE_MAX_AGE_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })
})

describe('feed constants', () => {
  it('has default feed limit of 20', () => {
    expect(constants.DEFAULT_FEED_LIMIT).toBe(20)
  })

  it('has history feed limit of 10', () => {
    expect(constants.HISTORY_FEED_LIMIT).toBe(10)
  })

  it('has max url length of 2048', () => {
    expect(constants.MAX_URL_LENGTH).toBe(2048)
  })
})
