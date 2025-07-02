import { setActivePinia, createPinia } from 'pinia';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { useRepositoryNotifications } from '../notifications.repository';

// Mock ApiClient
vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
    put: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock toaster error handling
vi.mock('InvestCommon/data/repository/error/toasterErrorHandling', () => ({
  toasterErrorHandling: vi.fn(),
}));

// Mock createActionState
vi.mock('InvestCommon/data/repository/repository', () => ({
  createActionState: vi.fn().mockImplementation(() => ({
    value: {
      data: undefined,
      loading: false,
      error: null,
    },
  })),
}));

// Mock NotificationFormatter
vi.mock('../notifications.formatter', () => ({
  NotificationFormatter: vi.fn().mockImplementation((notification) => ({
    format: () => ({
      ...notification,
      isNotificationInvestment: notification.type.toLowerCase().includes('investment'),
      isNotificationDocument: notification.type.toLowerCase().includes('document'),
      isNotificationSystem: notification.type.toLowerCase().includes('system'),
      isNotificationWallet: notification.type.toLowerCase().includes('wallet'),
      isNotificationProfile: notification.type.toLowerCase().includes('profile'),
      isNotificationUser: notification.type.toLowerCase().includes('user'),
      objectId: notification.data?.fields?.object_id || 0,
      profileId: notification.data?.fields?.profile?.ID || notification.data?.fields?.object_id || 0,
      kycDeclined: notification.data?.fields?.kyc_status === 'declined',
      accreditationDeclined: notification.data?.fields?.accreditation_status === 'declined',
      accreditationExpired: notification.data?.fields?.accreditation_status === 'expired',
      isStart: notification.data?.fields?.profile?.kyc_status === 'new',
      isFundsFailed: notification.data?.fields?.funding_status === 'failed',
      tagBackground: notification.type.toLowerCase().includes('investment') ? 'secondary-light' : 'default',
      buttonText: 'See More Details',
      tagText: notification.type,
      isUnread: notification.status.toLowerCase() === 'unread',
      buttonTo: {
        name: 'ROUTE_INVESTMENT_TIMELINE',
        params: {
          id: notification.data?.fields?.object_id || 0,
          profileId: notification.data?.fields?.profile?.ID || notification.data?.fields?.object_id || 0,
        },
      },
      buttonHref: '/test-href',
    }),
  })),
}));

