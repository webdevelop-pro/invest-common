import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import env from 'InvestCommon/domain/config/env';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { IDistributions, IDistributionsMeta } from 'InvestCommon/data/distributions/distributions.types';
import { ref, computed } from 'vue';

const { DISTRIBUTIONS_URL } = env;

export const useRepositoryDistributions = defineStore('repository-distributions', () => {
  const apiClient = new ApiClient(DISTRIBUTIONS_URL);

  // Create action states for each function
  const getDistributionsState = createActionState<IDistributions>();
  const getDistributionsMetaState = ref<IDistributionsMeta>();

  const getDistributions = async (profileId?: string) => {
    try {
      getDistributionsState.value.loading = true;
      getDistributionsState.value.error = null;
      
      const response = await apiClient.get(`/auth/${profileId}/distribution`);

      getDistributionsState.value.data = response.data.data || [];
      getDistributionsMetaState.value = response.data.meta;
      return getDistributionsState.value.data;
    } catch (err) {
      getDistributionsState.value.error = err as Error;
      getDistributionsState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to fetch distributions');
      throw err;
    } finally {
      getDistributionsState.value.loading = false;
    }
  };


  const resetAll = () => {
    getDistributionsState.value = { loading: false, error: null, data: undefined };
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
