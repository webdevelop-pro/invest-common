/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirectAuthGuardStatic } from '../redirectAuthGuardStatic'

// ------------------- HOIST-SAFE HELPERS -------------------
const hoisted = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

// ------------------- MOCKS -------------------

const localSessionState = {
  value: undefined as { active?: boolean; id?: string } | undefined,
}
const updateSessionMock = vi.fn()
const resetAllMock = vi.fn()
const oryErrorHandlingMock = vi.fn().mockResolvedValue(undefined)

const setNavigatorOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => online,
  })
}

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    get userSession() {
      return localSessionState.value
    },
    updateSession: updateSessionMock,
    resetAll: resetAllMock,
  }),
}))

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: () => ({
    getSession: hoisted.getSessionMock,
  }),
}))

vi.mock('InvestCommon/domain/config/links', () => ({
  urlAuthenticator: '/authenticator',
}))

vi.mock('InvestCommon/domain/error/oryErrorHandling', () => ({
  oryErrorHandling: (...args: unknown[]) => oryErrorHandlingMock(...args),
}))

const reportErrorMock = vi.fn()
vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: (...args: unknown[]) => reportErrorMock(...args),
  toasterErrorHandling: vi.fn(),
}))

// ------------------- TESTS -------------------

function redirectAuthGuardStaticTests() {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSessionMock.mockResolvedValue(null)
    localSessionState.value = undefined
    updateSessionMock.mockImplementation((session: { active?: boolean; id?: string }) => {
      localSessionState.value = session
    })
    resetAllMock.mockImplementation(() => {
      localSessionState.value = undefined
    })
    setNavigatorOnline(true)
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    })
  })

  it('skips execution during SSR (no window)', async () => {
    const originalWindow = global.window
    // @ts-ignore
    delete global.window

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).not.toHaveBeenCalled()

    global.window = originalWindow
  })

  it('fetches session and updates store when session exists', async () => {
    const session = { id: 's1', active: true }
    hoisted.getSessionMock.mockResolvedValue(session)
    window.location.pathname = '/signin'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(updateSessionMock).toHaveBeenCalledWith(session)
  })

  it('fetches session but does not update store when no session exists', async () => {
    hoisted.getSessionMock.mockResolvedValue(null)
    window.location.pathname = '/signin'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(updateSessionMock).not.toHaveBeenCalled()
    expect(resetAllMock).toHaveBeenCalled()
  })

  it('skips session check on authenticator page', async () => {
    window.location.pathname = '/authenticator'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).not.toHaveBeenCalled()
    expect(updateSessionMock).not.toHaveBeenCalled()
  })

  it('does not skip on root path even if it matches authenticator', async () => {
    const session = { id: 's1' }
    hoisted.getSessionMock.mockResolvedValue(session)
    window.location.pathname = '/'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(updateSessionMock).toHaveBeenCalledWith(session)
  })

  it('works on any path except authenticator', async () => {
    const session = { id: 's1' }
    hoisted.getSessionMock.mockResolvedValue(session)
    window.location.pathname = '/some-other-path'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(updateSessionMock).toHaveBeenCalledWith(session)
  })

  it('keeps the local session while offline', async () => {
    localSessionState.value = { id: 's1', active: true }
    setNavigatorOnline(false)
    window.location.pathname = '/dashboard'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).not.toHaveBeenCalled()
    expect(resetAllMock).not.toHaveBeenCalled()
    expect(localSessionState.value).toEqual({ id: 's1', active: true })
  })

  it('handles session fetch errors gracefully', async () => {
    hoisted.getSessionMock.mockRejectedValue(new Error('Network error'))
    window.location.pathname = '/signin'

    await expect(redirectAuthGuardStatic()).resolves.toBeUndefined()
    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(updateSessionMock).not.toHaveBeenCalled()
  })

  it('keeps the local session when session refresh fails like an offline fetch', async () => {
    localSessionState.value = { id: 's1', active: true }
    hoisted.getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'))
    window.location.pathname = '/dashboard'

    await expect(redirectAuthGuardStatic()).resolves.toBeUndefined()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(resetAllMock).not.toHaveBeenCalled()
    expect(localSessionState.value).toEqual({ id: 's1', active: true })
    expect(oryErrorHandlingMock).not.toHaveBeenCalled()
  })
}

describe('redirectAuthGuardStatic (jsdom)', { environment: 'jsdom' }, () => {
  redirectAuthGuardStaticTests()
})

describe('redirectAuthGuardStatic (node)', { environment: 'node' }, () => {
  redirectAuthGuardStaticTests()
})
