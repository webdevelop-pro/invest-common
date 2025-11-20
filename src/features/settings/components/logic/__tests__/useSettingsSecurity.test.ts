import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import type { ISession } from 'InvestCommon/types/api/auth';

// ------------------- HOIST-SAFE HELPERS -------------------
const hoisted = vi.hoisted(() => ({
  getAllSessionMock: vi.fn(),
  deleteAllSessionMock: vi.fn(),
  deleteOneSessionMock: vi.fn(),
}))

// ------------------- MOCKS -------------------

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  getAll: vi.fn(() => ({})),
}

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => mockCookies,
}))

vi.mock('InvestCommon/data/service/apiClient', () => {
  class MockApiClient {
    get(path: string, config?: unknown) {
      return hoisted.getAllSessionMock(path, config)
    }

    delete(url: string, ...args: unknown[]) {
      if (url === '/sessions') {
        return hoisted.deleteAllSessionMock(url, ...args)
      }
      return hoisted.deleteOneSessionMock(url, ...args)
    }
  }

  return {
    ApiClient: MockApiClient,
  }
})

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    KRATOS_URL: 'https://kratos.example.com',
  },
}))

// ------------------- HELPERS -------------------

const createMockSession = (id: string, authenticatedAt: string, devices: any[] = []): ISession => ({
  id,
  active: true,
  expires_at: '2024-12-31T23:59:59Z',
  authenticated_at: authenticatedAt,
  authentication_methods: [],
  authenticator_assurance_level: 'aal1',
  identity: {
    id: 'i1',
    traits: {},
    created_at: '2024-01-01T00:00:00Z',
    credentials: {},
    recovery_addresses: [],
    schema_id: 'default',
    schema_url: '',
    state: 'active',
    state_changed_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    verifiable_addresses: [],
  },
  issued_at: '2024-01-01T00:00:00Z',
  devices,
  tikenized: '',
} as unknown as ISession)

import { useSettingsSecurity } from '../useSettingsSecurity';

describe('useSettingsSecurity', () => {
  let composable: ReturnType<typeof useSettingsSecurity>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession');
    const { useRepositorySettings } = await import('InvestCommon/data/settings/settings.repository');
    
    const sessionStore = useSessionStore();
    const settingsRepository = useRepositorySettings();
    
    // Set up initial session
    const currentSession = createMockSession(
      'session-123',
      '2024-01-01T10:00:00Z',
      [
        {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ]
    );
    sessionStore.updateSession(currentSession);
    
    // Set up mock API responses
    const otherSession = createMockSession(
      'session-456',
      '2024-01-01T09:00:00Z',
      [
        {
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/120.0.0.0'
        }
      ]
    );
    
    hoisted.getAllSessionMock.mockResolvedValue({ data: [otherSession] });
    hoisted.deleteAllSessionMock.mockResolvedValue({ data: undefined });
    hoisted.deleteOneSessionMock.mockResolvedValue({ data: 'Session deleted' });
    
    // Initialize repository state
    await settingsRepository.getAllSession();
    
    composable = useSettingsSecurity();
    await nextTick();
  });

  describe('Activity Body', () => {
    it('should format current session and mark first item as current', () => {
      const activityBody = composable.activityBody.value;
      
      expect(activityBody.length).toBeGreaterThan(0);
      const currentSessionDevices = activityBody.filter((item: any) => item.current === true);
      expect(currentSessionDevices.length).toBeGreaterThan(0);
      expect(currentSessionDevices[0].id).toBe('session-123');
    });
  });

  describe('Session Management Methods', () => {
    describe('onFinishAllSessions', () => {
      it('should delete all sessions and refresh', async () => {
        await composable.onFinishAllSessions();
        
        expect(hoisted.deleteAllSessionMock).toHaveBeenCalled();
        expect(hoisted.getAllSessionMock).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        hoisted.deleteAllSessionMock.mockRejectedValueOnce(new Error('Delete failed'));
        
        await expect(composable.onFinishAllSessions()).rejects.toThrow('Delete failed');
        
        // getAllSession should not be called if delete fails
        const getAllCallCount = hoisted.getAllSessionMock.mock.calls.length;
        hoisted.deleteAllSessionMock.mockRejectedValueOnce(new Error('Delete failed'));
        try {
          await composable.onFinishAllSessions();
        } catch {
          // Expected to throw
        }
        expect(hoisted.getAllSessionMock.mock.calls.length).toBe(getAllCallCount);
      });
    });

    describe('onDeleteSession', () => {
      it('should delete specific session and refresh', async () => {
        const sessionId = 'session-123';
        
        await composable.onDeleteSession(sessionId);
        
        expect(composable.onDeleteId.value).toBe(sessionId);
        expect(hoisted.deleteOneSessionMock).toHaveBeenCalled();
        expect(hoisted.getAllSessionMock).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        hoisted.deleteOneSessionMock.mockRejectedValueOnce(new Error('Delete failed'));
        
        await expect(composable.onDeleteSession('session-123')).rejects.toThrow('Delete failed');
        
        // getAllSession should not be called if delete fails
        const getAllCallCount = hoisted.getAllSessionMock.mock.calls.length;
        hoisted.deleteOneSessionMock.mockRejectedValueOnce(new Error('Delete failed'));
        try {
          await composable.onDeleteSession('session-123');
        } catch {
          // Expected to throw
        }
        expect(hoisted.getAllSessionMock.mock.calls.length).toBe(getAllCallCount);
      });
    });
  });

  describe('Computed Properties Reactivity', () => {
    it('should react to user session changes', async () => {
      const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession');
      const sessionStore = useSessionStore();
      
      const initialActivityBody = composable.activityBody.value;
      
      const newSession = createMockSession(
        'session-new',
        '2024-01-02T10:00:00Z',
        [
          {
            ip_address: '192.168.1.10',
            user_agent: 'New Browser'
          }
        ]
      );
      sessionStore.updateSession(newSession);
      
      await nextTick();
      
      const newActivityBody = composable.activityBody.value;
      expect(newActivityBody).not.toEqual(initialActivityBody);
      const currentDevices = newActivityBody.filter((item: any) => item.current === true);
      expect(currentDevices[0].id).toBe('session-new');
    });

    it('should react to all sessions data changes', async () => {
      const { useRepositorySettings } = await import('InvestCommon/data/settings/settings.repository');
      const settingsRepository = useRepositorySettings();
      
      const initialActivityBody = composable.activityBody.value;
      
      const updatedSession = createMockSession(
        'session-updated',
        '2024-01-02T11:00:00Z',
        [
          {
            ip_address: '192.168.1.100',
            user_agent: 'Updated Browser'
          }
        ]
      );
      
      hoisted.getAllSessionMock.mockResolvedValueOnce({ data: [updatedSession] });
      await settingsRepository.getAllSession();
      
      await nextTick();
      
      const newActivityBody = composable.activityBody.value;
      expect(newActivityBody).not.toEqual(initialActivityBody);
      const otherDevices = newActivityBody.filter((item: any) => item.current !== true);
      expect(otherDevices.length).toBeGreaterThan(0);
    });
  });
});
