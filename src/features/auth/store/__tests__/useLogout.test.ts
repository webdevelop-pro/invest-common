import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { redirectAfterLogout } from 'InvestCommon/domain/redirects/redirectAfterLogout';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import { useLogoutStore } from '../useLogout';
import { SELFSERVICE } from '../type';

// Mock the dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(),
}));

vi.mock('InvestCommon/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

vi.mock('InvestCommon/domain/redirects/redirectAfterLogout', () => ({
  redirectAfterLogout: vi.fn(),
}));

vi.mock('InvestCommon/domain/resetAllData', () => ({
  resetAllData: vi.fn(),
}));

describe('useLogoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should handle successful logout flow', async () => {
    // Mock repository responses
    const getAuthFlowState = ref<{
      error: string | null;
      data: { logout_token: string } | null }
    >({ error: null, data: null });
    const setLogoutState = ref<{
      error: string | null; 
      data: { status: number } | null }
    >({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => { setTimeout(resolve, 0); });
        getAuthFlowState.value = {
          error: null,
          data: { logout_token: 'test-token' },
        };
        await nextTick();
      }),
      getLogout: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => { setTimeout(resolve, 0); });
        setLogoutState.value = {
          error: null,
          data: { status: 200 },
        };
        await nextTick();
      }),
      getAuthFlowState,
      setLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await nextTick();

    // Call logout handler and wait for all async operations
    await store.logoutHandler();
    await nextTick();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('test-token');
    expect(redirectAfterLogout).toHaveBeenCalled();
    expect(resetAllData).toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should extract token from logout_url if logout_token is not present', async () => {
    const getAuthFlowState = ref<{
      error: string | null;
      data: { logout_url: string } | null }
    >({ error: null, data: null });
    const setLogoutState = ref<{
      error: string | null;
      data: { status: number } | null }
    >({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => { setTimeout(resolve, 0); });
        getAuthFlowState.value = {
          error: null,
          data: { logout_url: 'https://example.com/logout?token=url-token' },
        };
        await nextTick();
      }),
      getLogout: vi.fn().mockImplementation(async (token) => {
        // Simulate async state update
        await new Promise((resolve) => { setTimeout(resolve, 0); });
        if (token === 'url-token') {
          setLogoutState.value = {
            error: null,
            data: { status: 200 },
          };
          await nextTick();
        }
      }),
      getAuthFlowState,
      setLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await nextTick();

    // Call logout handler and wait for all async operations
    await store.logoutHandler();
    await nextTick();

    // Verify the complete flow
    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('url-token');
    expect(redirectAfterLogout).toHaveBeenCalled();
    expect(resetAllData).toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should handle auth flow error', async () => {
    const getAuthFlowState = ref<{
      error: string | null;
      data: { logout_url: string } | null }
    >({ error: null, data: null });
    const setLogoutState = ref<{
      error: string | null;
      data: { status: number } | null }
    >({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => setTimeout(resolve, 0));
        getAuthFlowState.value = {
          error: 'Auth flow error',
          data: null,
        };
        await nextTick();
      }),
      getLogout: vi.fn(),
      getAuthFlowState,
      setLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await nextTick();

    // Call logout handler and wait for all async operations
    await store.logoutHandler();
    await nextTick();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).not.toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should handle logout state error', async () => {
    const getAuthFlowState = ref<{
      error: string | null;
      data: { logout_token: string } | null }
    >({ error: null, data: null });
    const setLogoutState = ref<{
      error: string | null;
      data: { status: number } | null }
    >({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => setTimeout(resolve, 0));
        getAuthFlowState.value = {
          error: null,
          data: { logout_token: 'test-token' },
        };
        await nextTick();
      }),
      getLogout: vi.fn().mockImplementation(async () => {
        // Simulate async state update
        await new Promise((resolve) => setTimeout(resolve, 0));
        setLogoutState.value = {
          error: 'Logout error',
          data: null,
        };
        await nextTick();
      }),
      getAuthFlowState,
      setLogoutState,
      flowId: { value: 'test-flow-id' },
      csrfToken: { value: 'test-csrf-token' },
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await nextTick();

    // Call logout handler and wait for all async operations
    await store.logoutHandler();
    await nextTick();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('test-token');
    expect(useGlobalLoader().show).not.toHaveBeenCalled();
    expect(redirectAfterLogout).toHaveBeenCalled();
    expect(resetAllData).toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });
});
