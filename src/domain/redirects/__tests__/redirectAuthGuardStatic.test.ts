/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirectAuthGuardStatic } from '../redirectAuthGuardStatic'

// ------------------- HOIST-SAFE HELPERS -------------------
const hoisted = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

// ------------------- MOCKS -------------------

const updateSessionMock = vi.fn()

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    updateSession: updateSessionMock,
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

// ------------------- TESTS -------------------

function redirectAuthGuardStaticTests() {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSessionMock.mockResolvedValue(null)
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

  it('handles session fetch errors gracefully', async () => {
    hoisted.getSessionMock.mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.location.pathname = '/signin'

    await redirectAuthGuardStatic()

    expect(hoisted.getSessionMock).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('Auth guard error:', expect.any(Error))
    expect(updateSessionMock).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
}

describe('redirectAuthGuardStatic (jsdom)', { environment: 'jsdom' }, () => {
  redirectAuthGuardStaticTests()
})

describe('redirectAuthGuardStatic (node)', { environment: 'node' }, () => {
  redirectAuthGuardStaticTests()
})
