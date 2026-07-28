import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'

// Variables prefixed with 'mock' are allowed in vi.mock scopes
const mockState = { value: null as any }
const mockStateSetter = vi.fn((newVal: any) => {
  mockState.value = newVal
})
let mockEffectCallbacks: Array<() => void> = []

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: <T>(init: T | (() => T)) => {
      if (mockState.value === null) {
        mockState.value = typeof init === 'function' ? (init as any)() : init
      }
      return [mockState.value, mockStateSetter] as any
    },
    useEffect: (fn: () => void) => {
      mockEffectCallbacks.push(fn)
    },
  }
})

// Import the hook after mocking react
import { useAutoRefresh } from './use-auto-refresh'

describe('useAutoRefresh', () => {
  let localStorageMock: Record<string, string> = {}

  beforeEach(() => {
    localStorageMock = {}
    mockState.value = null
    mockStateSetter.mockClear()
    mockEffectCallbacks = []

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0,
      key: vi.fn(),
    } as any

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes and stores current time if no saved timestamp, and does not refresh', () => {
    const refreshSpy = vi.fn()

    // Execute the hook (1st render)
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Verify useState was initialized to null
    expect(mockState.value).toBeNull()

    // Run mount effect (loading/initializing from localStorage)
    expect(mockEffectCallbacks.length).toBeGreaterThanOrEqual(1)
    mockEffectCallbacks[0]()
    expect(global.localStorage.getItem).toHaveBeenCalledWith('last_refresh_testKey')
    // It should set the state to current time (which is non-zero) and store it
    expect(mockStateSetter).toHaveBeenCalledWith(expect.any(Number))
    expect(global.localStorage.setItem).toHaveBeenCalledWith('testKey' ? 'last_refresh_testKey' : expect.any(String), expect.any(String))

    // Simulate state update setting state to current time
    const currentTime = Date.now()
    mockState.value = currentTime
    mockEffectCallbacks = []

    // Re-execute hook (2nd render) to simulate state update propagation
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Run the refresh evaluation effect of the 2nd render
    mockEffectCallbacks[1]()
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it('triggers refresh if saved timestamp is expired', () => {
    const refreshSpy = vi.fn()
    const expiredTimestamp = Date.now() - 2000 // 2000ms ago
    localStorageMock['last_refresh_testKey'] = String(expiredTimestamp)

    // Execute the hook (1st render)
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Run mount effect (loading from localStorage)
    mockEffectCallbacks[0]()
    expect(global.localStorage.getItem).toHaveBeenCalledWith('last_refresh_testKey')
    expect(mockStateSetter).toHaveBeenCalledWith(expiredTimestamp)

    // Simulate state update setting state to expiredTimestamp
    mockState.value = expiredTimestamp
    mockEffectCallbacks = []

    // Re-execute hook (2nd render)
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Run the refresh evaluation effect of the 2nd render
    mockEffectCallbacks[1]()
    expect(refreshSpy).toHaveBeenCalled()
    expect(mockStateSetter).toHaveBeenCalledWith(expect.any(Number))
    expect(global.localStorage.setItem).toHaveBeenCalledWith('last_refresh_testKey', expect.any(String))
  })

  it('does not trigger refresh if saved timestamp is recent', () => {
    const refreshSpy = vi.fn()
    const recentTimestamp = Date.now() - 500 // 500ms ago
    localStorageMock['last_refresh_testKey'] = String(recentTimestamp)

    // Execute the hook (1st render)
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Run mount effect (loading from localStorage)
    mockEffectCallbacks[0]()
    expect(global.localStorage.getItem).toHaveBeenCalledWith('last_refresh_testKey')
    expect(mockStateSetter).toHaveBeenCalledWith(recentTimestamp)

    // Simulate state update with the loaded timestamp
    mockState.value = recentTimestamp
    mockEffectCallbacks = []

    // Re-execute hook (2nd render)
    useAutoRefresh('testKey', refreshSpy, 1000)

    // Run the refresh evaluation effect of the 2nd render
    mockEffectCallbacks[1]()
    expect(refreshSpy).not.toHaveBeenCalled()
  })
})
