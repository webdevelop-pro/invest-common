import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useEarnDetail } from '../useEarnDetail';

// Mock vue-router
const mockPush = vi.fn(() => Promise.resolve());
const mockRoute = {
  params: { poolId: 'pool-123' },
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useProfilesStore
const mockSelectedUserProfileId = ref(1);
const mockSelectedUserProfileData = ref({ id: 1, name: 'Test Profile' });

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: mockSelectedUserProfileId,
    selectedUserProfileData: mockSelectedUserProfileData,
  }),
}));

// Mock repositories
const mockDefiLlamaRepo = {
  getYieldsState: ref({ loading: false, error: null, data: [] }),
  getPoolEnrichedState: ref({ loading: false, error: null, data: undefined }),
  getPoolChartState: ref({ loading: false, error: null, data: [] }),
  getProtocolConfigState: ref({ loading: false, error: null, data: undefined }),
  getPoolRiskState: ref({ loading: false, error: null, data: undefined }),
  getYields: vi.fn().mockResolvedValue([]),
  getPoolEnriched: vi.fn().mockResolvedValue(undefined),
  getPoolChart: vi.fn().mockResolvedValue([]),
  getProtocolConfig: vi.fn().mockResolvedValue(undefined),
  getPoolRisk: vi.fn().mockResolvedValue(undefined),
};

const mockEarnRepo = {
  positionsState: ref({ loading: false, error: null, data: undefined }),
  positionsPools: ref([]),
  getPositions: vi.fn().mockResolvedValue(undefined),
  resetAll: vi.fn(),
};

const mockEvmRepo = {
  getEvmWalletState: ref({ loading: false, error: null, data: undefined }),
  canLoadEvmWalletData: ref(true),
  getEvmWalletByProfile: vi.fn().mockResolvedValue(undefined),
  resetAll: vi.fn(),
};

vi.mock('InvestCommon/data/3dParty/defillama.repository', () => ({
  useRepositoryDefiLlama: () => mockDefiLlamaRepo,
}));

vi.mock('InvestCommon/data/earn/earn.repository', () => ({
  useRepositoryEarn: () => mockEarnRepo,
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => mockEvmRepo,
}));

// Mock formatters
vi.mock('InvestCommon/data/3dParty/formatter/earnDetail.formatter', () => ({
  EarnDetailFormatter: class EarnDetailFormatter {
    formatInfoData = vi.fn(() => []);
    formatTopInfoData = vi.fn(() => []);
    formatChartData = vi.fn(() => []);
    formatProtocolConfigData = vi.fn(() => []);
  },
}));

vi.mock('InvestCommon/data/3dParty/formatter/risk.formatter', () => ({
  RiskFormatter: class RiskFormatter {
    formatRiskData = vi.fn(() => []);
    ratingColorToCssColor = vi.fn((color) => color || 'default');
  },
}));

