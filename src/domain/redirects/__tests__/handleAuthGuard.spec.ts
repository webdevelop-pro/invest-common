import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { urlSignin } from 'InvestCommon/global/links';
import { computed } from 'vue';
import { handleAuthGuard } from '../redirectAuthGuard';

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

describe('handleAuthGuard', () => {
  const mockNext = vi.fn();
  const mockTo = {
    meta: {},
    path: '/some-protected-route',
  } as any;
  const mockFrom = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to signin when route requires auth and user is not logged in', () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    handleAuthGuard(mockTo, mockFrom, mockNext);

    expect(mockNavigateWithQueryParams).toHaveBeenCalledWith(urlSignin, { redirect: '/some-protected-route' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should proceed when route requires auth and user is logged in', () => {
    // Mock user logged in with computed
    const mockUserLoggedIn = computed(() => true);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Set route to require auth
    mockTo.meta.requiresAuth = true;

    handleAuthGuard(mockTo, mockFrom, mockNext);

    expect(mockNavigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should proceed when route does not require auth regardless of login status', () => {
    // Mock user not logged in with computed
    const mockUserLoggedIn = computed(() => false);
    vi.mocked(useUserSession).mockReturnValue({
      userLoggedIn: mockUserLoggedIn,
    } as any);

    // Set route to not require auth
    mockTo.meta.requiresAuth = false;

    handleAuthGuard(mockTo, mockFrom, mockNext);

    expect(mockNavigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });
});
