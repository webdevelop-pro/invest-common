/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { redirectAuthGuard } from '../redirectAuthGuard'
import type { ISession } from 'InvestCommon/types/api/auth'

// ------------------- HOIST-SAFE HELPERS -------------------
const hoisted = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  navigateWithQueryParamsMock: vi.fn(),
}))

// ------------------- MOCKS -------------------

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  getAll: vi.fn(() => ({})),
}

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => mockCookies,
}))

vi.mock('InvestCommon/data/service/apiClient', () => {
  class MockApiClient {
    get(path: string, config?: unknown) {
      return hoisted.getSessionMock(path, config)
    }
  }
  return { ApiClient: MockApiClient }
})

const createMockSession = (active: boolean, id = 's1'): ISession => ({
  id,
  active,
  expires_at: '2024-12-31T23:59:59Z',
  authenticated_at: '2024-01-01T00:00:00Z',
  authentication_methods: [],
  authenticator_assurance_level: 'aal1',
  identity: {
    id: 'i1',
    traits: {},
    created_at: '2024-01-01T00:00:00Z',
    credentials: {},
    recovery_addresses: [],
    schema_id: 'default',
    schema_url: '',
    state: 'active',
    state_changed_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    verifiable_addresses: [],
  },
  issued_at: '2024-01-01T00:00:00Z',
  devices: [],
  tikenized: '',
} as unknown as ISession)

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    FRONTEND_URL_STATIC: 'https://static.example.com',
    KRATOS_URL: 'https://kratos.example.com',
  },
}))

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: hoisted.navigateWithQueryParamsMock,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {},
  }),
}))

// ------------------- HELPERS -------------------
const createMockRoute = (path: string, requiresAuth = false) => ({
  path,
  fullPath: path,
  meta: { requiresAuth },
} as any)

// ------------------- TESTS -------------------

function redirectAuthGuardTests() {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    hoisted.getSessionMock.mockResolvedValue(null)
    mockCookies.get.mockReturnValue(undefined)
    mockCookies.getAll.mockReturnValue({})
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })
  })

  it('updates session and initializes profiles when valid session found for logged out user', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const session = createMockSession(true)
    hoisted.getSessionMock.mockResolvedValue({ data: session })
    const to = createMockRoute('/dashboard', true)

    await redirectAuthGuard(to)

    expect(sessionStore.userSession).toEqual(session)
    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('redirects to signin when no session and route requires auth', async () => {
    hoisted.getSessionMock.mockResolvedValue({ data: null })
    const to = createMockRoute('/protected', true)

    await redirectAuthGuard(to)

    expect(hoisted.navigateWithQueryParamsMock).toHaveBeenCalledWith('https://static.example.com/signin', {
      redirect: 'http://localhost:3000/protected',
    })
  })

  it('does not redirect when no session and route does not require auth', async () => {
    hoisted.getSessionMock.mockResolvedValue({ data: null })
    const to = createMockRoute('/public', false)

    await redirectAuthGuard(to)

    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('prevents redirect loop when already on signin page', async () => {
    hoisted.getSessionMock.mockResolvedValue({ data: null })
    const to = createMockRoute('/signin', true)

    await redirectAuthGuard(to)

    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('prevents redirect loop when already on signup page', async () => {
    hoisted.getSessionMock.mockResolvedValue({ data: null })
    const to = createMockRoute('/signup', true)

    await redirectAuthGuard(to)

    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('resets data when logged in but session data is missing', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    hoisted.getSessionMock.mockClear()
    
    // Set up a session in cookies to make userLoggedIn true
    const session = createMockSession(true)
    mockCookies.get.mockReturnValue(session)
    sessionStore.updateSession(session)
    
    // Verify session is set
    expect(sessionStore.userSession).toBeDefined()
    
    // Clear the session ref to simulate missing session data
    sessionStore.resetAll()
    
    // After resetAll, userLoggedIn becomes false (computed from userSession.value)
    // So the guard will call getSession to check for a session
    hoisted.getSessionMock.mockResolvedValue({ data: null })

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    // Verify session is cleared
    expect(sessionStore.userSession).toBeUndefined()
    // getSession is called because userLoggedIn is false after resetAll
    expect(hoisted.getSessionMock).toHaveBeenCalled()
    // Since no session found and route requires auth, should redirect to signin
    expect(hoisted.navigateWithQueryParamsMock).toHaveBeenCalled()
  })

  it('verifies session validity when logged in with session data', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const existingSession = createMockSession(true)
    sessionStore.updateSession(existingSession)
    hoisted.getSessionMock.mockResolvedValue({ data: existingSession })

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('resets data and redirects when session becomes invalid', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const existingSession = createMockSession(true)
    sessionStore.updateSession(existingSession)
    hoisted.getSessionMock.mockResolvedValue({ data: createMockSession(false) })

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    expect(sessionStore.userSession).toBeUndefined()
    expect(hoisted.navigateWithQueryParamsMock).toHaveBeenCalledWith('https://static.example.com/signin', {
      redirect: 'http://localhost:3000/dashboard',
    })
  })

  it('does not redirect when session invalid but route does not require auth', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const existingSession = createMockSession(true)
    sessionStore.updateSession(existingSession)
    hoisted.getSessionMock.mockResolvedValue({ data: createMockSession(false) })

    const to = createMockRoute('/public', false)
    await redirectAuthGuard(to)

    expect(sessionStore.userSession).toBeUndefined()
    expect(hoisted.navigateWithQueryParamsMock).not.toHaveBeenCalled()
  })

  it('updates session when session ID changes', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const oldSession = createMockSession(true, 's1')
    sessionStore.updateSession(oldSession)
    const newSession = createMockSession(true, 's2')
    hoisted.getSessionMock.mockResolvedValue({ data: newSession })

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    expect(sessionStore.userSession).toEqual(newSession)
  })

  it('does not update session when session ID unchanged', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    const session = createMockSession(true)
    sessionStore.updateSession(session)
    hoisted.getSessionMock.mockResolvedValue({ data: session })

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    // Session should remain the same
    expect(sessionStore.userSession).toEqual(session)
  })

  it('handles errors gracefully by resetting data', async () => {
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession')
    const sessionStore = useSessionStore()
    
    hoisted.getSessionMock.mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const to = createMockRoute('/dashboard', true)
    await redirectAuthGuard(to)

    expect(sessionStore.userSession).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith('Auth guard error:', expect.any(Error))

    consoleSpy.mockRestore()
  })
}

describe('redirectAuthGuard (jsdom)', () => {
  redirectAuthGuardTests()
})

describe('redirectAuthGuard (node)', () => {
  redirectAuthGuardTests()
})
