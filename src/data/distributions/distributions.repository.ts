import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import {
  applyOfflineHydrationMeta,
  createRepositoryStates,
  withActionState,
} from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { IDistributions, IDistributionsMeta, IDistributionFormatted } from 'InvestCommon/data/distributions/distributions.types';
import { ref, computed } from 'vue';

const { DISTRIBUTIONS_URL } = env;

type DistributionsStates = {
  getDistributionsState: IDistributionFormatted[];
};

export const useRepositoryDistributions = defineStore('repository-distributions', () => {
  const apiClient = new ApiClient(DISTRIBUTIONS_URL);

  const { getDistributionsState, resetAll: resetActionStates } = createRepositoryStates<DistributionsStates>({
    getDistributionsState: undefined,
  });
  const getDistributionsMetaState = ref<IDistributionsMeta>();

  const getDistributions = async (profileId?: string) => {
    let responseHeaders: Headers | null = null;
    const result = await withActionState(getDistributionsState, async () => {
      const response = await apiClient.get<IDistributions>(`/auth/${profileId}/distribution`);
      responseHeaders = response.headers;
      const list = response.data?.data || [];
      getDistributionsMetaState.value = response.data?.meta;
      return list;
    });
    if (responseHeaders) {
      applyOfflineHydrationMeta(getDistributionsState, responseHeaders);
    }
    return result;
  };

  const resetAll = () => {
    resetActionStates();
    getDistributionsMetaState.value = undefined;
  };

  const distributionGeograficData = computed(() => getDistributionsMetaState.value?.geografic_data || []);
  const distributionGeograficLabels = computed(() => getDistributionsMetaState.value?.geografic_labels || []);

  const distributionPerformanceData = computed(() => (getDistributionsMetaState.value?.performance_data || []));
  const distributionPerformanceLabels = computed(() => (getDistributionsMetaState.value?.performance_labels || []));

  return {
    // States
    getDistributionsState,
    getDistributionsMetaState,
    distributionGeograficData,
    distributionGeograficLabels,
    distributionPerformanceData,
    distributionPerformanceLabels,

    // Functions
    getDistributions,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryDistributions, import.meta.hot));
}
