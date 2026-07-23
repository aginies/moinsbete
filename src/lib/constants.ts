export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_REGISTER_WINDOW_MS = 60_000
export const RATE_LIMIT_REGISTER_MAX = 3
export const RATE_LIMIT_LOGIN_WINDOW_MS = 60_000
export const RATE_LIMIT_LOGIN_MAX = 5
export const RATE_LIMIT_RESET_GENERATE_WINDOW_MS = 300_000
export const RATE_LIMIT_RESET_GENERATE_MAX = 3
export const RATE_LIMIT_RESET_WINDOW_MS = 300_000
export const RATE_LIMIT_RESET_MAX = 5
export const RATE_LIMIT_SUGGEST_WINDOW_MS = 60_000
export const RATE_LIMIT_SUGGEST_MAX = 10

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
export const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const DEFAULT_FEED_LIMIT = 20
export const HISTORY_FEED_LIMIT = 10
export const NEWS_DISPLAY_LIMIT = 10

export const RATE_LIMIT_ERROR_MESSAGE = 'Trop de demandes. Réessayez dans 60 secondes.'

export const MAX_URL_LENGTH = 2048
