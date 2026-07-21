import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCardVisibility } from './use-card-visibility'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

vi.mock('react', () => {
  let stateVal: any
  return {
    useState: (initial: any) => {
      stateVal = initial
      return [stateVal, (newVal: any) => { stateVal = newVal }]
    },
    useCallback: (fn: any) => fn,
    useEffect: (fn: any) => {
      fn()
    },
  }
})

describe('useCardVisibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ portailLexicalCardVisible: false }),
    } as any)
  })

  it('returns default values correctly and maps color correctly', () => {
    const result = useCardVisibility({
      storageKey: 'portail_lexical_card_visible',
      userId: 'user-1',
    })
    expect(result.show).toBe(true)
    expect(result.buttonColor).toBe('amber')
    expect(result.hasMounted).toBe(false)
  })

  it('correctly fetches database visibility on mount', () => {
    useCardVisibility({
      storageKey: 'portail_lexical_card_visible',
      userId: 'user-1',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user-card-visibility?field=portailLexicalCardVisible',
      { credentials: 'include' }
    )
  })
})
