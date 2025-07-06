import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { nextTick } from 'vue';
import { urlSignin, urlAuthenticator } from 'InvestCommon/global/links';
import { redirectAuthGuardStatic } from '../redirectAuthGuardStatic';

// Mock the dependencies
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(() => ({
    getSession: vi.fn(),
  })),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn((store) => ({
    userLoggedIn: { value: store.userLoggedIn },
  })),
}));

vi.mock('InvestCommon/global/links', () => ({
  urlSignin: '/signin',
  urlSignup: '/signup',
  urlAuthenticator: '/authenticator',
  urlForgot: '/forgot',
  urlCheckEmail: '/check-email',
  urlProfile: () => '/profile',
}));

describe('redirectAuthGuardStatic', () => {
  const mockUserSessionStore = {
    userLoggedIn: false,
    updateSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSessionStore as any).mockReturnValue(mockUserSessionStore);
    Object.defineProperty(window, 'location', {
      value: { pathname: '' },
      writable: true,
    });
  });

  it('should fetch session and update store when session exists', async () => {
    const mockGetSession = vi.fn().mockResolvedValue({ id: '123', user: 'test' });
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    window.location.pathname = urlSignin;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockUserSessionStore.updateSession).toHaveBeenCalledWith({ id: '123', user: 'test' });
  });

  it('should fetch session but not update store when no session exists', async () => {
    const mockGetSession = vi.fn().mockResolvedValue(null);
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    window.location.pathname = urlSignin;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockUserSessionStore.updateSession).not.toHaveBeenCalled();
  });

  it('should skip session check on authenticator page', async () => {
    const mockGetSession = vi.fn();
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    window.location.pathname = urlAuthenticator;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockUserSessionStore.updateSession).not.toHaveBeenCalled();
  });

  it('should handle session fetch errors gracefully', async () => {
    const mockGetSession = vi.fn().mockRejectedValue(new Error('Network error'));
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.location.pathname = urlSignin;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Auth guard error:', expect.any(Error));
    expect(mockUserSessionStore.updateSession).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should work on any path except authenticator', async () => {
    const mockGetSession = vi.fn().mockResolvedValue({ id: '123' });
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    window.location.pathname = '/some-other-path';

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockUserSessionStore.updateSession).toHaveBeenCalledWith({ id: '123' });
  });
});