describe('Notifications Repository', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should fetch notifications successfully', async () => {
    const mockNotifications = [
      { id: 1, type: 'investment_completed', status: 'unread' },
      { id: 2, type: 'document_review', status: 'read' },
    ];

    const mockGet = vi.fn().mockImplementation(() => Promise.resolve({ data: mockNotifications }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: mockGet,
      put: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    }));

    const store = useRepositoryNotifications();
    const result = await store.getAll();

    expect(result).toEqual(mockNotifications);
    expect(store.notifications).toEqual(mockNotifications);
    expect(store.getAllState.value.loading).toBe(false);
    expect(store.getAllState.value.error).toBeNull();
    expect(store.getAllState.value.data).toEqual(mockNotifications);
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Network error');
    const mockGet = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: mockGet,
      put: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    }));

    const store = useRepositoryNotifications();

    await expect(store.getAll()).rejects.toThrow(mockError);
    expect(store.getAllState.value.error).toBe(mockError);
    expect(store.getAllState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch notifications');
  });

  it('should mark all notifications as read', async () => {
    const mockNotifications = [
      { id: 1, type: 'investment_completed', status: 'unread' },
      { id: 2, type: 'document_review', status: 'unread' },
    ];

    const mockPut = vi.fn().mockImplementation(() => Promise.resolve({ data: {} }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      put: mockPut,
    }));

    const store = useRepositoryNotifications();
    store.notifications = mockNotifications;

    await store.markAllAsRead();

    expect(store.notifications).toEqual([
      { id: 1, type: 'investment_completed', status: 'read' },
      { id: 2, type: 'document_review', status: 'read' },
    ]);
    expect(store.markAllAsReadState.value.loading).toBe(false);
    expect(store.markAllAsReadState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should handle mark all as read error', async () => {
    const mockError = new Error('Failed to mark all notifications as read');
    const mockPut = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      put: mockPut,
    }));

    const store = useRepositoryNotifications();

    await expect(store.markAllAsRead()).rejects.toThrow(mockError);
    expect(store.markAllAsReadState.value.error).toBe(mockError);
    expect(store.markAllAsReadState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to mark all notifications as read');
  });

  it('should mark single notification as read', async () => {
    const mockNotifications = [
      { id: 1, type: 'investment_completed', status: 'unread' },
      { id: 2, type: 'document_review', status: 'unread' },
    ];

    const mockPut = vi.fn().mockImplementation(() => Promise.resolve({ data: {} }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      put: mockPut,
    }));

    const store = useRepositoryNotifications();
    store.notifications = mockNotifications;

    await store.markAsReadById(1);

    expect(store.notifications).toEqual([
      { id: 1, type: 'investment_completed', status: 'read' },
      { id: 2, type: 'document_review', status: 'unread' },
    ]);
    expect(store.markAsReadByIdState.value.loading).toBe(false);
    expect(store.markAsReadByIdState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should handle mark single notification as read error', async () => {
    const mockError = new Error('Failed to mark notification as read');
    const mockPut = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      put: mockPut,
    }));

    const store = useRepositoryNotifications();

    await expect(store.markAsReadById(1)).rejects.toThrow(mockError);
    expect(store.markAsReadByIdState.value.error).toBe(mockError);
    expect(store.markAsReadByIdState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to mark notification as read');
  });

  it('should format notifications correctly', () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'investment_completed',
        status: 'unread',
        data: {
          fields: {
            object_id: 123,
            profile: { ID: 456 },
          },
        },
      },
    ];

    const store = useRepositoryNotifications();
    store.notifications = mockNotifications;

    const formattedNotification = store.formattedNotifications[0];
    expect(formattedNotification).toEqual({
      ...mockNotifications[0],
      isNotificationInvestment: true,
      isNotificationDocument: false,
      isNotificationSystem: false,
      isNotificationWallet: false,
      isNotificationProfile: false,
      isNotificationUser: false,
      objectId: 123,
      profileId: 456,
      kycDeclined: false,
      accreditationDeclined: false,
      accreditationExpired: false,
      isStart: false,
      isFundsFailed: false,
      tagBackground: 'secondary-light',
      buttonText: 'See More Details',
      tagText: 'investment_completed',
      isUnread: true,
      buttonTo: {
        name: 'ROUTE_INVESTMENT_TIMELINE',
        params: {
          id: 123,
          profileId: 456,
        },
      },
      buttonHref: '/test-href',
    });
  });

  it('should reset all data correctly', () => {
    const store = useRepositoryNotifications();
    
    // Set some initial state
    store.notifications = [{ id: 1, type: 'test', status: 'unread' }];
    store.getAllState.value = { loading: true, error: new Error('test'), data: [{ id: 1 }] };
    store.markAllAsReadState.value = { loading: true, error: new Error('test'), data: undefined };
    store.markAsReadByIdState.value = { loading: true, error: new Error('test'), data: undefined };
    
    store.resetAll();
    
    expect(store.notifications).toEqual([]);
    expect(store.getAllState.value).toEqual({ loading: false, error: null, data: null });
    expect(store.markAllAsReadState.value).toEqual({ loading: false, error: null, data: null });
    expect(store.markAsReadByIdState.value).toEqual({ loading: false, error: null, data: null });
  });

  it('should reset data correctly', () => {
    const store = useRepositoryNotifications();
    
    // Set some initial state
    store.notifications = [{ id: 1, type: 'test', status: 'unread' }];
    store.getAllState.value.data = [{ id: 1 }];
    store.getAllState.value.loading = true;
    store.getAllState.value.error = new Error('test');
    store.markAllAsReadState.value.data = undefined;
    store.markAllAsReadState.value.loading = true;
    store.markAllAsReadState.value.error = new Error('test');
    store.markAsReadByIdState.value.data = undefined;
    store.markAsReadByIdState.value.loading = true;
    store.markAsReadByIdState.value.error = new Error('test');
    
    store.reset();
    
    expect(store.notifications).toEqual([]);
    expect(store.getAllState.value.data).toBeUndefined();
    expect(store.getAllState.value.loading).toBe(false);
    expect(store.getAllState.value.error).toBeNull();
    expect(store.markAllAsReadState.value.data).toBeUndefined();
    expect(store.markAllAsReadState.value.loading).toBe(false);
    expect(store.markAllAsReadState.value.error).toBeNull();
    expect(store.markAsReadByIdState.value.data).toBeUndefined();
    expect(store.markAsReadByIdState.value.loading).toBe(false);
    expect(store.markAsReadByIdState.value.error).toBeNull();
  });

  it('should update notifications data correctly', () => {
    const store = useRepositoryNotifications();
    const initialNotifications = [{ id: 1, type: 'test', status: 'unread' }];
    store.notifications = [...initialNotifications];
    
    const newNotification = { id: 2, type: 'new_test', status: 'unread' };
    const notificationData = JSON.stringify(newNotification);
    
    store.updateNotificationsData(notificationData);
    
    expect(store.notifications).toEqual([newNotification, ...initialNotifications]);
  });
});
