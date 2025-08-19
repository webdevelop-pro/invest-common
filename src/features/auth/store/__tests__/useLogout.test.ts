import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { redirectAfterLogout } from 'InvestCommon/domain/redirects/redirectAfterLogout';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import { useLogoutStore } from '../useLogout';
import { SELFSERVICE } from '../type';

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
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
    const getAuthFlowState = ref({ error: null, data: { logout_token: 'test-token' } });
    const getLogoutState = ref({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockResolvedValue({}),
      getLogout: vi.fn().mockResolvedValue({}),
      getAuthFlowState,
      getLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await store.logoutHandler();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('test-token');
    expect(redirectAfterLogout).toHaveBeenCalled();
    expect(resetAllData).toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should extract token from logout_url if logout_token is not present', async () => {
    const getAuthFlowState = ref({ 
      error: null, 
      data: { logout_url: 'https://example.com/logout?token=url-token' } 
    });
    const getLogoutState = ref({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockResolvedValue({}),
      getLogout: vi.fn().mockResolvedValue({}),
      getAuthFlowState,
      getLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await store.logoutHandler();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('url-token');
    expect(redirectAfterLogout).toHaveBeenCalled();
    expect(resetAllData).toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should handle auth flow error', async () => {
    const getAuthFlowState = ref({ error: 'Auth flow error', data: null });
    const getLogoutState = ref({ error: null, data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockResolvedValue({}),
      getLogout: vi.fn(),
      getAuthFlowState,
      getLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await store.logoutHandler();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).not.toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it('should handle logout state error', async () => {
    const getAuthFlowState = ref({ error: null, data: { logout_token: 'test-token' } });
    const getLogoutState = ref({ error: 'Logout error', data: null });

    const mockAuthRepository = {
      getAuthFlow: vi.fn().mockResolvedValue({}),
      getLogout: vi.fn().mockResolvedValue({}),
      getAuthFlowState,
      getLogoutState,
    };

    (useRepositoryAuth as any).mockReturnValue(mockAuthRepository);

    const store = useLogoutStore();
    await store.logoutHandler();

    expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.logout);
    expect(mockAuthRepository.getLogout).toHaveBeenCalledWith('test-token');
    expect(redirectAfterLogout).not.toHaveBeenCalled();
    expect(resetAllData).not.toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });
});
