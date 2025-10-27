import { ref, computed, watch } from 'vue';
import { defineStore, acceptHMRUpdate, storeToRefs } from 'pinia';
import { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useReactiveQuery } from 'UiKit/composables/useReactiveQuery';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';

// Status mapping from display names to actual values
const STATUS_MAPPING = {
  Confirmed: 'confirmed',
  'Legally Confirmed': 'legally_confirmed',
  'Cancelled After Investment': 'cancelled_after_investment',
  'Successfully Closed': 'successfully_closed',
} as const;

export const useDashboardPortfolioStore = defineStore('dashboard-portfolio', () => {
  const search = ref('');

  const query = useReactiveQuery();
  const queryId = computed(() => Number(query.value?.get('id')));
  const filterPortfolio = ref([
    {
      value: 'funding-type',
      title: 'By funding type:',
      options: ['Wire', 'Wallet', 'ACH'],
      model: [] as string[],
    },
    {
      value: 'status',
      title: 'By status:',
      options: [
        'Confirmed',
        'Legally Confirmed',
        'Cancelled After Investment',
        'Successfully Closed',
      ],
      model: [] as string[],
    },
  ] as IVFilter[]);

  // Intermediate refs that are only updated when Apply is clicked
  const filterFundingType = ref<string[]>([]);
  const filterStatus = ref<string[]>([]);

  // Store dependencies
  const investmentRepository = useRepositoryInvestment();
  const { getInvestmentsState } = storeToRefs(investmentRepository);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  // Getters
  const portfolioData = computed(() => getInvestmentsState.value.data?.data || []);
  const totalResults = computed(() => portfolioData.value.length);

  const isFiltering = computed(() => (
    filterFundingType.value.length > 0 || filterStatus.value.length > 0 || search.value?.length > 0));

  const filteredData = computed(() => {
    let filtered = portfolioData.value;

    // Apply funding type filter using intermediate ref
    if (filterFundingType.value?.length) {
      filtered = filtered.filter((item: IInvestmentFormatted) => (
        filterFundingType.value.includes(item.funding_type?.toLowerCase())));
    }

    // Apply status filter using intermediate ref
    if (filterStatus.value?.length) {
      filtered = filtered.filter((item: IInvestmentFormatted) => 
        filterStatus.value.includes(item.status));
    }

    // Apply search filter
    if (search.value) {
      const searchTerm = search.value.toLowerCase();
      filtered = filtered.filter((item: IInvestmentFormatted) => String(item.id).toLowerCase().includes(searchTerm)
        || item.offer.name.toLowerCase().includes(searchTerm));
    }

    return filtered;
  });

  const filterResults = computed(() => filteredData.value.length);


  const setSearch = (value: string) => {
    search.value = value;
  };

  const onApplyFilter = (items: IVFilter[]) => {
    filterPortfolio.value = items;

    // Update intermediate refs from filter settings
    const fundingTypeObject = items?.find((item: IVFilter) => item.value === 'funding-type');
    if (!fundingTypeObject) {
      filterFundingType.value = [];
    } else {
      filterFundingType.value = fundingTypeObject.model.map((type: string) => type.toLowerCase());
    }

    const statusObject = items?.find((item: IVFilter) => item.value === 'status');
    if (!statusObject) {
      filterStatus.value = [];
    } else {
      filterStatus.value = statusObject.model.map((displayName: string) => (
        STATUS_MAPPING[displayName as keyof typeof STATUS_MAPPING]));
    }
  };

  const resetFilters = () => {
    search.value = '';
    filterFundingType.value = [];
    filterStatus.value = [];
    filterPortfolio.value = filterPortfolio.value.map((filter) => ({
      ...filter,
      model: [] as string[],
    }));
  };

  const resetAll = () => {
    search.value = '';
    filterFundingType.value = [];
    filterStatus.value = [];
    filterPortfolio.value = filterPortfolio.value.map((filter: IVFilter) => ({
      ...filter,
      model: [] as string[],
    }));
  };

  // Watchers
  watch(() => selectedUserProfileId.value, () => {
    if (selectedUserProfileId.value && selectedUserProfileId.value > 0) {
      investmentRepository.getInvestments(selectedUserProfileId.value);
    }
  }, { immediate: true });

  return {
    // State
    portfolioData,
    search,
    filterPortfolio,
    queryId,
    getInvestmentsState,

    // Getters
    totalResults,
    isFiltering,
    filteredData,
    filterResults,

    // Actions
    setSearch,
    onApplyFilter,
    resetFilters,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardPortfolioStore, import.meta.hot));
}
