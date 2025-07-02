import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { redirectAuthGuard } from '../redirectAuthGuard';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import env from 'InvestCommon/global';

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
}));

describe('redirectAuthGuard', () => {
  const mockNext = vi.fn();
  const mockTo = {
    meta: { requiresAuth: true },
    fullPath: '/protected-route',
  };
  const mockFrom = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it('should update session and continue when valid session exists', async () => {
      const mockSession = { active: true };
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };

      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(mockSession),
      });

      await redirectAuthGuard(mockTo as any, mockFrom as any, mockNext);

      expect(mockUserSessionStore.updateSession).toHaveBeenCalledWith(mockSession);
      expect(mockNext).toHaveBeenCalled();
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

      await redirectAuthGuard(mockTo as any, mockFrom as any, mockNext);

      expect(resetAllData).toHaveBeenCalled();
      expect(navigateWithQueryParams).toHaveBeenCalledWith(urlSignin, {
        redirect: 'http://localhost:3000/protected-route',
      });
    });

    it('should continue when no session and route does not require auth', async () => {
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };

      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(null),
      });

      const toWithoutAuth = { ...mockTo, meta: { requiresAuth: false } };

      await redirectAuthGuard(toWithoutAuth as any, mockFrom as any, mockNext);

      expect(resetAllData).not.toHaveBeenCalled();
      expect(navigateWithQueryParams).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticated user', () => {
    it('should reset data and continue when no session data exists', async () => {
      const mockUserSessionStore = {
        userLoggedIn: true,
        userSession: null,
      };

      (useSessionStore as any).mockReturnValue(mockUserSessionStore);

      await redirectAuthGuard(mockTo as any, mockFrom as any, mockNext);

      expect(resetAllData).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue when session data exists', async () => {
      const mockUserSessionStore = {
        userLoggedIn: true,
        userSession: { id: 1 },
      };

      (useSessionStore as any).mockReturnValue(mockUserSessionStore);

      await redirectAuthGuard(mockTo as any, mockFrom as any, mockNext);

      expect(resetAllData).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const mockUserSessionStore = {
        userLoggedIn: false,
        updateSession: vi.fn(),
      };

      (useSessionStore as any).mockReturnValue(mockUserSessionStore);
      (useRepositoryAuth as any).mockReturnValue({
        getSession: vi.fn().mockRejectedValue(new Error('API Error')),
      });

      await redirectAuthGuard(mockTo as any, mockFrom as any, mockNext);

      expect(resetAllData).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(false);
    });
  });
}); 