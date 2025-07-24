import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import env from 'InvestCommon/global';
import { redirectAuthGuard } from '../redirectAuthGuard';

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

vi.mock('InvestCommon/domain/resetAllData', () => ({
  resetAllData: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn((store) => ({
    userLoggedIn: { value: store.userLoggedIn },
    userSession: { value: store.userSession },
  })),
  defineStore: vi.fn(() => vi.fn()),
  acceptHMRUpdate: vi.fn(),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => mockProfilesStore,
}));

let mockProfilesStore: any;

describe('redirectAuthGuard', () => {
  const mockTo = {
    meta: { requiresAuth: true },
    fullPath: '/protected-route',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it('should update session and init profiles when valid session exists', async () => {
      const mockSession = { active: true };
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };
      mockProfilesStore = { init: vi.fn() };
      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(mockSession),
      });

      await redirectAuthGuard(mockTo as any);

      expect(mockUserSessionStore.updateSession).toHaveBeenCalledWith(mockSession);
      expect(mockProfilesStore.init).toHaveBeenCalled();
    });

    it('should redirect to signin when no session and route requires auth', async () => {
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };
      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(null),
      });

      await redirectAuthGuard(mockTo as any);

      expect(resetAllData).toHaveBeenCalled();
      expect(navigateWithQueryParams).toHaveBeenCalledWith(urlSignin, {
        redirect: 'http://localhost:3000/protected-route',
      });
    });

    it('should do nothing when no session and route does not require auth', async () => {
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };
      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(null),
      });
      const toWithoutAuth = { ...mockTo, meta: { requiresAuth: false } };

      await redirectAuthGuard(toWithoutAuth as any);

      expect(resetAllData).not.toHaveBeenCalled();
      expect(navigateWithQueryParams).not.toHaveBeenCalled();
    });
  });

  describe('authenticated user', () => {
    it('should reset data when no session data exists', async () => {
      const mockUserSessionStore = {
        userLoggedIn: true,
        userSession: null,
      };
      (useSessionStore as any).mockReturnValue(mockUserSessionStore);

      await redirectAuthGuard(mockTo as any);

      expect(resetAllData).toHaveBeenCalled();
    });

    it('should do nothing when session data exists', async () => {
      const mockUserSessionStore = {
        userLoggedIn: true,
        userSession: { id: 1 },
      };
      (useSessionStore as any).mockReturnValue(mockUserSessionStore);

      await redirectAuthGuard(mockTo as any);

      expect(resetAllData).not.toHaveBeenCalled();
    });
  });
});
