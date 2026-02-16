import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIntersectionObserver } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useRepositoryDefiLlama, type DefiLlamaYieldPool } from 'InvestCommon/data/3dParty/defillama.repository';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { ROUTE_EARN_OVERVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { mapOffersToRwaPools, type RwaEarnPoolFormatted } from 'InvestCommon/data/earn/rwaEarn.mapper';

export type { DefiLlamaYieldPool, DefiLlamaYieldPoolFormatted };

const INITIAL_VISIBLE_COUNT = 10;
const LOAD_MORE_INCREMENT = 10;
const PROTOCOL_NAME = 'aave' as const;
const INTERSECTION_ROOT_MARGIN = '100px';

/**
 * Filters pools by search query (symbol matching)
 */
function filterPoolsBySearch(
  pools: DefiLlamaYieldPoolFormatted[],
  searchQuery: string,
): DefiLlamaYieldPoolFormatted[] {
  if (!searchQuery.trim()) {
    return pools;
  }

  const searchLower = searchQuery.toLowerCase().trim();
  return pools.filter((pool) =>
    pool.symbol?.toLowerCase().includes(searchLower),
  );
}

export function useEarnTable() {
  const defiLlamaRepo = useRepositoryDefiLlama();
  const { getYieldsState } = storeToRefs(defiLlamaRepo);
  const offerRepository = useRepositoryOffer();
  const { getOffersState } = storeToRefs(offerRepository);
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const yieldsData = computed(() => getYieldsState.value.data ?? []);
  /**
   * Global loading state for the Earn table:
   * - DefiLlama yields are loading
   * - OR RWA offers are loading
   *
   * This ensures that the table shows a skeleton both on initial load
   * and whenever the underlying data set is being switched/refetched.
   */
  const loading = computed(
    () =>
      getYieldsState.value.loading ||
      getOffersState.value.loading,
  );
  const error = computed(
    () =>
      getYieldsState.value.error ||
      getOffersState.value.error,
  );

  const search = ref('');
  const visibleCount = ref(INITIAL_VISIBLE_COUNT);
  const sentinel = ref<HTMLElement | null>(null);

  // All stablecoin pools from DefiLlama
  const stablecoinPools = computed(() =>
    yieldsData.value.filter((pool) => pool.stablecoin === true),
  );

  // Primary USDC pool (kept as the single "real" USDC row)
  const primaryUsdcPool = computed<DefiLlamaYieldPoolFormatted | undefined>(() =>
    stablecoinPools.value.find(
      (pool) => pool.symbol?.toUpperCase().includes('USDC'),
    ),
  );

  /**
   * RWA rows derived from active offers, using the primary USDC pool
   * as the base for TVL/APY where available.
   */
  const rwaPools = computed<RwaEarnPoolFormatted[]>(() => {
    const container = getOffersState.value.data as { data?: IOfferFormatted[] } | undefined;
    const offers = container?.data ?? [];
    const activeOffers = offers.filter(
      (offer) => offer.isStatusPublished && !offer.isFundingCompleted,
    );

    return mapOffersToRwaPools(activeOffers, primaryUsdcPool.value);
  });

  // Final data: USDC + list of RWA offers, nothing else
  const allEarnPools = computed<DefiLlamaYieldPoolFormatted[]>(() => {
    const baseUsdc = primaryUsdcPool.value;
    const baseList = baseUsdc ? [baseUsdc] : [];
    return [
      ...baseList,
      ...rwaPools.value,
    ];
  });

  const filteredData = computed(() =>
    filterPoolsBySearch(allEarnPools.value, search.value),
  );

  const totalResults = computed(() => allEarnPools.value.length);
  const filterResults = computed(() => filteredData.value.length);

  const visibleData = computed(() =>
    filteredData.value.slice(0, visibleCount.value),
  );

  const hasMore = computed(() => visibleCount.value < filteredData.value.length);

  // Infinite scroll using intersection observer
  useIntersectionObserver(
    sentinel,
    ([{ isIntersecting }]) => {
      if (isIntersecting && hasMore.value && !loading.value) {
        visibleCount.value += LOAD_MORE_INCREMENT;
      }
    },
    {
      rootMargin: INTERSECTION_ROOT_MARGIN,
    },
  );

  // Reset visible count and scroll to top when search changes
  watch(search, () => {
    visibleCount.value = INITIAL_VISIBLE_COUNT;

    // Guard for non-browser environments
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      return;
    }

    // Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Load yields and offers on mount
  onMounted(() => {
    void defiLlamaRepo.getYields(PROTOCOL_NAME);

    if (!getOffersState.value.data) {
      void offerRepository.getOffers();
    }
  });

  const onRowClick = (pool: DefiLlamaYieldPoolFormatted) => {
    void router.push({
      name: ROUTE_EARN_OVERVIEW,
      params: {
        profileId: selectedUserProfileId.value,
        poolId: pool.pool,
      },
    });
  };

  /**
   * Manually refetch underlying data for the Earn table.
   * Triggers both DefiLlama yields and RWA offers reload.
   */
  const refetch = () => {
    void defiLlamaRepo.getYields(PROTOCOL_NAME);
    void offerRepository.getOffers();
  };

  return {
    search,
    loading,
    error,
    filteredData,
    visibleData,
    totalResults,
    filterResults,
    hasMore,
    sentinel,
    onRowClick,
    refetch,
  };
}

