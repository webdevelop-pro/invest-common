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
import { useRepositoryDefiLlama, type DefiLlamaPoolEnriched, type DefiLlamaChartDataPoint, type DefiLlamaConfigData } from 'InvestCommon/data/3dParty/defillama.repository';
import { useRepositoryEarn, type EarnPositionsResponse } from 'InvestCommon/data/earn/earn.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { EarnDetailFormatter } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';
import type { RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';
import { DashboardEarnTabTypes } from './utils';
import type { StatItem } from './components/composables/useEarnYourPosition';
import type { IEarnTransaction } from './components/composables/useEarnTransactionItem';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { mapOfferToRwaPool, type RwaEarnPoolFormatted } from 'InvestCommon/data/earn/rwaEarn.mapper';

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
  const offerRepository = useRepositoryOffer();

  // Repository states
  const {
    getYieldsState,
    getPoolEnrichedState,
    getPoolChartState,
    getProtocolConfigState,
  } = storeToRefs(defiLlamaRepo);
  const { positionsState, positionsPools } = storeToRefs(earnRepository);
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);
  const { getOffersState, getOfferOneState } = storeToRefs(offerRepository);

  // Pool data
  const poolId = computed(() => route.params.poolId as string);
  const isRwaPool = computed(() => poolId.value?.startsWith('rwa-'));
  const rwaOfferSlug = computed(() =>
    isRwaPool.value ? poolId.value.replace(/^rwa-/, '') : undefined,
  );

  const yieldsData = computed(() => getYieldsState.value.data ?? []);
  const usdcStablecoinPools = computed(() =>
    yieldsData.value.filter(
      (pool) =>
        pool.stablecoin === true &&
        (pool.symbol?.toUpperCase().includes('USDC') ?? false),
    ),
  );
  const primaryUsdcPool = computed<DefiLlamaYieldPoolFormatted | undefined>(
    () => usdcStablecoinPools.value[0],
  );

  const rwaPoolFromOffer = computed<RwaEarnPoolFormatted | undefined>(() => {
    if (!isRwaPool.value || !rwaOfferSlug.value) return undefined;

    const detailed = getOfferOneState.value.data as IOfferFormatted | undefined;
    if (detailed && detailed.slug === rwaOfferSlug.value) {
      return mapOfferToRwaPool(detailed, primaryUsdcPool.value);
    }

    const container = getOffersState.value.data as unknown as { data?: IOfferFormatted[] } | undefined;
    const offers = container?.data ?? [];
    const fromList = offers.find((offer) => offer.slug === rwaOfferSlug.value);

    return fromList ? mapOfferToRwaPool(fromList, primaryUsdcPool.value) : undefined;
  });

  const poolData = computed<DefiLlamaYieldPoolFormatted | undefined>(() => {
    if (isRwaPool.value) {
      return rwaPoolFromOffer.value;
    }

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

  // Individual loading states
  const chartsLoading = computed(() => getPoolChartState.value.loading);
  const poolInfoLoading = computed(() => getYieldsState.value.loading || getPoolEnrichedState.value.loading);
  const protocolConfigLoading = computed(() => getProtocolConfigState.value.loading);

  // Pool data states
  const poolEnrichedData = computed<DefiLlamaPoolEnriched | undefined>(() => getPoolEnrichedState.value.data);
  const poolChartData = computed<DefiLlamaChartDataPoint[]>(() => getPoolChartState.value.data || []);
  const protocolConfigData = computed<DefiLlamaConfigData | undefined>(() => getProtocolConfigState.value.data);

  // Formatters
  const formatter = new EarnDetailFormatter();

  // Formatted data
  const infoData = computed(() => {
    return formatter.formatInfoData(poolData.value, poolEnrichedData.value);
  });

  const topInfoData = computed(() => {
    return formatter.formatTopInfoData(poolData.value);
  });

  const formattedRiskData = computed<RiskSection[]>(() => {
    // For RWA (offer-backed) assets, derive a simple risk view from offer data
    if (isRwaPool.value) {
      const offer = getOfferOneState.value.data as IOfferFormatted | undefined;
      if (!offer) return [];

      const securityType =
        offer.securityTypeFormatted ||
        offer.security_type ||
        'N/A';

      const termLength =
        offer.termLengthFormatted ||
        offer.security_info?.debt_term_length ||
        'N/A';

      const distributionFrequency =
        offer.data?.distribution_frequency || 'N/A';

      const items = [
        {
          label: 'Security Type',
          value: securityType,
        },
        {
          label: 'Term Length',
          value: termLength,
        },
        {
          label: 'Distribution Frequency',
          value: distributionFrequency,
        },
        {
          label: 'Risk Disclosure',
          value: 'Please review the offering documents for full risk factors, including credit, liquidity, and market risk.',
        },
      ];

      return [
        {
          title: 'Risk Overview',
          items,
        },
      ];
    }

    // For non-RWA pools we no longer request external risk data.
    // Show an empty state in the Risk tab.
    return [];
  });

  const ratingColorToCssColor = (ratingColor: string | undefined): string => {
    if (!ratingColor) return 'inherit';
    const lower = ratingColor.toLowerCase();
    if (lower.includes('green')) return '#10b981';
    if (lower.includes('yellow')) return '#eab308';
    if (lower.includes('red')) return '#ef4444';
    if (lower.includes('blue')) return '#3b82f6';
    return 'inherit';
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

  // Trigger wallet load when earn detail page is active (profile present); re-run on profile change
  watch(
    () => selectedUserProfileData.value?.id,
    (profileId) => {
      if (profileId) {
        nextTick(() => {
          updateCryptoWalletData();
        });
      }
    },
    { immediate: true }
  );

  /**
   * Helper: build a prioritized list of token identifiers for matching:
   * 1) symbol
   * 2) name (or project for DefiLlama pools)
   * 3) ticker (when present on RWA / mapped pools)
   */
  const getPoolTokenIdentifiers = (pool: DefiLlamaYieldPoolFormatted | RwaEarnPoolFormatted | undefined): string[] => {
    if (!pool) return [];
    const raw = pool as any;

    const candidates = [
      raw?.symbol,
      raw?.name ?? raw?.project,
      raw?.ticker,
    ]
      .map((value) => (value ? String(value).toUpperCase() : ''))
      .filter(Boolean);

    // Ensure uniqueness while preserving order
    return Array.from(new Set(candidates));
  };

  /**
   * Helper: find wallet token by any of the identifiers (symbol or name match).
   * Wallet is considered the single source of truth for on-chain balances.
   */
  const findWalletTokenByIdentifiers = (identifiers: string[]) => {
    const walletBalances = getEvmWalletState.value.data?.balances || [];

    for (const id of identifiers) {
      const match = walletBalances.find((b: any) => {
        const symbol = b?.symbol ? String(b.symbol).toUpperCase() : '';
        const name = b?.name ? String(b.name).toUpperCase() : '';
        return symbol === id || name === id;
      });
      if (match) return match;
    }

    return undefined;
  };

  /**
   * Helper: find earn position by any of the identifiers, preferring exact poolId.
   * Used as a fallback when wallet has no matching token.
   */
  const findPositionByIdentifiers = (
    identifiers: string[],
    profileId: string | number,
    currentPoolId: string,
  ): EarnPositionsResponse | undefined => {
    const positions = positionsPools.value;

    for (const id of identifiers) {
      const match = positions.find(
        (p: EarnPositionsResponse) =>
          p.profileId === profileId &&
          (p.poolId === currentPoolId || p.symbol?.toUpperCase() === id),
      );

      if (match) return match;
    }

    return undefined;
  };

  /**
   * Coin balance computation - primary source is crypto wallet balances.
   * Falls back to positionsPools (mock earn positions) when wallet has no matching token.
   */
  const coinBalance = computed(() => {
    const identifiers = getPoolTokenIdentifiers(poolData.value);
    const currentPoolId = poolId.value;
    const profileId = selectedUserProfileId.value;
    
    if (!identifiers.length || !profileId || !currentPoolId) {
      return undefined;
    }

    // 1) Try to get balance from EVM wallet (single source of truth for on-chain funds)
    const walletToken = findWalletTokenByIdentifiers(identifiers);

    if (walletToken) {
      const amount = Number(walletToken.amount ?? 0);
      return Number.isFinite(amount) ? amount : 0;
    }

    // 2) Fallback to positionsPools for mock/local earn positions (by poolId or symbol/name/ticker)
    const position = findPositionByIdentifiers(identifiers, profileId, currentPoolId);

    return position ? (position.availableAmountUsd ?? position.stakedAmountUsd ?? 0) : undefined;
  });

  // Positions data
  /** Loading state for EVM wallet (used for Available Balance in deposit card) */
  const walletLoading = computed(() => getEvmWalletState.value.loading);
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
    // Trigger EVM wallet fetch for Available Balance (runs in parallel with pool/positions)
    updateCryptoWalletData();

    if (isRwaPool.value) {
      // Ensure we have base USDC market data for RWA mapping
      if (!getYieldsState.value.data) {
        await defiLlamaRepo.getYields('aave');
      }

      if (rwaOfferSlug.value) {
        // Load single offer data for this RWA asset
        await offerRepository.getOfferOne(String(rwaOfferSlug.value)).catch((err: Error) => {
          console.warn('Failed to fetch RWA offer data:', err);
        });
      }
    } else {
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
      }
    }

    // Load positions for "Your Position" tab (wallet already triggered at start of onMounted)
    await earnRepository.getPositions(poolId.value, selectedUserProfileId.value);
  });

  return {
    // Pool data
    poolId,
    poolData,
    isRwaPool,
    rwaOfferSlug,

    // Loading states
    loading,
    error,
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
