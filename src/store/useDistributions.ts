import { computed, ref, toRaw } from 'vue';
import { generalErrorHandling } from 'UiKit/helpers/generalErrorHandling';
import { fetchGetDistributions } from 'InvestCommon/services/api/distributions';
import { IDistributionsData, IDistributionsMeta } from 'InvestCommon/types/api/distributions';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useOfferStore } from './useOffer';

const transformDistributionsData = (data: IDistributionsData[], offersData: IInvest[]) => (
  data.map((investItem) => {
    const investment = toRaw(offersData.find((offerItem) => offerItem.id === investItem.investment_id));
    return {
      ...investItem,
      investment,
    } as IDistributionsData;
  })
);

export const useDistributionsStore = defineStore('distributions', () => {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const isGetDistributionsLoading = ref(false);
  const isGetDistributionsError = ref(false);
  const getDistributionsData = ref<IDistributionsData[]>();
  const getDistributionsMeta = ref<IDistributionsMeta>();
  const getDistributions = async () => {
    getDistributionsData.value = undefined;
    isGetDistributionsLoading.value = true;
    isGetDistributionsError.value = false;
    const response = await fetchGetDistributions().catch((error: Response) => {
      isGetDistributionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      const offerStore = useOfferStore();
      const { getInvestmentsData } = storeToRefs(offerStore);
      await offerStore.getConfirmedOffers(selectedUserProfileId.value);
      if (getInvestmentsData.value) {
        getDistributionsData.value = transformDistributionsData(response.data, getInvestmentsData.value?.data);
      }
      getDistributionsMeta.value = response.meta;
    }
    isGetDistributionsLoading.value = false;
  };

  const resetAll = () => {
    getDistributionsData.value = undefined;
  };

  const distributionGeograficData = computed(() => getDistributionsMeta.value?.geografic_data || []);
  const distributionGeograficLabels = computed(() => getDistributionsMeta.value?.geografic_labels || []);

  const distributionPerformanceData = computed(() => (getDistributionsMeta.value?.performance_data || []));
  const distributionPerformanceLabels = computed(() => (getDistributionsMeta.value?.performance_labels || []));

  return {
    resetAll,
    getDistributions,
    getDistributionsData,
    isGetDistributionsLoading,
    isGetDistributionsError,

    distributionPerformanceData,
    distributionPerformanceLabels,
    distributionGeograficData,
    distributionGeograficLabels,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionsStore, import.meta.hot));
}
