import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { nextTick } from 'vue';
import { urlSignin } from 'InvestCommon/global/links';
import { redirectAuthGuardStatic } from '../redirectAuthGuardStatic';

// Mock the dependencies
vi.mock('InvestCommon/store/useUserSession', () => ({
  useUserSession: vi.fn(),
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUserSession as any).mockReturnValue(mockUserSessionStore);
    Object.defineProperty(window, 'location', {
      value: { pathname: '' },
      writable: true,
    });
  });

  it('should fetch session when user is not logged in', async () => {
    const mockGetSession = vi.fn();
    (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
    mockUserSessionStore.userLoggedIn = false;
    window.location.pathname = urlSignin;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(mockGetSession).toHaveBeenCalled();
  });

  it('should redirect to profile when user is logged in and on protected path', async () => {
    mockUserSessionStore.userLoggedIn = true;
    window.location.pathname = urlSignin;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(navigateWithQueryParams).toHaveBeenCalledWith('/profile');
  });

  it('should not redirect when user is logged in and not on protected path', async () => {
    mockUserSessionStore.userLoggedIn = true;
    window.location.pathname = '/some-other-path';

    await redirectAuthGuardStatic();
    await nextTick();

    expect(navigateWithQueryParams).not.toHaveBeenCalled();
  });

  it('should handle URL parsing errors gracefully', async () => {
    const invalidUrl = 'not-a-valid-url';
    window.location.pathname = invalidUrl;
    mockUserSessionStore.userLoggedIn = true;

    await redirectAuthGuardStatic();
    await nextTick();

    expect(navigateWithQueryParams).not.toHaveBeenCalled();
  });

  describe('login state changes', () => {
    it('should fetch session when user is not logged in', async () => {
      const mockGetSession = vi.fn();
      (useRepositoryAuth as any).mockReturnValue({ getSession: mockGetSession });
      mockUserSessionStore.userLoggedIn = false;
      window.location.pathname = urlSignin;

      await redirectAuthGuardStatic();
      await nextTick();

      expect(mockGetSession).toHaveBeenCalled();
    });

    it('should redirect to profile when user becomes logged in on protected path', async () => {
      mockUserSessionStore.userLoggedIn = true;
      window.location.pathname = urlSignin;

      await redirectAuthGuardStatic();
      await nextTick();

      expect(navigateWithQueryParams).toHaveBeenCalledWith('/profile');
    });

    it('should not redirect when user becomes logged in on non-protected path', async () => {
      mockUserSessionStore.userLoggedIn = true;
      window.location.pathname = '/some-other-path';

      await redirectAuthGuardStatic();
      await nextTick();

      expect(navigateWithQueryParams).not.toHaveBeenCalled();
    });
  });
});
