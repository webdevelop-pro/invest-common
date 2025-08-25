import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn()
}));

vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: vi.fn()
}));

vi.mock('InvestCommon/data/settings/session.formatter', () => ({
  SessionFormatter: vi.fn()
}));

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    onMounted: vi.fn()
  };
});

import { useSettingsSecurity } from '../useSettingsSecurity';

describe('useSettingsSecurity', () => {
  let composable: ReturnType<typeof useSettingsSecurity>;
  let mockSettingsRepository: any;
  let mockUserSession: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    const mockUserSessionRef = ref({
      id: 'session-123',
      authenticated_at: '2024-01-01T10:00:00Z',
      devices: [
        {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ]
    });

    const mockGetAllSessionState = ref({
      data: [
        {
          id: 'session-456',
          devicesFormatted: [
            {
              date: '2024-01-01',
              time: '10:00 AM',
              ip: '192.168.1.2',
              browser: 'Chrome/120.0.0.0',
              id: 'device-456',
              current: false
            }
          ]
        }
      ],
      loading: false,
      error: null
    });

    const mockDeleteOneSessionState = ref({ loading: false, error: null });
    const mockDeleteAllSessionState = ref({ loading: false, error: null });

    mockSettingsRepository = {
      getAllSessionState: mockGetAllSessionState,
      deleteOneSessionState: mockDeleteOneSessionState,
      deleteAllSessionState: mockDeleteAllSessionState,
      deleteAllSession: vi.fn().mockResolvedValue(undefined),
      deleteOneSession: vi.fn().mockResolvedValue(undefined),
      getAllSession: vi.fn().mockResolvedValue(undefined)
    };

    mockUserSession = mockUserSessionRef;

    const { useSessionStore } = await import('InvestCommon/domain/session/store/useSession');
    const { useRepositorySettings } = await import('InvestCommon/data/settings/settings.repository');
    const { SessionFormatter } = await import('InvestCommon/data/settings/session.formatter');
    const { onMounted } = await import('vue');

    vi.mocked(useSessionStore).mockReturnValue({
      userSession: mockUserSessionRef
    } as any);

    vi.mocked(useRepositorySettings).mockReturnValue(mockSettingsRepository);
    
    const mockSessionFormatter = {
      format: vi.fn().mockImplementation(() => {
        const currentUserSession = mockUserSession.value;
        return {
          devicesFormatted: [
            {
              date: currentUserSession.authenticated_at.split('T')[0],
              time: new Date(currentUserSession.authenticated_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              ip: currentUserSession.devices[0]?.ip_address || 'unknown',
              browser: currentUserSession.devices[0]?.user_agent || 'unknown',
              id: currentUserSession.id,
              current: false
            }
          ]
        };
      })
    };
    
    vi.mocked(SessionFormatter).mockImplementation(() => mockSessionFormatter as any);

    vi.mocked(onMounted).mockImplementation((fn: any) => {
      if (fn) fn();
    });
    
    composable = useSettingsSecurity();
  });

  describe('Activity Body', () => {
    it('should format current session and mark first item as current', () => {
      const activityBody = composable.activityBody.value;
      
      expect(activityBody).toHaveLength(2);
      expect(activityBody[0].current).toBe(true);
      expect(activityBody[0].id).toBe('session-123');
      expect(activityBody[1].id).toBe('device-456');
    });
  });

  describe('Session Management Methods', () => {
    describe('onFinishAllSessions', () => {
      it('should delete all sessions and refresh', async () => {
        await composable.onFinishAllSessions();
        
        expect(mockSettingsRepository.deleteAllSession).toHaveBeenCalled();
        expect(mockSettingsRepository.getAllSession).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockSettingsRepository.deleteAllSession.mockRejectedValueOnce(new Error('Delete failed'));
        
        await expect(composable.onFinishAllSessions()).rejects.toThrow('Delete failed');
        
        expect(mockSettingsRepository.getAllSession).not.toHaveBeenCalled();
      });
    });

    describe('onDeleteSession', () => {
      it('should delete specific session and refresh', async () => {
        const sessionId = 'session-123';
        
        await composable.onDeleteSession(sessionId);
        
        expect(composable.onDeleteId.value).toBe(sessionId);
        expect(mockSettingsRepository.deleteOneSession).toHaveBeenCalled();
        expect(mockSettingsRepository.getAllSession).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockSettingsRepository.deleteOneSession.mockRejectedValueOnce(new Error('Delete failed'));
        
        await expect(composable.onDeleteSession('session-123')).rejects.toThrow('Delete failed');
        
        expect(mockSettingsRepository.getAllSession).not.toHaveBeenCalled();
      });
    });
  });

  describe('Computed Properties Reactivity', () => {
    it('should react to user session changes', async () => {
      const initialActivityBody = composable.activityBody.value;
      
      mockUserSession.value = {
        id: 'session-new',
        authenticated_at: '2024-01-02T10:00:00Z',
        devices: [
          {
            ip_address: '192.168.1.10',
            user_agent: 'New Browser'
          }
        ]
      };
      
      await nextTick();
      
      const newActivityBody = composable.activityBody.value;
      expect(newActivityBody).not.toEqual(initialActivityBody);
      expect(newActivityBody[0].id).toBe('session-new');
    });

    it('should react to all sessions data changes', async () => {
      const initialActivityBody = composable.activityBody.value;
      
      mockSettingsRepository.getAllSessionState.value.data = [
        {
          id: 'session-updated',
          devicesFormatted: [
            {
              date: '2024-01-02',
              time: '11:00 AM',
              ip: '192.168.1.100',
              browser: 'Updated Browser',
              id: 'device-updated',
              current: false
            }
          ]
        }
      ];
      
      await nextTick();
      
      const newActivityBody = composable.activityBody.value;
      expect(newActivityBody).not.toEqual(initialActivityBody);
      expect(newActivityBody[1].id).toBe('device-updated');
    });
  });
});
