import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { urlSignin } from 'InvestCommon/global/links';
import { computed } from 'vue';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { redirectAuthGuard } from '../redirectAuthGuard';

const mockNavigateWithQueryParams = vi.fn();

// Mock storeToRefs
vi.mock('pinia', () => ({
  storeToRefs: (store: any) => store,
}));

// Mock the dependencies
vi.mock('InvestCommon/store/useUserSession', () => ({
  useUserSession: vi.fn(),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: (...args: any[]) => mockNavigateWithQueryParams(...args),
}));

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(),
}));

describe('redirectAuthGuard', () => {
  const mockNext = vi.fn();
  const mockTo = {
    meta: {},
    path: '/some-protected-route',
    fullPath: '/some-protected-route',
  } as any;
  const mockFrom = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to signin when route requires auth and user is not logged in', async () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Mock repository auth store
    const mockGetSessionState = computed(() => ({
      data: { active: false, error: null },
    }));
    vi.mocked(useRepositoryAuth).mockReturnValue({
      getSessionState: mockGetSessionState,
      getSession: vi.fn(),
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    await redirectAuthGuard(mockTo, mockFrom, mockNext);

    expect(useRepositoryAuth().getSession).toHaveBeenCalled();
    expect(mockNavigateWithQueryParams).toHaveBeenCalledWith(urlSignin, { redirect: '/some-protected-route' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should redirect to signin when session is not active', async () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Mock repository auth store with inactive session
    const mockGetSessionState = computed(() => ({
      data: { active: false, error: null },
    }));
    vi.mocked(useRepositoryAuth).mockReturnValue({
      getSessionState: mockGetSessionState,
      getSession: vi.fn(),
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    await redirectAuthGuard(mockTo, mockFrom, mockNext);

    expect(useRepositoryAuth().getSession).toHaveBeenCalled();
    expect(mockNavigateWithQueryParams).toHaveBeenCalledWith(urlSignin, { redirect: '/some-protected-route' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should redirect to signin when session has error', async () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Mock repository auth store with error
    const mockGetSessionState = computed(() => ({
      data: { active: true, error: 'Session error' },
    }));
    vi.mocked(useRepositoryAuth).mockReturnValue({
      getSessionState: mockGetSessionState,
      getSession: vi.fn(),
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    await redirectAuthGuard(mockTo, mockFrom, mockNext);

    expect(useRepositoryAuth().getSession).toHaveBeenCalled();
    expect(mockNavigateWithQueryParams).toHaveBeenCalledWith(urlSignin, { redirect: '/some-protected-route' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should proceed when route requires auth and user is logged in with active session', async () => {
    // Mock user logged in with computed
    const mockUserLoggedIn = computed(() => true);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Mock repository auth store with active session
    const mockGetSessionState = computed(() => ({
      data: { active: true, error: null },
    }));
    vi.mocked(useRepositoryAuth).mockReturnValue({
      getSessionState: mockGetSessionState,
      getSession: vi.fn(),
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    await redirectAuthGuard(mockTo, mockFrom, mockNext);

    expect(useRepositoryAuth().getSession).toHaveBeenCalled();
    expect(mockNavigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should proceed when route does not require auth regardless of login status', async () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Mock repository auth store
    const mockGetSessionState = computed(() => ({
      data: { active: false, error: null },
    }));
    vi.mocked(useRepositoryAuth).mockReturnValue({
      getSessionState: mockGetSessionState,
      getSession: vi.fn(),
    } as any);

    // Set route to not require auth
    mockTo.meta.requiresAuth = false;

    await redirectAuthGuard(mockTo, mockFrom, mockNext);

    expect(useRepositoryAuth().getSession).toHaveBeenCalled();
    expect(mockNavigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });
});
