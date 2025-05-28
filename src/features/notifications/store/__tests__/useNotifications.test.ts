import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia, storeToRefs } from 'pinia';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useUsersStore } from 'InvestCommon/store/useUsers';
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

vi.mock('InvestCommon/store/useUsers', () => ({
  useUsersStore: vi.fn().mockReturnValue({
    userLoggedIn: { value: true },
    // Add any other required store properties/methods here
  }),
}));

describe('useNotifications', () => {
  let mockGetAll: ReturnType<typeof vi.fn>;
  let mockMarkAllAsRead: ReturnType<typeof vi.fn>;
  let mockMarkAsReadById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Create mock functions
    mockGetAll = vi.fn();
    mockMarkAllAsRead = vi.fn();
    mockMarkAsReadById = vi.fn();

    // Mock the repository response with some notifications
    vi.mocked(useRepositoryNotifications).mockReturnValue({
      formattedNotifications: {
        value: [
          { type: 'investment', status: 'unread', content: 'Test investment' },
          { type: 'profile', status: 'read', content: 'Test profile' },
        ],
      },
      error: { value: null },
      isLoadingGetAll: { value: false },
      getAll: mockGetAll,
      markAllAsRead: mockMarkAllAsRead,
      markAsReadById: mockMarkAsReadById,
    });

    // Mock the users store with proper structure
    const mockUsersStore = {
      userLoggedIn: { value: true },
      // Add any other required store properties/methods here
    };
    vi.mocked(useUsersStore).mockReturnValue(mockUsersStore);
  });

  describe('initial state', () => {
    it('should initialize with default values', async () => {
      // Set up Pinia
      setActivePinia(createPinia());

      // Mock the repository response
      const mockRepository = {
        formattedNotifications: { value: [] },
        error: { value: null },
        isLoadingGetAll: { value: false },
        getAll: vi.fn(),
        markAllAsRead: vi.fn(),
        markAsReadById: vi.fn(),
      };
      vi.mocked(useRepositoryNotifications).mockReturnValue(mockRepository);

      // Mock the users store
      const mockUsersStore = {
        userLoggedIn: { value: true },
      };
      vi.mocked(useUsersStore).mockReturnValue(mockUsersStore);

      // Create store instance
      const store = useNotifications();

      // Initialize store
      await store.loadData();
      await nextTick();

      // Initialize filter settings
      store.filterSettings = [
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: [],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: [],
        },
      ];
      await nextTick();

      // Get store refs
      const {
        filterStatus,
        filterType,
        tableData,
      } = storeToRefs(store);

      // Wait for computed properties to update
      await nextTick();

      // Debug computed properties
      console.log('filterStatus:', filterStatus);
      console.log('filterType:', filterType);
      console.log('tableData:', tableData);

      expect(store.isLoading).toBe(true);
      expect(store.currentTab).toBe('all');
      expect(store.search).toBe('');
      expect(filterStatus.value).toEqual([]);
      expect(filterType.value).toEqual([]);
      expect(store.isSidebarOpen).toBe(false);
    });
  });

  describe('computed properties', () => {
    let store: ReturnType<typeof useNotifications>;
    let mockNotifications: any[];
    let mockGetAll: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      // Set up Pinia
      setActivePinia(createPinia());

      mockNotifications = [
        { type: 'investment', status: 'unread', content: 'Test investment' },
        { type: 'profile', status: 'read', content: 'Test profile' },
      ];

      // Create mock functions
      mockGetAll = vi.fn().mockImplementation(() =>
        // Simulate async data loading
        Promise.resolve(mockNotifications));

      // Mock the repository response with proper ref structure
      const mockRepository = {
        formattedNotifications: { value: mockNotifications },
        error: { value: null },
        isLoadingGetAll: { value: false },
        getAll: mockGetAll,
        markAllAsRead: vi.fn(),
        markAsReadById: vi.fn(),
      };
      vi.mocked(useRepositoryNotifications).mockReturnValue(mockRepository);

      // Mock the users store
      const mockUsersStore = {
        userLoggedIn: { value: true },
      };
      vi.mocked(useUsersStore).mockReturnValue(mockUsersStore);

      // Create store instance
      store = useNotifications();

      // Initialize store with data
      await store.loadData();
      await nextTick();

      // Initialize filter settings
      store.filterSettings = [
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: [],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: [],
        },
      ];
      await nextTick();

      // Reset all state to ensure clean test
      store.currentTab = 'all';
      store.search = '';
      store.filterStatus = [];
      store.filterType = [];
      await nextTick();
    });

    it('should filter notifications by type correctly', async () => {
      // Get store refs
      const { tableData, notificationUserData } = storeToRefs(store);

      // Wait for computed properties to update
      await nextTick();

      // Debug computed properties
      console.log('notificationUserData:', notificationUserData.value);
      console.log('tableData:', tableData.value);

      // Test investments filter
      store.currentTab = 'investments';
      await nextTick();
      expect(tableData.value).toBeDefined();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test accounts filter
      store.currentTab = 'accounts';
      await nextTick();
      expect(tableData.value).toBeDefined();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('profile');

      // Test documents filter
      store.currentTab = 'document';
      await nextTick();
      expect(tableData.value).toBeDefined();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('document');
    });

    it('should filter notifications by status correctly', async () => {
      // Get store refs
      const {
        formattedNotifications,
        notificationUserData,
        tabsData,
        filterData,
        tableData,
      } = storeToRefs(store);

      // Ensure store is properly initialized
      expect(formattedNotifications.value).toBeDefined();
      expect(notificationUserData.value).toBeDefined();
      expect(tabsData.value).toBeDefined();
      expect(filterData.value).toBeDefined();
      expect(tableData.value).toBeDefined();
      expect(tableData.value).toHaveLength(2); // Should have all notifications initially

      // Set filter status
      store.filterStatus = ['unread'];
      await nextTick();

      // Verify filter results
      expect(tableData.value).toBeDefined();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].status).toBe('unread');

      // Test multiple status filters
      store.filterStatus = ['unread', 'read'];
      await nextTick();
      expect(tableData.value).toHaveLength(2);
      expect(tableData.value[0].status).toBe('unread');
      expect(tableData.value[1].status).toBe('read');

      // Test case sensitivity
      store.filterStatus = ['UNREAD'];
      await nextTick();
      expect(tableData.value).toHaveLength(0);

      // Test empty filter
      store.filterStatus = [];
      await nextTick();
      expect(tableData.value).toHaveLength(2);

      // Test filter with tab
      store.currentTab = 'investments';
      store.filterStatus = ['unread'];
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');
      expect(tableData.value[0].status).toBe('unread');

      // Test filter with search
      store.search = 'Test';
      store.filterStatus = ['unread'];
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].status).toBe('unread');
      expect(tableData.value[0].content).toBe('Test investment');
    });

    it('should search notifications correctly', async () => {
      // Set up Pinia
      setActivePinia(createPinia());

      // Mock the repository response with some notifications
      const mockNotifications = [
        { type: 'investment', status: 'unread', content: 'Test investment' },
        { type: 'profile', status: 'read', content: 'Test profile' },
        { type: 'document', status: 'unread', content: 'Test document' }
      ];

      // Create mock functions
      const mockGetAll = vi.fn().mockImplementation(() => Promise.resolve(mockNotifications));

      // Mock the repository with proper ref structure
      const mockRepository = {
        formattedNotifications: { value: mockNotifications },
        error: { value: null },
        isLoadingGetAll: { value: false },
        getAll: mockGetAll,
        markAllAsRead: vi.fn(),
        markAsReadById: vi.fn(),
      };
      vi.mocked(useRepositoryNotifications).mockReturnValue(mockRepository);

      // Mock the users store
      const mockUsersStore = {
        userLoggedIn: { value: true },
      };
      vi.mocked(useUsersStore).mockReturnValue(mockUsersStore);

      // Create store instance
      const store = useNotifications();

      // Initialize store with data
      await store.loadData();
      await nextTick();

      // Initialize filter settings
      store.filterSettings = [
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: [],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: [],
        },
      ];
      await nextTick();

      // Reset all state to ensure clean test
      store.currentTab = 'all';
      store.search = '';
      store.filterStatus = [];
      store.filterType = [];
      await nextTick();

      // Get store refs
      const {
        formattedNotifications,
        notificationUserData,
        tabsData,
        filterData,
        tableData,
      } = storeToRefs(store);

      // Wait for computed properties to update
      await nextTick();

      // Verify initial state
      expect(formattedNotifications.value).toBeDefined();
      expect(formattedNotifications.value).toHaveLength(3);
      expect(notificationUserData.value).toBeDefined();
      expect(notificationUserData.value).toHaveLength(3);

      // Test exact type match
      store.search = 'investment';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test case insensitivity
      store.search = 'INVESTMENT';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test partial match
      store.search = 'invest';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test content search
      store.search = 'Test investment';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].content).toBe('Test investment');

      // Test status search
      store.search = 'unread';
      await nextTick();
      expect(tableData.value).toHaveLength(2);
      expect(tableData.value[0].status).toBe('unread');
      expect(tableData.value[1].status).toBe('unread');

      // Test empty search
      store.search = '';
      await nextTick();
      expect(tableData.value).toHaveLength(3);

      // Test tab filtering with search
      store.currentTab = 'investments';
      store.search = 'investment';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test tab filtering without search
      store.currentTab = 'investments';
      store.search = '';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');

      // Test tab filtering with different search
      store.currentTab = 'investments';
      store.search = 'Test';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');
      expect(tableData.value[0].content).toBe('Test investment');

      // Test tab filtering with status search
      store.currentTab = 'investments';
      store.search = 'unread';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');
      expect(tableData.value[0].status).toBe('unread');

      // Test tab filtering with content search
      store.currentTab = 'investments';
      store.search = 'Test investment';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');
      expect(tableData.value[0].content).toBe('Test investment');

      // Test tab filtering with partial content search
      store.currentTab = 'investments';
      store.search = 'Test';
      await nextTick();
      expect(tableData.value).toHaveLength(1);
      expect(tableData.value[0].type).toBe('investment');
      expect(tableData.value[0].content).toBe('Test investment');
    });
  });

  describe('actions', () => {
    it('should mark all notifications as read', async () => {
      const store = useNotifications();
      store.loadData();
      await nextTick();

      await store.markAllAsRead();
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('should mark single notification as read', async () => {
      const store = useNotifications();

      // Ensure store is properly initialized
      await store.loadData();
      await nextTick();

      // Now test marking as read
      await store.markAsReadById(1);
      expect(mockMarkAsReadById).toHaveBeenCalledWith(1);
    });

    it('should handle filter application correctly', async () => {
      const store = useNotifications();

      // Mock the repository response with some notifications
      vi.mocked(useRepositoryNotifications).mockReturnValue({
        formattedNotifications: {
          value: [
            { type: 'investment', status: 'unread', content: 'Test investment' },
            { type: 'profile', status: 'read', content: 'Test profile' },
          ],
        },
        error: { value: null },
        isLoadingGetAll: { value: false },
        getAll: vi.fn(),
        markAllAsRead: vi.fn(),
        markAsReadById: vi.fn(),
      });

      // Initialize store with data
      await store.loadData();
      await nextTick();

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

      // Apply filters
      store.onApplyFilter(mockFilters);
      await nextTick();

      // Verify filter results
      const statusFilter = store.filterSettings.find((f: { value: string; model: string[] }) => f.value === 'status');
      const typeFilter = store.filterSettings.find((f: { value: string; model: string[] }) => f.value === 'type');

      expect(statusFilter?.model).toEqual(['Read']);
      expect(typeFilter?.model).toEqual(['Investment']);
    });
  });

  describe('sidebar functionality', () => {
    it('should toggle sidebar state', () => {
      const store = useNotifications();

      expect(store.isSidebarOpen).toBe(false);
      store.onSidebarToggle(true);
      expect(store.isSidebarOpen).toBe(true);
      store.onSidebarToggle(false);
      expect(store.isSidebarOpen).toBe(false);
    });
  });

  describe('clear functions', () => {
    it('should clear filters and search correctly', async () => {
      // Create and initialize store
      const store = useNotifications();

      // Initialize store with empty arrays for filters
      store.filterType = [];
      store.filterStatus = [];

      // Ensure store is initialized and userLoggedIn is available
      await store.loadData();
      await nextTick();

      // Set initial values
      store.onApplyFilter([
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: ['test'],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: ['test'],
        },
      ]);
      store.search = 'test';
      store.currentTab = 'investments';

      await nextTick();

      // Clear filters
      store.onApplyFilter([
        {
          value: 'status',
          title: 'By status:',
          options: ['Read', 'Unread'],
          model: [],
        },
        {
          value: 'type',
          title: 'By tag:',
          options: ['Investment', 'System'],
          model: [],
        },
      ]);
      store.search = '';
      store.currentTab = 'all';

      await nextTick();

      // Verify all filters are cleared
      expect(store.filterType).toEqual([]);
      expect(store.filterStatus).toEqual([]);
      expect(store.search).toBe('');
      expect(store.currentTab).toBe('all');
    });
  });
});
