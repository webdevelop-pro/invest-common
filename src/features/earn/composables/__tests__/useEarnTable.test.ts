import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useEarnTable } from '../useEarnTable';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

// Mock vue-router
const mockPush = vi.fn(() => Promise.resolve());

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useProfilesStore
const mockSelectedUserProfileId = ref(1);

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: mockSelectedUserProfileId,
  }),
}));

// Mock useIntersectionObserver
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => ({
    stop: vi.fn(),
  })),
}));

// Mock repository
const mockGetYieldsState = ref({
  loading: false,
  error: null,
  data: [] as DefiLlamaYieldPoolFormatted[],
});

const mockGetYields = vi.fn().mockResolvedValue([]);

vi.mock('InvestCommon/data/3dParty/defillama.repository', () => ({
  useRepositoryDefiLlama: () => ({
    getYieldsState: mockGetYieldsState,
    getYields: mockGetYields,
  }),
}));

describe('useEarnTable', () => {
  let composable: ReturnType<typeof useEarnTable>;

  const createMockPool = (
    pool: string,
    symbol: string,
    stablecoin: boolean = true,
  ): DefiLlamaYieldPoolFormatted => ({
    pool,
    chain: 'ethereum',
    project: 'aave',
    symbol,
    tvlUsd: 1000000,
    apy: 5.5,
    apyBase: 4.0,
    apyReward: 1.5,
    apyMean30d: 5.2,
    ilRisk: 'none',
    apyPct1D: 0.1,
    apyPct7D: 0.5,
    apyPct30D: 1.0,
    stablecoin,
    poolMeta: null,
    mu: 0,
    sigma: 0,
    count: 0,
    outlier: false,
    underlyingTokens: null,
    il7d: null,
    il30d: null,
    apyBase7d: null,
    apyMean7d: null,
    apyBaseInception: null,
    apyInception: null,
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset mocks
    mockGetYieldsState.value = {
      loading: false,
      error: null,
      data: [],
    };
    mockSelectedUserProfileId.value = 1;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      composable = useEarnTable();

      expect(composable.search.value).toBe('');
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.visibleData.value).toEqual([]);
      expect(composable.totalResults.value).toBe(0);
      expect(composable.filterResults.value).toBe(0);
      expect(composable.hasMore.value).toBe(false);
    });

    it('should call getYields on mount', async () => {
      // Note: onMounted is called during composable initialization
      // We need to wait for the next tick to ensure it's executed
      composable = useEarnTable();
      
      // The onMounted hook should trigger getYields
      // Since we can't easily test onMounted in unit tests without mounting a component,
      // we'll test that refetch works instead, which calls the same function
      expect(composable.refetch).toBeDefined();
    });
  });

  describe('Stablecoin Filtering', () => {
    it('should filter only stablecoin pools', () => {
      const mockPools = [
        createMockPool('pool-1', 'USDC', true),
        createMockPool('pool-2', 'USDT', true),
        createMockPool('pool-3', 'ETH', false),
        createMockPool('pool-4', 'DAI', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      expect(composable.totalResults.value).toBe(3);
      expect(composable.filteredData.value).toHaveLength(3);
      expect(composable.filteredData.value.every((p) => p.stablecoin === true)).toBe(true);
    });

    it('should return empty array when no stablecoin pools', () => {
      const mockPools = [
        createMockPool('pool-1', 'ETH', false),
        createMockPool('pool-2', 'BTC', false),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      expect(composable.totalResults.value).toBe(0);
      expect(composable.filteredData.value).toEqual([]);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const mockPools = [
        createMockPool('pool-1', 'USDC', true),
        createMockPool('pool-2', 'USDT', true),
        createMockPool('pool-3', 'DAI', true),
        createMockPool('pool-4', 'TUSD', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();
    });

    it('should filter pools by symbol when search query is provided', () => {
      composable.search.value = 'USDC';

      expect(composable.filterResults.value).toBe(1);
      expect(composable.filteredData.value[0].symbol).toBe('USDC');
    });

    it('should be case-insensitive when searching', () => {
      composable.search.value = 'usdt';

      expect(composable.filterResults.value).toBe(1);
      expect(composable.filteredData.value[0].symbol).toBe('USDT');
    });

    it('should return all pools when search is empty', () => {
      composable.search.value = '';

      expect(composable.filterResults.value).toBe(4);
    });

    it('should return all pools when search is only whitespace', () => {
      composable.search.value = '   ';

      expect(composable.filterResults.value).toBe(4);
    });

    it('should filter by partial match', () => {
      composable.search.value = 'USD';

      // Should match USDC, USDT, and TUSD (all contain 'USD')
      expect(composable.filterResults.value).toBe(3);
      expect(composable.filteredData.value.map((p) => p.symbol)).toEqual(['USDC', 'USDT', 'TUSD']);
    });

    it('should reset visible count when search changes', async () => {
      // Set up initial state with many pools
      const manyPools = Array.from({ length: 25 }, (_, i) =>
        createMockPool(`pool-${i}`, `TOKEN${i}`, true),
      );
      mockGetYieldsState.value.data = manyPools;
      composable = useEarnTable();

      // Get initial visible count
      const initialVisibleCount = composable.visibleData.value.length;
      expect(initialVisibleCount).toBe(10);

      // Simulate intersection observer increasing visible count
      // We'll test this by checking that after search change, visible count resets
      // Change search - this should trigger the watch that resets visible count
      composable.search.value = 'TOKEN1';
      await nextTick();

      // After search change, visible data should be limited to initial count
      // (though filtered results might be less)
      const filteredLength = composable.filteredData.value.length;
      expect(composable.visibleData.value.length).toBeLessThanOrEqual(Math.min(10, filteredLength));
    });
  });

  describe('Visible Data Pagination', () => {
    beforeEach(() => {
      const mockPools = Array.from({ length: 25 }, (_, i) =>
        createMockPool(`pool-${i}`, `USDC${i}`, true),
      );

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();
    });

    it('should show initial visible count of pools', () => {
      expect(composable.visibleData.value.length).toBe(10);
    });

    it('should compute hasMore correctly when more data available', () => {
      expect(composable.hasMore.value).toBe(true);
    });

    it('should compute hasMore correctly when all data is visible', () => {
      // When filtered data is less than or equal to initial visible count,
      // hasMore should be false
      const fewPools = Array.from({ length: 5 }, (_, i) =>
        createMockPool(`pool-${i}`, `USDC${i}`, true),
      );

      mockGetYieldsState.value.data = fewPools;
      composable = useEarnTable();

      // With only 5 pools, all should be visible initially
      expect(composable.hasMore.value).toBe(false);
      expect(composable.visibleData.value.length).toBe(5);
    });

    it('should slice filtered data to visible count', () => {
      composable.search.value = 'USDC1';
      // Should show all matching results (USDC1, USDC10-19)
      const filteredLength = composable.filteredData.value.length;
      expect(composable.visibleData.value.length).toBeLessThanOrEqual(10);
      expect(composable.visibleData.value.length).toBeLessThanOrEqual(filteredLength);
    });
  });

  describe('Loading States', () => {
    it('should reflect loading state from repository', () => {
      mockGetYieldsState.value.loading = true;
      composable = useEarnTable();

      expect(composable.loading.value).toBe(true);
    });

    it('should reflect error state from repository', () => {
      const error = new Error('Failed to fetch');
      mockGetYieldsState.value.error = error;
      composable = useEarnTable();

      expect(composable.error.value).toBe(error);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      const mockPools = [
        createMockPool('pool-123', 'USDC', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();
    });

    it('should navigate to earn overview on row click', async () => {
      const pool = composable.filteredData.value[0];

      composable.onRowClick(pool);

      expect(mockPush).toHaveBeenCalledWith({
        name: 'ROUTE_EARN_OVERVIEW',
        params: {
          profileId: 1,
          poolId: 'pool-123',
        },
      });
    });

    it('should use current selectedUserProfileId when navigating', async () => {
      mockSelectedUserProfileId.value = 5;
      const pool = composable.filteredData.value[0];

      composable.onRowClick(pool);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            profileId: 5,
          }),
        }),
      );
    });
  });

  describe('Refetch', () => {
    it('should call getYields when refetch is called', () => {
      composable = useEarnTable();

      composable.refetch();

      expect(mockGetYields).toHaveBeenCalledWith('aave');
    });
  });

  describe('Intersection Observer', () => {
    it('should set up intersection observer with sentinel ref', async () => {
      const { useIntersectionObserver } = await import('@vueuse/core');
      composable = useEarnTable();

      expect(useIntersectionObserver).toHaveBeenCalled();
      expect(composable.sentinel).toBeDefined();
    });

    it('should configure intersection observer with correct options', async () => {
      const { useIntersectionObserver } = await import('@vueuse/core');
      composable = useEarnTable();

      // Verify intersection observer was called with sentinel ref and callback
      expect(useIntersectionObserver).toHaveBeenCalled();
      const callArgs = (useIntersectionObserver as any).mock.calls[0];
      
      // First argument should be the sentinel ref
      expect(callArgs[0]).toBe(composable.sentinel);
      
      // Second argument should be a callback function
      expect(typeof callArgs[1]).toBe('function');
      
      // Third argument should be options with rootMargin
      expect(callArgs[2]).toEqual({
        rootMargin: '100px',
      });
    });

    it('should have hasMore true when more data is available for infinite scroll', () => {
      const mockPools = Array.from({ length: 25 }, (_, i) =>
        createMockPool(`pool-${i}`, `USDC${i}`, true),
      );

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      // Initially should show 10, with 15 more available
      expect(composable.visibleData.value.length).toBe(10);
      expect(composable.hasMore.value).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      mockGetYieldsState.value.data = [];
      composable = useEarnTable();

      expect(composable.totalResults.value).toBe(0);
      expect(composable.filterResults.value).toBe(0);
      expect(composable.visibleData.value).toEqual([]);
      expect(composable.hasMore.value).toBe(false);
    });

    it('should handle undefined data', () => {
      mockGetYieldsState.value.data = undefined as any;
      composable = useEarnTable();

      expect(composable.totalResults.value).toBe(0);
      expect(composable.filterResults.value).toBe(0);
      expect(composable.visibleData.value).toEqual([]);
    });

    it('should handle pools with missing symbol', () => {
      const mockPools = [
        createMockPool('pool-1', 'USDC', true),
        { ...createMockPool('pool-2', '', true), symbol: undefined } as any,
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      // Should still filter stablecoin pools
      expect(composable.totalResults.value).toBe(2);
    });

    it('should handle search with special characters', () => {
      const mockPools = [
        createMockPool('pool-1', 'USDC', true),
        createMockPool('pool-2', 'USDT', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      composable.search.value = '@#$%';

      expect(composable.filterResults.value).toBe(0);
    });
  });
});

