import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIntersectionObserver } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useRepositoryDefiLlama, type DefiLlamaYieldPool } from 'InvestCommon/data/3dParty/defillama.repository';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { ROUTE_EARN_OVERVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export type { DefiLlamaYieldPool, DefiLlamaYieldPoolFormatted };

export function useEarnTable() {
  const defiLlamaRepo = useRepositoryDefiLlama();
  const { getYieldsState } = storeToRefs(defiLlamaRepo);
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const yieldsData = computed(() => getYieldsState.value.data || []);
  const loading = computed(() => getYieldsState.value.loading);
  const error = computed(() => getYieldsState.value.error);
  
  const search = ref('');
  const visibleCount = ref(10);
  const sentinel = ref<HTMLElement | null>(null);

  const filteredData = computed(() => {
    // Filter only stablecoins
    let pools = yieldsData.value.filter((pool) => pool.stablecoin === true);
    
    // Apply search filter by symbol if provided
    if (search.value.trim()) {
      const searchLower = search.value.toLowerCase();
      pools = pools.filter((pool) => 
        pool.symbol?.toLowerCase().includes(searchLower)
      );
    }
    
    return pools;
  });

  const totalResults = computed(() => yieldsData.value.filter((pool) => pool.stablecoin === true).length);
  const filterResults = computed(() => filteredData.value.length);

  const visibleData = computed(() => {
    return filteredData.value.slice(0, visibleCount.value);
  });

  const hasMore = computed(() => visibleCount.value < filteredData.value.length);

  useIntersectionObserver(
    sentinel,
    ([{ isIntersecting }]) => {
      if (isIntersecting && hasMore.value) {
        visibleCount.value += 10;
      }
    },
    {
      rootMargin: '100px'
    }
  );

  // Reset visible count and scroll back to top when search changes
  watch(search, () => {
    visibleCount.value = 10;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Load yields on mount
  onMounted(() => {
    void defiLlamaRepo.getYields('aave');
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
    refetch: () => defiLlamaRepo.getYields('aave'),
  };
}

