import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia, storeToRefs } from 'pinia';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { nextTick } from 'vue';
import { useNotifications } from '../useNotifications';

// Mock VFilter component
vi.mock('UiKit/components/VFilter/VFilter.vue', () => ({
  default: {},
}));

// Mock NotificationFormatter
vi.mock('InvestCommon/data/notifications/notifications.formatter', () => ({
  NotificationFormatter: class {
    private notification: any;

    constructor(notification: any) {
      this.notification = notification;
    }

    format() {
      return this.notification;
    }
  },
}));

// Mock storeToRefs
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia');
  return {
    ...actual,
    storeToRefs: (store: any) => {
      const refs: any = {};
      for (const key in store) {
        if (typeof store[key] === 'function') {
          refs[key] = store[key];
        } else if (store[key] && typeof store[key] === 'object' && 'value' in store[key]) {
          refs[key] = store[key];
        } else {
          refs[key] = { value: store[key] };
        }
      }
      return refs;
    },
  };
});

// Mock the dependencies
vi.mock('InvestCommon/data/notifications/notifications.repository', () => ({
  useRepositoryNotifications: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

describe('useNotifications Store', () => {
  let mockGetAll: ReturnType<typeof vi.fn>;
  let mockMarkAllAsRead: ReturnType<typeof vi.fn>;
  let mockMarkAsReadById: ReturnType<typeof vi.fn>;
  let store: ReturnType<typeof useNotifications>;

  // Helper function to set up store with data loaded
  const setupStoreWithData = async () => {
    await store.loadData();
    // Directly set isLoading to false since the watcher might not trigger in tests
    store.isLoading = false;
    await nextTick();
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Create mock functions
    mockGetAll = vi.fn();
    mockMarkAllAsRead = vi.fn();
    mockMarkAsReadById = vi.fn();

    // Mock the repository response with proper structure
    vi.mocked(useRepositoryNotifications).mockReturnValue({
      formattedNotifications: {
        value: [
          { type: 'investment', status: 'unread', content: 'Test investment' },
          { type: 'profile', status: 'read', content: 'Test profile' },
        ],
      },
      getAllState: {
        value: {
          loading: false,
          error: null,
          data: null,
        },
      },
      markAllAsReadState: {
        value: {
          loading: false,
          error: null,
          data: null,
        },
      },
      markAsReadByIdState: {
        value: {
          loading: false,
          error: null,
          data: null,
        },
      },
      getAll: mockGetAll,
      markAllAsRead: mockMarkAllAsRead,
      markAsReadById: mockMarkAsReadById,
    });

    // Mock the session store with proper structure
    vi.mocked(useSessionStore).mockReturnValue({
      userLoggedIn: { value: true },
    });

    // Create store instance
    store = useNotifications();
  });

  describe('Initial State', () => {
    it('should initialize with default values', async () => {
      await store.loadData();
      await nextTick();

      expect(store.isLoading).toBe(true);
      expect(store.currentTab).toBe('all');
      expect(store.search).toBe('');
      expect(store.filterStatus).toEqual([]);
      expect(store.filterType).toEqual([]);
      expect(store.isSidebarOpen).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should handle loading state correctly', async () => {
      vi.mocked(useRepositoryNotifications).mockReturnValue({
        formattedNotifications: { value: [] },
        getAllState: {
          value: {
            loading: true,
            error: null,
            data: null,
          },
        },
        markAllAsReadState: {
          value: {
            loading: false,
            error: null,
            data: null,
          },
        },
        markAsReadByIdState: {
          value: {
            loading: false,
            error: null,
            data: null,
          },
        },
        getAll: mockGetAll,
        markAllAsRead: mockMarkAllAsRead,
        markAsReadById: mockMarkAsReadById,
      });

      store = useNotifications();
      await store.loadData();
      await nextTick();

      expect(store.isLoading).toBe(true);
    });
  });

  describe('Notification Filtering', () => {
    describe('Tab Filtering', () => {
      it('should filter notifications by investments tab', async () => {
        await setupStoreWithData();

        store.currentTab = 'investments';
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].type).toBe('investment');
      });

      it('should filter notifications by accounts tab', async () => {
        await setupStoreWithData();

        store.currentTab = 'accounts';
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].type).toBe('profile');
      });
    });

    describe('Status Filtering', () => {
      it('should filter notifications by unread status', async () => {
        await setupStoreWithData();

        store.filterStatus = ['unread'];
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].status).toBe('unread');
      });

      it('should filter notifications by read status', async () => {
        await setupStoreWithData();

        store.filterStatus = ['read'];
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].status).toBe('read');
      });
    });

    describe('Search Functionality', () => {
      it('should search notifications by content', async () => {
        await setupStoreWithData();

        store.search = 'Test investment';
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].content).toBe('Test investment');
      });

      it('should search notifications by type', async () => {
        await setupStoreWithData();

        store.search = 'investment';
        await nextTick();

        const { tableData } = storeToRefs(store);
        expect(tableData.value).toHaveLength(1);
        expect(tableData.value[0].type).toBe('investment');
      });
    });
  });

  describe('Notification Actions', () => {
    it('should mark all notifications as read', async () => {
      await store.loadData();
      await nextTick();

      await store.markAllAsRead();
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('should mark single notification as read', async () => {
      await store.loadData();
      await nextTick();

      await store.markAsReadById(1);
      expect(mockMarkAsReadById).toHaveBeenCalledWith(1);
    });
  });

  describe('Filter Management', () => {
    it('should apply filters correctly', async () => {
      await setupStoreWithData();

      const mockFilters = [
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: ['Read'],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: ['Investment'],
        },
      ];

      store.onApplyFilter(mockFilters);
      await nextTick();

      expect(store.filterStatus).toEqual(['read']);
      expect(store.filterType).toEqual(['investment']);
    });

    it('should clear filters correctly', async () => {
      await setupStoreWithData();

      // Set initial filters
      store.filterStatus = ['unread'];
      store.filterType = ['investment'];
      store.currentTab = 'investments';
      // Set search last to avoid triggering watch effect prematurely
      store.search = 'test';

      // Clear filters
      store.clearFilterStatus();
      store.clearFilterType();
      store.clearSearch();
      store.clearTab();

      await nextTick();

      expect(store.filterStatus).toEqual([]);
      expect(store.filterType).toEqual([]);
      expect(store.search).toBe('');
      expect(store.currentTab).toBe('all');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar state', async () => {
      // Wait for initial loading to complete
      await setupStoreWithData();

      expect(store.isSidebarOpen).toBe(false);

      store.onSidebarToggle(true);
      expect(store.isSidebarOpen).toBe(true);

      store.onSidebarToggle(false);
      expect(store.isSidebarOpen).toBe(false);
    });
  });
});
