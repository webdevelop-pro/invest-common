import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIntersectionObserver } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useRepositoryDefiLlama, type DefiLlamaYieldPool } from 'InvestCommon/data/3dParty/defillama.repository';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { ROUTE_EARN_OVERVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

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
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const yieldsData = computed(() => getYieldsState.value.data ?? []);
  const loading = computed(() => getYieldsState.value.loading);
  const error = computed(() => getYieldsState.value.error);

  const search = ref('');
  const visibleCount = ref(INITIAL_VISIBLE_COUNT);
  const sentinel = ref<HTMLElement | null>(null);

  // Memoize stablecoin pools to avoid recalculating
  const stablecoinPools = computed(() =>
    yieldsData.value.filter((pool) => pool.stablecoin === true),
  );

  const filteredData = computed(() =>
    filterPoolsBySearch(stablecoinPools.value, search.value),
  );

  const totalResults = computed(() => stablecoinPools.value.length);
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
    // Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Load yields on mount
  onMounted(() => {
    void defiLlamaRepo.getYields(PROTOCOL_NAME);
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

  const refetch = () => {
    defiLlamaRepo.getYields(PROTOCOL_NAME);
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

