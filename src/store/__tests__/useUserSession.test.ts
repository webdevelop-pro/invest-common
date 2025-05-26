import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useUserSession } from '../useUserSession';
import { ISession } from '@/types/api/auth';

// Mock useCookies
vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: vi.fn(),
}));

const createMockSession = (active: boolean): ISession => ({
  active,
  authenticated_at: '2024-01-01T00:00:00Z',
  authentication_methods: [],
  authenticator_assurance_level: 'aal1',
  expires_at: '2024-12-31T23:59:59Z',
  id: 'mock-session-id',
  identity: {
    id: 'mock-identity-id',
    schema_id: 'default',
    schema_url: 'http://example.com/schemas/default',
    state: 'active',
    state_changed_at: '2024-01-01T00:00:00Z',
    credentials: {
      property1: {
        config: {},
        created_at: '2024-01-01T00:00:00Z',
        identifiers: ['test@example.com'],
        type: 'password',
        updated_at: '2024-01-01T00:00:00Z',
      },
      property2: {
        config: {},
        created_at: '2024-01-01T00:00:00Z',
        identifiers: ['test@example.com'],
        type: 'oidc',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    traits: {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      country: 'US',
      city: 'New York',
      address: '123 Main St',
      address2: 'Apt 4B',
      state: 'NY',
      zip: '10001',
    },
    verifiable_addresses: [{
      id: 'mock-address-id',
      value: 'test@example.com',
      verified: true,
      verified_at: '2024-01-01T00:00:00Z',
      via: 'email',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }],
    recovery_addresses: [{
      id: 'mock-recovery-id',
      value: 'test@example.com',
      via: 'email',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  issued_at: '2024-01-01T00:00:00Z',
  devices: [{
    id: 'mock-device-id',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    location: '',
  }],
  tikenized: 'mock-token',
});

describe('useUserSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with undefined session when no cookie exists', () => {
      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        remove: vi.fn(),
      });

      const store = useUserSession();
      expect(store.userSession).toBeUndefined();
      expect(store.userLoggedIn).toBe(false);
    });

    it('should initialize with session from cookie', () => {
      const mockSession = createMockSession(true);

      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(mockSession),
        set: vi.fn(),
        remove: vi.fn(),
      });

      const store = useUserSession();
      expect(store.userSession).toEqual(mockSession);
      expect(store.userLoggedIn).toBe(true);
    });
  });

  describe('updateSession', () => {
    it('should update session and set cookie', () => {
      const mockSetCookie = vi.fn();
      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
        set: mockSetCookie,
        remove: vi.fn(),
      });

      const store = useUserSession();
      const newSession = createMockSession(true);

      store.updateSession(newSession);

      expect(store.userSession).toEqual(newSession);
      expect(mockSetCookie).toHaveBeenCalledWith(
        'session',
        newSession,
        expect.any(Object),
      );
    });
  });

  describe('resetAll', () => {
    it('should clear session and remove cookie', () => {
      const mockRemoveCookie = vi.fn();
      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        remove: mockRemoveCookie,
      });

      const store = useUserSession();
      store.resetAll();

      expect(store.userSession).toBeUndefined();
      expect(mockRemoveCookie).toHaveBeenCalledWith('session', expect.any(Object));
    });
  });

  describe('userLoggedIn computed', () => {
    it('should return true when session is active', () => {
      const mockSession = createMockSession(true);

      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(mockSession),
        set: vi.fn(),
        remove: vi.fn(),
      });

      const store = useUserSession();
      expect(store.userLoggedIn).toBe(true);
    });

    it('should return false when session is inactive', () => {
      const mockSession = createMockSession(false);

      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(mockSession),
        set: vi.fn(),
        remove: vi.fn(),
      });

      const store = useUserSession();
      expect(store.userLoggedIn).toBe(false);
    });

    it('should return false when session is undefined', () => {
      (useCookies as any).mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        remove: vi.fn(),
      });

      const store = useUserSession();
      expect(store.userLoggedIn).toBe(false);
    });
  });
});
