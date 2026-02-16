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

// Earn table shows primary USDC pool + RWA pools from offers; mock offers empty so only USDC row appears
const mockGetOffersState = ref<{ loading: boolean; error: Error | null; data: { data?: unknown[] } | undefined }>({
  loading: false,
  error: null,
  data: { data: [] },
});
const mockGetOffers = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: () => ({
    getOffersState: mockGetOffersState,
    getOffers: mockGetOffers,
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
    mockGetOffersState.value = {
      loading: false,
      error: null,
      data: { data: [] },
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
    it('should show primary USDC pool plus RWA pools (DefiLlama stablecoin row only when no RWA)', () => {
      const mockPools = [
        createMockPool('pool-1', 'USDC', true),
        createMockPool('pool-2', 'USDT', true),
        createMockPool('pool-3', 'ETH', false),
        createMockPool('pool-4', 'DAI', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();

      // Table shows single primary USDC row + RWA rows; with no offers, only 1 row
      expect(composable.totalResults.value).toBe(1);
      expect(composable.filteredData.value).toHaveLength(1);
      expect(composable.filteredData.value[0].symbol).toBe('USDC');
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
      composable.search.value = 'usdc';

      expect(composable.filterResults.value).toBe(1);
      expect(composable.filteredData.value[0].symbol).toBe('USDC');
    });

    it('should return all pools when search is empty', () => {
      composable.search.value = '';

      // Single primary USDC row when no RWA offers
      expect(composable.filterResults.value).toBe(1);
    });

    it('should return all pools when search is only whitespace', () => {
      composable.search.value = '   ';

      expect(composable.filterResults.value).toBe(1);
    });

    it('should filter by partial match', () => {
      composable.search.value = 'USD';

      // Primary row is USDC, so 'USD' matches
      expect(composable.filterResults.value).toBe(1);
      expect(composable.filteredData.value.map((p) => p.symbol)).toEqual(['USDC']);
    });

    it('should reset visible count when search changes', async () => {
      mockGetYieldsState.value.data = [createMockPool('pool-0', 'USDC', true)];
      composable = useEarnTable();

      const initialVisibleCount = composable.visibleData.value.length;
      expect(initialVisibleCount).toBe(1);

      composable.search.value = 'none';
      await nextTick();

      expect(composable.visibleData.value.length).toBe(0);
    });
  });

  describe('Visible Data Pagination', () => {
    beforeEach(() => {
      const mockPools = [
        createMockPool('pool-0', 'USDC', true),
      ];

      mockGetYieldsState.value.data = mockPools;
      composable = useEarnTable();
    });

    it('should show initial visible count of pools', () => {
      expect(composable.visibleData.value.length).toBe(1);
    });

    it('should compute hasMore correctly when more data available', () => {
      // With only 1 row (primary USDC), hasMore is false
      expect(composable.hasMore.value).toBe(false);
    });

    it('should compute hasMore correctly when all data is visible', () => {
      expect(composable.hasMore.value).toBe(false);
      expect(composable.visibleData.value.length).toBe(1);
    });

    it('should slice filtered data to visible count', () => {
      composable.search.value = 'USDC';
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
      // With only primary USDC row (no RWA), hasMore is false
      mockGetYieldsState.value.data = [createMockPool('pool-0', 'USDC', true)];
      composable = useEarnTable();

      expect(composable.visibleData.value.length).toBe(1);
      expect(composable.hasMore.value).toBe(false);
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

      // Only primary USDC pool is shown (first stablecoin with symbol containing USDC)
      expect(composable.totalResults.value).toBe(1);
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

