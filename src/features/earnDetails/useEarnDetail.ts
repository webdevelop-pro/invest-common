import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import {
  ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_EARN,
  ROUTE_EARN_OVERVIEW,
  ROUTE_EARN_YOUR_POSITION,
  ROUTE_EARN_RISK,
} from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryDefiLlama, type DefiLlamaPoolEnriched, type DefiLlamaChartDataPoint, type DefiLlamaConfigData, type DefiLlamaRiskData } from 'InvestCommon/data/3dParty/defillama.repository';
import { useRepositoryEarn, type EarnPositionsResponse } from 'InvestCommon/data/earn/earn.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { EarnDetailFormatter } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';
import { RiskFormatter, type RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';
import { DashboardEarnTabTypes } from './utils';
import type { StatItem } from './components/composables/useEarnYourPosition';
import type { IEarnTransaction } from './components/composables/useEarnTransactionItem';

const DEFAULT_STATS: StatItem[] = [
  {
    label: 'Amount Staked:',
    amount: 0,
    valueInUsd: '$0.00',
  },
  {
    label: 'Earned:',
    amount: 0,
    valueInUsd: '$0.00',
  },
];

export function useEarnDetail() {
  const route = useRoute();
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

  // Repositories
  const defiLlamaRepo = useRepositoryDefiLlama();
  const earnRepository = useRepositoryEarn();
  const evmRepository = useRepositoryEvm();

  // Repository states
  const {
    getYieldsState,
    getPoolEnrichedState,
    getPoolChartState,
    getProtocolConfigState,
    getPoolRiskState,
  } = storeToRefs(defiLlamaRepo);
  const { positionsState, positionsPools } = storeToRefs(earnRepository);
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);

  // Pool data
  const poolId = computed(() => route.params.poolId as string);

  const poolData = computed<DefiLlamaYieldPoolFormatted | undefined>(() => {
    const pools = getYieldsState.value.data || [];
    return pools.find((pool: DefiLlamaYieldPoolFormatted) => pool.pool === poolId.value);
  });

  // Loading and error states
  const loading = computed(() =>
    getYieldsState.value.loading ||
    getPoolEnrichedState.value.loading ||
    getPoolChartState.value.loading ||
    getProtocolConfigState.value.loading
  );
  const error = computed(() =>
    getYieldsState.value.error ||
    getPoolEnrichedState.value.error ||
    getPoolChartState.value.error ||
    getProtocolConfigState.value.error
  );
  const riskLoading = computed(() => getPoolRiskState.value.loading);

  // Individual loading states
  const chartsLoading = computed(() => getPoolChartState.value.loading);
  const poolInfoLoading = computed(() => getYieldsState.value.loading || getPoolEnrichedState.value.loading);
  const protocolConfigLoading = computed(() => getProtocolConfigState.value.loading);

  // Pool data states
  const poolEnrichedData = computed<DefiLlamaPoolEnriched | undefined>(() => getPoolEnrichedState.value.data);
  const poolChartData = computed<DefiLlamaChartDataPoint[]>(() => getPoolChartState.value.data || []);
  const protocolConfigData = computed<DefiLlamaConfigData | undefined>(() => getProtocolConfigState.value.data);
  const poolRiskData = computed<DefiLlamaRiskData | undefined>(() => getPoolRiskState.value.data);

  // Formatters
  const formatter = new EarnDetailFormatter();
  const riskFormatter = new RiskFormatter();

  // Formatted data
  const infoData = computed(() => {
    return formatter.formatInfoData(poolData.value, poolEnrichedData.value);
  });

  const topInfoData = computed(() => {
    return formatter.formatTopInfoData(poolData.value, poolEnrichedData.value);
  });

  const formattedRiskData = computed<RiskSection[]>(() => {
    return riskFormatter.formatRiskData(poolRiskData.value);
  });

  const ratingColorToCssColor = (ratingColor: string | undefined): string => {
    return riskFormatter.ratingColorToCssColor(ratingColor);
  };

  const overviewSections = computed(() => {
    const sections: Array<{ title: string; data: any[]; options?: any; loading?: boolean }> = [];

    // Add chart sections (show even if loading)
    const charts = formatter.formatChartData(poolChartData.value);
    if (chartsLoading.value || charts.length > 0) {
      charts.forEach((chart) => {
        sections.push({
          title: chart.title,
          data: chart.data,
          options: chart.options,
          loading: chartsLoading.value && chart.data.length === 0,
        });
      });
      // If loading and no charts yet, show placeholder
      if (chartsLoading.value && charts.length === 0) {
        sections.push({
          title: 'APY History',
          data: [],
          options: undefined,
          loading: true,
        });
        sections.push({
          title: 'TVL History',
          data: [],
          options: undefined,
          loading: true,
        });
      }
    }

    // Add info data section (show even if loading)
    if (poolInfoLoading.value || infoData.value.length > 0) {
      sections.push({
        title: 'Pool Information',
        data: infoData.value,
        loading: poolInfoLoading.value && infoData.value.length === 0,
      });
    }

    // Add protocol config section (show even if loading)
    const protocolConfigInfo = formatter.formatProtocolConfigData(protocolConfigData.value);
    if (protocolConfigLoading.value || protocolConfigInfo.length > 0) {
      sections.push({
        title: 'Protocol Configuration',
        data: protocolConfigInfo,
        loading: protocolConfigLoading.value && protocolConfigInfo.length === 0,
      });
    }

    return sections;
  });

  // Exchange dialog state
  const isDialogTransactionOpen = ref(false);
  const transactionType = ref<EvmTransactionTypes>(EvmTransactionTypes.exchange);

  // Crypto wallet data management
  const updateCryptoWalletData = async () => {
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      await evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    } else if (!canLoadEvmWalletData.value && getEvmWalletState.value.data) {
      evmRepository.resetAll();
    }
  };

  // Watch for profile changes and load wallet data
  watch(
    () => selectedUserProfileData.value?.id,
    (profileId) => {
      if (profileId) {
        nextTick(() => {
          updateCryptoWalletData();
        });
      }
    },
    { immediate: false }
  );

  /**
   * Coin balance computation - uses positionsPools as single source of truth
   * Prioritizes poolId match, falls back to symbol match
   */
  const coinBalance = computed(() => {
    const symbol = poolData.value?.symbol?.toUpperCase();
    const currentPoolId = poolId.value;
    const profileId = selectedUserProfileId.value;
    
    if (!symbol || !profileId || !currentPoolId) {
      return undefined;
    }

    const positions = positionsPools.value;
    
    // Find by poolId first (most accurate), then fallback to symbol
    const position = positions.find(
      (p: EarnPositionsResponse) =>
        p.profileId === profileId &&
        (p.poolId === currentPoolId || p.symbol?.toUpperCase() === symbol)
    );

    return position ? (position.availableAmountUsd ?? position.stakedAmountUsd ?? 0) : undefined;
  });

  // Positions data
  const walletLoading = computed(() => positionsState.value.loading);
  const stats = computed<StatItem[]>(() => positionsState.value.data?.stats ?? DEFAULT_STATS);
  const transactions = computed<IEarnTransaction[]>(() => positionsState.value.data?.transactions ?? []);
  const positionsLoading = computed(() => positionsState.value.loading);

  // Exchange dialog handlers
  const onExchangeClick = () => {
    transactionType.value = EvmTransactionTypes.exchange;
    isDialogTransactionOpen.value = true;
  };

  // Navigation handlers
  const onBackClick = () => {
    void router.push({
      name: ROUTE_DASHBOARD_EARN,
      params: { profileId: selectedUserProfileId.value },
    });
  };

  // Breadcrumbs
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
    },
    {
      text: 'Earn',
      to: { name: ROUTE_DASHBOARD_EARN, params: { profileId: selectedUserProfileId.value } },
    },
    {
      text: poolData.value?.symbol || 'Details',
    },
  ]);

  // Tabs configuration
  const tabs = computed(() => {
    const createTab = (type: DashboardEarnTabTypes, label: string, routeName: string) => ({
      value: type,
      label,
      to: {
        name: routeName,
        params: {
          profileId: selectedUserProfileId.value,
          poolId: poolId.value,
        },
      },
    });

    return {
      [DashboardEarnTabTypes.yourPosition]: createTab(
        DashboardEarnTabTypes.yourPosition,
        'Your Position',
        ROUTE_EARN_YOUR_POSITION
      ),
      [DashboardEarnTabTypes.overview]: createTab(
        DashboardEarnTabTypes.overview,
        'Overview',
        ROUTE_EARN_OVERVIEW
      ),
      [DashboardEarnTabTypes.risk]: createTab(
        DashboardEarnTabTypes.risk,
        'Risk',
        ROUTE_EARN_RISK
      ),
    } as const;
  });

  // Initialize data on mount
  onMounted(async () => {
    // If pools are not loaded, fetch them
    if (!getYieldsState.value.data) {
      await defiLlamaRepo.getYields('aave');
    }

    // If pool not found, redirect to earn list
    if (!poolData.value) {
      void router.push({
        name: ROUTE_DASHBOARD_EARN,
        params: { profileId: selectedUserProfileId.value },
      });
      return;
    }

    // Fetch all data in parallel to show as we get it
    if (poolId.value) {
      // Fetch enriched pool data
      defiLlamaRepo.getPoolEnriched(poolId.value).catch((err: Error) => {
        console.warn('Failed to fetch enriched pool data:', err);
      });

      // Fetch chart data
      defiLlamaRepo.getPoolChart(poolId.value).catch((err: Error) => {
        console.warn('Failed to fetch chart data:', err);
      });

      // Fetch protocol config if pool data is available
      if (poolData.value?.project) {
        const protocol = poolData.value.project.toLowerCase().replace(/\s+/g, '-');
        defiLlamaRepo.getProtocolConfig(protocol).catch((err: Error) => {
          console.warn('Failed to fetch protocol config:', err);
        });
      }

      // Fetch risk data if pool data is available
      if (poolData.value) {
        const riskParams = {
          pool_old: poolData.value.pool,
          chain: poolData.value.chain || 'ethereum',
          project: poolData.value.project,
          tvlUsd: poolData.value.tvlUsd || 0,
          underlyingTokens: poolData.value.underlyingTokens || [],
        };
        defiLlamaRepo.getPoolRisk(riskParams).catch((err: Error) => {
          console.warn('Failed to fetch risk data:', err);
        });
      }
    }

    // Load wallet and positions data
    updateCryptoWalletData();
    await earnRepository.getPositions(poolId.value, selectedUserProfileId.value);
  });

  return {
    // Pool data
    poolId,
    poolData,
    poolRiskData,

    // Loading states
    loading,
    error,
    riskLoading,
    walletLoading,
    positionsLoading,

    // Formatted data
    overviewSections,
    infoData,
    topInfoData,
    formattedRiskData,
    ratingColorToCssColor,

    // Positions data
    coinBalance,
    stats,
    transactions,

    // Exchange dialog
    isDialogTransactionOpen,
    transactionType,
    onExchangeClick,

    // Navigation
    onBackClick,
    breadcrumbs,
    tabs,

    // Wallet state
    getEvmWalletState,
  };
}