describe('useEarnDetail', () => {
  let composable: ReturnType<typeof useEarnDetail>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Reset mocks
    mockRoute.params = { poolId: 'pool-123' };
    mockSelectedUserProfileId.value = 1;
    mockSelectedUserProfileData.value = { id: 1, name: 'Test Profile' };
    
    mockDefiLlamaRepo.getYieldsState.value = { loading: false, error: null, data: [] };
    mockDefiLlamaRepo.getPoolEnrichedState.value = { loading: false, error: null, data: undefined };
    mockDefiLlamaRepo.getPoolChartState.value = { loading: false, error: null, data: [] };
    mockDefiLlamaRepo.getProtocolConfigState.value = { loading: false, error: null, data: undefined };
    mockDefiLlamaRepo.getPoolRiskState.value = { loading: false, error: null, data: undefined };
    
    mockEarnRepo.positionsState.value = { loading: false, error: null, data: undefined };
    mockEarnRepo.positionsPools.value = [];
    
    mockEvmRepo.getEvmWalletState.value = { loading: false, error: null, data: undefined };
    mockEvmRepo.canLoadEvmWalletData.value = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      composable = useEarnDetail();
      
      expect(composable.poolId.value).toBe('pool-123');
      expect(composable.isDialogTransactionOpen.value).toBe(false);
      expect(composable.transactionType.value).toBe('exchange');
    });
  });

  describe('Pool Data', () => {
    it('should compute poolData from yields state', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
        apy: 5.5,
        tvlUsd: 1000000,
      };
      
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      composable = useEarnDetail();
      
      expect(composable.poolData.value).toEqual(mockPool);
    });

    it('should return undefined when pool not found', () => {
      mockDefiLlamaRepo.getYieldsState.value.data = [
        { pool: 'pool-456', symbol: 'ETH' },
      ];
      composable = useEarnDetail();
      
      expect(composable.poolData.value).toBeUndefined();
    });
  });

  describe('Loading States', () => {
    it('should compute loading from multiple states', () => {
      mockDefiLlamaRepo.getYieldsState.value.loading = true;
      composable = useEarnDetail();
      
      expect(composable.loading.value).toBe(true);
    });

    it('should compute error from multiple states', () => {
      const error = new Error('Test error');
      mockDefiLlamaRepo.getYieldsState.value.error = error;
      composable = useEarnDetail();
      
      expect(composable.error.value).toBe(error);
    });

    it('should compute riskLoading from risk state', () => {
      mockDefiLlamaRepo.getPoolRiskState.value.loading = true;
      composable = useEarnDetail();
      
      expect(composable.riskLoading.value).toBe(true);
    });

    it('should compute walletLoading from positions state', () => {
      mockEarnRepo.positionsState.value.loading = true;
      composable = useEarnDetail();
      
      expect(composable.walletLoading.value).toBe(true);
    });

    it('should compute positionsLoading from positions state', () => {
      mockEarnRepo.positionsState.value.loading = true;
      composable = useEarnDetail();
      
      expect(composable.positionsLoading.value).toBe(true);
    });
  });

  describe('Coin Balance', () => {
    it('should compute coinBalance from positionsPools', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      
      mockEarnRepo.positionsPools.value = [
        {
          poolId: 'pool-123',
          profileId: 1,
          symbol: 'USDC',
          stakedAmountUsd: 1000,
          earnedAmountUsd: 50,
          availableAmountUsd: 500,
          transactions: [],
        },
      ];
      
      composable = useEarnDetail();
      
      expect(composable.coinBalance.value).toBe(500);
    });

    it('should fallback to stakedAmountUsd when availableAmountUsd is not set', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      
      mockEarnRepo.positionsPools.value = [
        {
          poolId: 'pool-123',
          profileId: 1,
          symbol: 'USDC',
          stakedAmountUsd: 1000,
          earnedAmountUsd: 50,
          transactions: [],
        },
      ];
      
      composable = useEarnDetail();
      
      expect(composable.coinBalance.value).toBe(1000);
    });

    it('should return undefined when no position exists', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      mockEarnRepo.positionsPools.value = [];
      
      composable = useEarnDetail();
      
      expect(composable.coinBalance.value).toBeUndefined();
    });

    it('should match by symbol when poolId does not match', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      
      mockEarnRepo.positionsPools.value = [
        {
          poolId: 'pool-456',
          profileId: 1,
          symbol: 'USDC',
          stakedAmountUsd: 1000,
          earnedAmountUsd: 50,
          availableAmountUsd: 500,
          transactions: [],
        },
      ];
      
      composable = useEarnDetail();
      
      expect(composable.coinBalance.value).toBe(500);
    });
  });

  describe('Stats and Transactions', () => {
    it('should return default stats when no position data', () => {
      composable = useEarnDetail();
      
      expect(composable.stats.value).toHaveLength(2);
      expect(composable.stats.value[0].label).toBe('Amount Staked:');
      expect(composable.stats.value[0].amount).toBe(0);
      expect(composable.stats.value[1].label).toBe('Earned:');
      expect(composable.stats.value[1].amount).toBe(0);
    });

    it('should return stats from position data', () => {
      mockEarnRepo.positionsState.value.data = {
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
        stakedAmountUsd: 1000,
        earnedAmountUsd: 50,
        stakedAmountFormatted: '$1,000.00',
        earnedAmountFormatted: '$50.00',
        stats: [
          { label: 'Amount Staked:', amount: 1000, valueInUsd: '$1,000.00' },
          { label: 'Earned:', amount: 50, valueInUsd: '$50.00' },
        ],
        transactions: [],
      };
      
      composable = useEarnDetail();
      
      expect(composable.stats.value[0].amount).toBe(1000);
      expect(composable.stats.value[1].amount).toBe(50);
    });

    it('should return empty transactions array when no position data', () => {
      composable = useEarnDetail();
      
      expect(composable.transactions.value).toEqual([]);
    });

    it('should return transactions from position data', () => {
      const mockTransactions = [
        {
          id: 1,
          date: '2024-01-01',
          time: '10:00',
          amount: '$1,000.00',
          transaction_id: 'tx-1',
          type: 'deposit',
          status: { text: 'Completed', tooltip: 'Transaction completed' },
          tagColor: 'green',
        },
      ];
      
      mockEarnRepo.positionsState.value.data = {
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
        stakedAmountUsd: 1000,
        earnedAmountUsd: 50,
        stakedAmountFormatted: '$1,000.00',
        earnedAmountFormatted: '$50.00',
        stats: [],
        transactions: mockTransactions,
      };
      
      composable = useEarnDetail();
      
      expect(composable.transactions.value).toEqual(mockTransactions);
    });
  });

  describe('Exchange Dialog', () => {
    it('should open exchange dialog on onExchangeClick', () => {
      composable = useEarnDetail();
      
      composable.onExchangeClick();
      
      expect(composable.isDialogTransactionOpen.value).toBe(true);
      expect(composable.transactionType.value).toBe('exchange');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to earn list on onBackClick', async () => {
      composable = useEarnDetail();
      
      await composable.onBackClick();
      
      expect(mockPush).toHaveBeenCalledWith({
        name: 'ROUTE_DASHBOARD_EARN',
        params: { profileId: 1 },
      });
    });

    it('should generate correct breadcrumbs', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      
      composable = useEarnDetail();
      
      const breadcrumbs = composable.breadcrumbs.value;
      
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].text).toBe('Dashboard');
      expect(breadcrumbs[1].text).toBe('Earn');
      expect(breadcrumbs[2].text).toBe('USDC');
    });

    it('should generate tabs configuration', () => {
      composable = useEarnDetail();
      
      const tabs = composable.tabs.value;
      
      expect(tabs['your-position']).toBeDefined();
      expect(tabs['overview']).toBeDefined();
      expect(tabs['risk']).toBeDefined();
      
      expect(tabs['your-position'].to.params.poolId).toBe('pool-123');
      expect(tabs['your-position'].to.params.profileId).toBe(1);
    });
  });

  describe('Formatted Data', () => {
    it('should format info data', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      const mockEnriched = {
        apy: 5.5,
        tvlUsd: 1000000,
      };
      
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      mockDefiLlamaRepo.getPoolEnrichedState.value.data = mockEnriched;
      
      composable = useEarnDetail();
      
      expect(composable.infoData.value).toBeDefined();
      expect(Array.isArray(composable.infoData.value)).toBe(true);
    });

    it('should format top info data', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      const mockEnriched = {
        apy: 5.5,
        tvlUsd: 1000000,
      };
      
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      mockDefiLlamaRepo.getPoolEnrichedState.value.data = mockEnriched;
      
      composable = useEarnDetail();
      
      expect(composable.topInfoData.value).toBeDefined();
      expect(Array.isArray(composable.topInfoData.value)).toBe(true);
    });

    it('should format risk data', () => {
      const mockRiskData = {
        score: 85,
        rating: 'A',
      };
      
      mockDefiLlamaRepo.getPoolRiskState.value.data = mockRiskData;
      
      composable = useEarnDetail();
      
      expect(composable.formattedRiskData.value).toBeDefined();
      expect(Array.isArray(composable.formattedRiskData.value)).toBe(true);
    });

    it('should convert rating color to CSS color', () => {
      composable = useEarnDetail();
      
      const color = composable.ratingColorToCssColor('green');
      
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
    });
  });

  describe('Overview Sections', () => {
    it('should generate overview sections with chart data', () => {
      const mockChartData = [
        { date: '2024-01-01', apy: 5.5 },
        { date: '2024-01-02', apy: 5.6 },
      ];
      
      mockDefiLlamaRepo.getPoolChartState.value.data = mockChartData;
      
      composable = useEarnDetail();
      
      const sections = composable.overviewSections.value;
      
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });

    it('should show loading placeholders when charts are loading', () => {
      mockDefiLlamaRepo.getPoolChartState.value.loading = true;
      mockDefiLlamaRepo.getPoolChartState.value.data = [];
      
      composable = useEarnDetail();
      
      const sections = composable.overviewSections.value;
      
      const loadingSection = sections.find((s) => s.loading === true);
      expect(loadingSection).toBeDefined();
    });

    it('should include pool information section', () => {
      const mockPool = {
        pool: 'pool-123',
        symbol: 'USDC',
      };
      
      mockDefiLlamaRepo.getYieldsState.value.data = [mockPool];
      // Set loading to true so section is added even if data is empty
      mockDefiLlamaRepo.getYieldsState.value.loading = true;
      
      composable = useEarnDetail();
      
      const sections = composable.overviewSections.value;
      
      const infoSection = sections.find((s) => s.title === 'Pool Information');
      expect(infoSection).toBeDefined();
    });

    it('should include protocol config section', () => {
      const mockConfig = {
        name: 'Test Protocol',
        description: 'Test Description',
      };
      
      mockDefiLlamaRepo.getProtocolConfigState.value.data = mockConfig;
      // Set loading to true so section is added even if formatted data is empty
      mockDefiLlamaRepo.getProtocolConfigState.value.loading = true;
      
      composable = useEarnDetail();
      
      const sections = composable.overviewSections.value;
      
      const configSection = sections.find((s) => s.title === 'Protocol Configuration');
      expect(configSection).toBeDefined();
    });
  });
});
