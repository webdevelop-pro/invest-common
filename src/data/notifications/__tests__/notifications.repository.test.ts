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
    expect(store.isLoadingGetAll).toBe(false);
    expect(store.error).toBeNull();
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
    expect(store.error).toBe(mockError);
    expect(store.isLoadingGetAll).toBe(false);
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
    expect(store.isLoadingMarkAll).toBe(false);
    expect(store.error).toBeNull();
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
    expect(store.error).toBe(mockError);
    expect(store.isLoadingMarkAll).toBe(false);
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
    expect(store.isLoadingMarkById).toBe(false);
    expect(store.error).toBeNull();
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
    expect(store.error).toBe(mockError);
    expect(store.isLoadingMarkById).toBe(false);
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

    const { buttonHref, ...notificationWithoutHref } = store.formattedNotifications[0];
    expect(notificationWithoutHref).toEqual({
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
      tagText: 'Investment_completed',
      isUnread: true,
      buttonTo: {
        name: 'ROUTE_INVESTMENT_TIMELINE',
        params: {
          id: 123,
          profileId: 456,
        },
      },
    });
  });
});
