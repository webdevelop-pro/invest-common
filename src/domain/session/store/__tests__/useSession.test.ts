import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useSessionStore } from '../useSession';

// Mock useCookies
vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: vi.fn(),
}));

const createMockSession = (active: boolean) => ({
  active,
  expires_at: '2024-12-31T23:59:59Z',
});

describe('useSession', () => {
  let cookies: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    cookies = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };
    (useCookies as any).mockReturnValue(cookies);
  });

  describe('initial state', () => {
    it('should initialize with undefined session when no cookie exists', () => {
      cookies.get.mockReturnValue(undefined);

      const store = useSessionStore();
      expect(store.userSession).toBeUndefined();
      expect(store.userLoggedIn).toBe(false);
    });

    it('should initialize with session from cookie', () => {
      const mockSession = createMockSession(true);
      cookies.get.mockReturnValue(mockSession);

      const store = useSessionStore();
      expect(store.userSession).toEqual(mockSession);
      expect(store.userLoggedIn).toBe(true);
    });
  });

  describe('updateSession', () => {
    it('should update session and set cookie', () => {
      const store = useSessionStore();
      const newSession = createMockSession(true);

      store.updateSession(newSession);

      expect(store.userSession).toEqual(newSession);
      expect(cookies.set).toHaveBeenCalledWith(
        'session',
        newSession,
        expect.any(Object),
      );
    });
  });

  describe('resetAll', () => {
    it('should clear session and remove cookie', () => {
      const store = useSessionStore();
      store.resetAll();

      expect(store.userSession).toBeUndefined();
      expect(cookies.remove).toHaveBeenCalledWith('session', expect.any(Object));
    });
  });

  describe('userLoggedIn computed', () => {
    it('should return true when session is active', () => {
      const mockSession = createMockSession(true);
      cookies.get.mockReturnValue(mockSession);

      const store = useSessionStore();
      expect(store.userLoggedIn).toBe(true);
    });

    it('should return false when session is inactive', () => {
      const mockSession = createMockSession(false);
      cookies.get.mockReturnValue(mockSession);

      const store = useSessionStore();
      expect(store.userLoggedIn).toBe(false);
    });

    it('should return false when session is undefined', () => {
      cookies.get.mockReturnValue(undefined);

      const store = useSessionStore();
      expect(store.userLoggedIn).toBe(false);
    });
  });
});
